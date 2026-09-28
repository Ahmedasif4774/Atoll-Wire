import { NextResponse } from "next/server";
import crypto from "crypto";
import { sanityClient } from "@/lib/sanity/client";
import { SITE_URL } from "@/lib/siteUrl";

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

  // ---- Gates: any one of these being true means "don't post" ----
  if (payload._type !== "article") {
    return NextResponse.json({ skipped: "not an article document" });
  }
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
  if (!payload._id || !payload.slug || !payload.titleDv) {
    // Most likely cause: the webhook's projection in manage.sanity.io
    // doesn't select these fields. See README.md's setup section for the
    // exact projection this endpoint expects.
    console.error("[sanity-publish webhook] payload missing _id/slug/titleDv — check the webhook's GROQ projection:", payload);
    return NextResponse.json({ error: "incomplete payload — check webhook projection" }, { status: 400 });
  }

  const pageId = process.env.FB_PAGE_ID;
  const accessToken = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!pageId || !accessToken) {
    console.error("[sanity-publish webhook] FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN not set — cannot post to Facebook.");
    return NextResponse.json({ error: "Facebook credentials not configured" }, { status: 500 });
  }

  // Posts the Dhivehi title/dek with a plain link — Facebook's own scraper
  // builds the preview card (image/title/description) from the target
  // page's Open Graph tags (see generateMetadata in
  // app/(dv)/article/[slug]/page.tsx), so we don't need to attach an image
  // here ourselves.
  const articleUrl = `${SITE_URL}/article/${payload.slug}`;
  const message = [payload.titleDv, payload.dekDv].filter(Boolean).join("\n\n");

  let fbPostId: string | null = null;
  try {
    const fbRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
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
