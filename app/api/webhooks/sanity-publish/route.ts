import { NextResponse } from "next/server";
import crypto from "crypto";
import { sanityClient } from "@/lib/sanity/client";
import { SITE_URL } from "@/lib/siteUrl";
import { cleanEnv, getPageToken, GRAPH_VERSION } from "@/lib/facebookPageToken";
import { ensureArticleNumber } from "@/lib/articleNumbers";

// Auto-posts an article to the AtollWire Facebook Page as soon as it's
// approved in Sanity — see the "Facebook auto-posting" section in README.md
// for the one-time setup this depends on (creating the Sanity webhook,
// generating a Facebook Page access token, and setting the env vars below
// in Vercel). Nothing here works until that setup is done.
//
// How this gets called: a webhook configured in manage.sanity.io (Project
// -> API -> Webhooks) fires an HTTP POST here on every create/update to an
// `article` document. We deliberately don't trust that webhook's own
// GROQ filter alone to decide whether to post — every gate (approved status,
// the "Don't share to social media" checkbox, "already posted before") is
// re-checked here too, so a misconfigured filter in the Sanity dashboard
// can't accidentally spam the Page.
//
// Runs on the Node.js runtime (the default for an app/api route, but
// pinned explicitly since this needs the `crypto` module for signature
// verification, which isn't available on the Edge runtime).
export const runtime = "nodejs";

// Only articles published recently are auto-posted. Without this, saving or
// re-publishing ANY old approved article (there can be dozens from before
// auto-posting was working) would post it to Facebook as if it were news.
// Override with the SOCIAL_MAX_AGE_HOURS environment variable in Vercel.
const MAX_AGE_HOURS = Number(process.env.SOCIAL_MAX_AGE_HOURS) > 0 ? Number(process.env.SOCIAL_MAX_AGE_HOURS) : 48;

interface SanityWebhookPayload {
  _id: string;
  _type: string;
  status?: string;
  skipSocialShare?: boolean;
  socialPostedAt?: string | null;
  titleDv?: string;
  dekDv?: string;
  slug?: string;
}

// Verifies the `sanity-webhook-signature` header Sanity sends on every
// webhook request, so this endpoint only ever acts on requests that
// actually came from Sanity (not e.g. someone finding the URL and POSTing
// fake "approved" articles to spam the Facebook Page).
//
// Header format: "t=<unix-ms-timestamp>,v1=<signature>". The signature is
// an HMAC-SHA256 of `${t}.${rawBody}` using the shared webhook secret,
// base64url-encoded (this matches Sanity's own signing scheme — see
// https://www.sanity.io/docs/webhooks#5skv2iu6f101). Comparing with
// timingSafeEqual (rather than ===) avoids leaking timing information
// about how much of the signature matched.
function verifySanitySignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;

  const parts: Record<string, string> = {};
  for (const kv of signatureHeader.split(",")) {
    const idx = kv.indexOf("=");
    if (idx === -1) continue;
    parts[kv.slice(0, idx).trim()] = kv.slice(idx + 1).trim();
  }
  const { t, v1 } = parts;
  if (!t || !v1) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${t}.${rawBody}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(v1);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  const secret = process.env.SANITY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[sanity-publish webhook] SANITY_WEBHOOK_SECRET is not set — refusing every request until it is.");
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }

  const signature = req.headers.get("sanity-webhook-signature");
  if (!verifySanitySignature(rawBody, signature, secret)) {
    console.warn("[sanity-publish webhook] rejected a request with a missing/invalid signature");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: SanityWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (payload._type !== "article") {
    return NextResponse.json({ skipped: "not an article document" });
  }

  // Give the article its permanent public number (the 10234 in
  // /article/10234) the first time we see it — whether or not it's approved
  // or going to Facebook. Best-effort: if it fails (for example the API
  // token can't write), links simply keep using the slug until it works.
  let articleNumber: number | null = null;
  if (payload._id) {
    try {
      articleNumber = await ensureArticleNumber(payload._id);
    } catch (err) {
      console.error("[sanity-publish webhook] could not assign an article number:", err);
    }
  }

  // ---- Gates: any one of these being true means "don't post" ----
  if (payload.status !== "approved") {
    return NextResponse.json({ skipped: "article is not Approved" });
  }
  if (payload.skipSocialShare) {
    return NextResponse.json({ skipped: "'Don't share to social media' is ticked" });
  }
  if (payload.socialPostedAt) {
    // Already posted once (e.g. this fired again because someone fixed a
    // typo after approval) — never post the same article twice.
    return NextResponse.json({ skipped: "already posted" });
  }
  if (!payload._id) {
    console.error("[sanity-publish webhook] payload missing _id — check the webhook's GROQ projection:", payload);
    return NextResponse.json({ error: "incomplete payload — check webhook projection" }, { status: 400 });
  }

  // Read the article's own details from Sanity (rather than trusting the
  // webhook's payload, which only carries what its projection selects): its
  // publish date for the recency gate, and its titles/slug for the post.
  // Recency gate: refuse to post anything older than MAX_AGE_HOURS. If the
  // date can't be determined, don't post.
  let article: {
    publishedAt?: string;
    _createdAt?: string;
    titleDv?: string;
    titleEn?: string;
    dekDv?: string;
    dekEn?: string;
    slug?: string;
  } | null = null;
  try {
    article = await sanityClient.fetch(
      `*[_id == $id][0]{ publishedAt, _createdAt, titleDv, titleEn, dekDv, dekEn, "slug": slug.current }`,
      { id: payload._id },
      { cache: "no-store" },
    );
    const when = article?.publishedAt ?? article?._createdAt;
    const ageMs = when ? Date.now() - new Date(when).getTime() : NaN;
    if (!Number.isFinite(ageMs)) {
      return NextResponse.json({ skipped: "could not determine the article's publish date" });
    }
    if (ageMs > MAX_AGE_HOURS * 3600 * 1000) {
      return NextResponse.json({ skipped: `article is older than ${MAX_AGE_HOURS} hours` });
    }
  } catch (err) {
    console.error("[sanity-publish webhook] could not check article date — not posting:", err);
    return NextResponse.json({ skipped: "could not check article date" });
  }

  // Which language is the story in? A Dhivehi story is posted in Dhivehi and
  // links to the Dhivehi site; an English-only story is posted in English and
  // links to the English site. (A story with both is posted in Dhivehi, as
  // before.)
  const titleDv = (article?.titleDv ?? payload.titleDv ?? "").trim();
  const titleEn = (article?.titleEn ?? "").trim();
  const useDhivehi = titleDv.length > 0;
  const title = useDhivehi ? titleDv : titleEn;
  const dek = useDhivehi ? (article?.dekDv ?? payload.dekDv) : article?.dekEn;
  if (!title) {
    console.error("[sanity-publish webhook] article has no title in either language — not posting:", payload._id);
    return NextResponse.json({ skipped: "article has no title" });
  }

  const pageId = cleanEnv(process.env.FB_PAGE_ID);
  const savedToken = cleanEnv(process.env.FB_PAGE_ACCESS_TOKEN);
  if (!pageId || !savedToken) {
    console.error("[sanity-publish webhook] FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN not set — cannot post to Facebook.");
    return NextResponse.json({ error: "Facebook credentials not configured" }, { status: 500 });
  }

  // Posts the Dhivehi title/dek with a plain link — Facebook's own scraper
  // builds the preview card (image/title/description) from the target
  // page's Open Graph tags (see generateMetadata in
  // app/(dv)/article/[slug]/page.tsx), so we don't need to attach an image
  // here ourselves.
  const slug = article?.slug ?? payload.slug;
  const articlePath = useDhivehi ? "/article" : "/en/article";
  const articleUrl = `${SITE_URL}${articlePath}/${articleNumber ?? slug}`;
  const message = [title, dek].filter(Boolean).join("\n\n");

  // Posting needs the Page's own token; swap the saved (system-user) token
  // for it when possible.
  const accessToken = await getPageToken(pageId, savedToken);

  let fbPostId: string | null = null;
  try {
    const fbRes = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, link: articleUrl, access_token: accessToken }),
    });
    const fbData = await fbRes.json();
    if (!fbRes.ok) {
      console.error("[sanity-publish webhook] Facebook API rejected the post:", fbData);
      return NextResponse.json({ error: "Facebook API error", details: fbData }, { status: 502 });
    }
    fbPostId = fbData.id ?? null;
  } catch (err) {
    console.error("[sanity-publish webhook] request to Facebook failed:", err);
    return NextResponse.json({ error: "Facebook request failed" }, { status: 502 });
  }

  // Record that this article has been posted so a later edit (which fires
  // this same webhook again) doesn't post it a second time. This uses the
  // same SANITY_API_TOKEN the rest of the app reads with — it needs
  // Editor (write) access, not just Viewer, for this patch to succeed.
  try {
    await sanityClient
      .patch(payload._id)
      .set({ socialPostedAt: new Date().toISOString(), socialPostId: fbPostId })
      .commit();
  } catch (err) {
    // The Facebook post already went out at this point, so this isn't
    // reported as a failure to the webhook caller — but it's logged
    // loudly, since without this write the article could get posted again
    // on the next edit.
    console.error("[sanity-publish webhook] posted to Facebook but failed to record socialPostedAt:", err);
  }

  return NextResponse.json({ ok: true, postId: fbPostId });
}

// Read-only health check: open /api/webhooks/sanity-publish in a browser to
// see whether everything auto-posting needs is in place, WITHOUT posting
// anything. Shows only yes/no answers and counts — never tokens or secrets.
export const dynamic = "force-dynamic";

export async function GET() {
  const pageId = cleanEnv(process.env.FB_PAGE_ID);
  const savedToken = cleanEnv(process.env.FB_PAGE_ACCESS_TOKEN);
  const report: Record<string, unknown> = {
    webhookSecretSet: !!process.env.SANITY_WEBHOOK_SECRET,
    facebookPageIdSet: !!pageId,
    facebookTokenSet: !!savedToken,
    siteUrlUsedInPosts: SITE_URL,
  };

  if (pageId && savedToken) {
    try {
      const pageRes = await fetch(
        `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}?fields=id,name,access_token&access_token=${encodeURIComponent(savedToken)}`,
        { cache: "no-store" },
      );
      const page = await pageRes.json();
      report.facebookPage = pageRes.ok
        ? { found: true, name: page?.name ?? null, pageTokenAvailable: !!page?.access_token }
        : { found: false, error: String(page?.error?.message ?? pageRes.status).slice(0, 200) };

      const permRes = await fetch(
        `https://graph.facebook.com/${GRAPH_VERSION}/me/permissions?access_token=${encodeURIComponent(savedToken)}`,
        { cache: "no-store" },
      );
      const perms = await permRes.json();
      report.tokenCanPost = permRes.ok
        ? (perms?.data ?? []).some((d: { permission: string; status: string }) => d.permission === "pages_manage_posts" && d.status === "granted")
        : "unknown";
    } catch (err) {
      report.facebookCheckError = (err instanceof Error ? err.message : String(err)).slice(0, 200);
    }
  }

  try {
    report.articlesApprovedNotYetPosted = await sanityClient.fetch(
      `count(*[_type == "article" && status == "approved" && !(_id in path("drafts.**")) && !defined(socialPostedAt) && skipSocialShare != true])`,
      {},
      { cache: "no-store" },
    );
    const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 3600 * 1000).toISOString();
    report.autoPostWindowHours = MAX_AGE_HOURS;
    report.articlesThatWouldPostIfSavedNow = await sanityClient.fetch(
      `count(*[_type == "article" && status == "approved" && !(_id in path("drafts.**")) && !defined(socialPostedAt) && skipSocialShare != true && coalesce(publishedAt, _createdAt) >= $cutoff])`,
      { cutoff },
      { cache: "no-store" },
    );
    report.articlesWithoutNumber = await sanityClient.fetch(
      `count(*[_type == "article" && !(_id in path("drafts.**")) && count(*[_id == "articleNumber." + ^._id]) == 0])`,
      {},
      { cache: "no-store" },
    );
    report.articlesAlreadyPosted = await sanityClient.fetch(
      `count(*[_type == "article" && !(_id in path("drafts.**")) && defined(socialPostedAt)])`,
      {},
      { cache: "no-store" },
    );
  } catch (err) {
    report.sanityReadError = (err instanceof Error ? err.message : String(err)).slice(0, 200);
  }

  return NextResponse.json(report);
}
