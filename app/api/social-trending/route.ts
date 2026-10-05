import { NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity/client";
import { liveSettingsQuery } from "@/lib/sanity/queries";

// Powers the homepage's "socialTrending" sidebar cards with real content in
// place of the hardcoded placeholder posts in lib/homeConfig.*.ts:
//
//  - Facebook: AtollWire's actual best-performing Facebook post of the day,
//    computed below from the Graph API (reusing the same FB_PAGE_ID /
//    FB_PAGE_ACCESS_TOKEN already set up for auto-posting — see
//    app/api/webhooks/sanity-publish/route.ts and README.md "Facebook
//    auto-posting"). Fully automatic, no editor action needed.
//  - X (Twitter): X's API has had no free tier at all since 2023 — there is
//    no way to automatically find "today's top post" without paying. The
//    free workaround (see lib/sanity/schemaTypes/liveSettings.ts's
//    topXPostUrl field) is an editor pasting the URL of the day's best X
//    post into Sanity. This route looks that post up through X's still-free
//    oEmbed endpoint (author + text) so the homepage can show it as a
//    compact link card (components/shared/SocialLinkCard.tsx) that opens
//    the real post on X when tapped.
//  - TikTok: same paid-API tradeoff as X — an editor pastes the URL of the
//    day's best TikTok video into Sanity's topTikTokPostUrl field. TikTok's
//    free oEmbed endpoint is fetched here server-side to get the creator,
//    caption and a preview picture for the same kind of link card.
// Values pasted into Vercel often pick up a stray space, line break or pair
// of quotes — any of which makes Facebook answer "Invalid OAuth access
// token" — so clean them up before use.
function cleanEnv(value: string | undefined): string | undefined {
  const v = value?.trim().replace(/^["']+|["']+$/g, "").trim();
  return v || undefined;
}
const PAGE_ID = cleanEnv(process.env.FB_PAGE_ID);
const PAGE_ACCESS_TOKEN = cleanEnv(process.env.FB_PAGE_ACCESS_TOKEN);

const GRAPH_VERSION = "v19.0";

// "Today's top post" doesn't need to be recomputed on every homepage view —
// checking every 30 minutes is plenty and keeps this well within the Page
// token's Graph API rate limit.
export const revalidate = 1800;

// Same fixed UTC+5 trick used elsewhere in this app (see lib/liveDate.ts,
// PrayerWidget, PrayerNotification) to compute "today" in Malé regardless
// of the server's own timezone.
function maldivesDateKey(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 5 * 60 * 60000);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

function formatCount(n: number): string {
  if (n >= 10000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

interface FacebookPost {
  message?: string;
  permalink_url?: string;
  full_picture?: string;
  created_time: string;
  likes?: { summary?: { total_count?: number } };
  comments?: { summary?: { total_count?: number } };
  shares?: { count?: number };
}

interface TopFacebookPost {
  handle: string;
  body: string;
  permalink: string | null;
  stats: string[];
  image: string | null;
}

// A system-user token (the never-expiring kind made in Business Settings)
// usually has to be swapped for the Page's own token before the Page's posts
// can be read. If that swap isn't possible we just use the token as given.
async function resolvePageToken(): Promise<string> {
  const fallback = PAGE_ACCESS_TOKEN as string;
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PAGE_ID}?fields=access_token&access_token=${encodeURIComponent(fallback)}`,
      { next: { revalidate } }
    );
    if (!res.ok) return fallback;
    const body = await res.json();
    return typeof body?.access_token === "string" && body.access_token ? body.access_token : fallback;
  } catch {
    return fallback;
  }
}

// `errors` collects a short reason when Facebook can't be read, so GET can
// show it in its response (it never contains the token) — that makes setup
// problems visible without digging through Vercel's build logs.
async function getTopFacebookPost(errors: string[]): Promise<TopFacebookPost | null> {
  if (!PAGE_ID) {
    errors.push("FB_PAGE_ID is not set");
    return null;
  }
  if (!PAGE_ACCESS_TOKEN) {
    errors.push("FB_PAGE_ACCESS_TOKEN is not set");
    return null;
  }
  const token = await resolvePageToken();

  const fields = "message,permalink_url,full_picture,created_time,likes.summary(true),comments.summary(true),shares";
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PAGE_ID}/posts?fields=${fields}&limit=25&access_token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(url, { next: { revalidate } });
       if (!res.ok) throw new Error(`Graph API responded ${res.status}: ${await res.text()}`);
    const body = await res.json();
    const posts: FacebookPost[] = body?.data ?? [];
    if (!posts.length) throw new Error("No posts returned");

    const today = maldivesDateKey(new Date().toISOString());
    const todaysPosts = posts.filter((p) => maldivesDateKey(p.created_time) === today);
    // Nothing posted yet today (e.g. early morning) — fall back to the most
    // recent handful of posts so the card still shows something real
    // rather than going empty.
    const pool = todaysPosts.length ? todaysPosts : posts.slice(0, 5);

    const scored = pool
      .filter((p) => !!p.message)
      .map((p) => {
        const likes = p.likes?.summary?.total_count ?? 0;
        const comments = p.comments?.summary?.total_count ?? 0;
        const shares = p.shares?.count ?? 0;
        return { post: p, score: likes + comments + shares, likes, comments };
      })
      .sort((a, b) => b.score - a.score);

    const top = scored[0];
    if (!top) throw new Error("No post with text found to show");

    const message = top.post.message!;
    const preview = message.length > 160 ? `${message.slice(0, 160).trim()}…` : message;

    return {
      handle: "Atoll Wire",
      body: preview,
      permalink: top.post.permalink_url ?? null,
      stats: [`💬 ${formatCount(top.comments)}`, `👍 ${formatCount(top.likes)}`],
      image: top.post.full_picture ?? null,
    };
  } catch (err) {
    console.error("Failed to fetch top Facebook post:", err);
    errors.push(
      (err instanceof Error ? err.message : String(err)).split(token).join("[token]").slice(0, 400)
    );
    return null;
  }
}

interface LiveSettings {
  topXPostUrl?: string;
  topTikTokPostUrl?: string;
}

async function getLiveSettings(): Promise<LiveSettings> {
  try {
    const allSettings = await sanityClient.fetch(liveSettingsQuery, {}, { cache: "no-store" });
    const settings = Array.isArray(allSettings) ? allSettings[0] : allSettings;
    return settings ?? {};
  } catch (err) {
    console.error("Failed to read liveSettings from Sanity:", err);
    return {};
  }
}

// Strips tracking junk like "?_r=1&_t=..." from a pasted link, but only for
// full post links (short share links like vt.tiktok.com/xxxx need to stay
// exactly as pasted to keep working).
function cleanPostUrl(url: string, markers: string[]): string {
  return markers.some((m) => url.includes(m)) ? url.split("?")[0] : url;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&nbsp;/g, " ");
}

interface TopTikTokPost {
  url: string;
  handle: string;
  title: string | null;
  thumbnail: string | null;
}

function tiktokHandleFromUrl(url: string): string {
  const match = url.match(/tiktok\.com\/(@[^/?#]+)/i);
  return match ? match[1] : "TikTok";
}

async function getTopTikTokPost(url: string | undefined): Promise<TopTikTokPost | null> {
  const trimmed = url && url.trim() ? url.trim() : null;
  if (!trimmed) return null;

  const link = cleanPostUrl(trimmed, ["/video/", "/photo/"]);
  // Even if TikTok's lookup below fails, we still return the link (and the
  // creator's handle if it's visible in the URL) so the card can show up
  // and open the video.
  const fallback: TopTikTokPost = {
    url: link,
    handle: tiktokHandleFromUrl(link),
    title: null,
    thumbnail: null,
  };

  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(link)}`, {
      next: { revalidate },
    });
    if (!res.ok) throw new Error(`TikTok oEmbed responded ${res.status}`);
    const body = await res.json();
    const uniqueId: string | null =
      typeof body?.author_unique_id === "string" && body.author_unique_id
        ? `@${body.author_unique_id}`
        : null;
    const authorName: string | null =
      typeof body?.author_name === "string" && body.author_name ? body.author_name : null;
    const title: string | null =
      typeof body?.title === "string" && body.title.trim() ? body.title.trim() : null;
    const thumbnail: string | null =
      typeof body?.thumbnail_url === "string" && body.thumbnail_url ? body.thumbnail_url : null;
    return {
      url: link,
      handle: uniqueId ?? authorName ?? fallback.handle,
      title,
      thumbnail,
    };
  } catch (err) {
    console.error("Failed to fetch TikTok oEmbed info:", err);
    return fallback;
  }
}

interface TopXPost {
  url: string;
  handle: string;
  text: string | null;
}

function xHandleFromUrl(url: string): string {
  const match = url.match(/(?:twitter|x)\.com\/([^/?#]+)\/status/i);
  return match ? `@${match[1]}` : "X";
}

async function getTopXPost(url: string | undefined): Promise<TopXPost | null> {
  const trimmed = url && url.trim() ? url.trim() : null;
  if (!trimmed) return null;

  const link = cleanPostUrl(trimmed, ["/status/"]);
  const fallback: TopXPost = { url: link, handle: xHandleFromUrl(link), text: null };

  try {
    const res = await fetch(
      `https://publish.twitter.com/oembed?url=${encodeURIComponent(link)}&omit_script=1&dnt=true`,
      { next: { revalidate } },
    );
    if (!res.ok) throw new Error(`X oEmbed responded ${res.status}`);
    const body = await res.json();

    // X's oEmbed returns the post as a ready-made HTML blockquote; the
    // post text is the first <p> inside it.
    const html: string = typeof body?.html === "string" ? body.html : "";
    const paragraph = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    let text = paragraph
      ? decodeEntities(paragraph[1].replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, ""))
          .replace(/\s+/g, " ")
          .trim()
      : "";
    if (text.length > 200) text = `${text.slice(0, 200).trim()}…`;

    const authorMatch =
      typeof body?.author_url === "string"
        ? body.author_url.match(/(?:twitter|x)\.com\/([^/?#]+)/i)
        : null;

    return {
      url: link,
      handle: authorMatch ? `@${authorMatch[1]}` : fallback.handle,
      text: text || null,
    };
  } catch (err) {
    console.error("Failed to fetch X oEmbed info:", err);
    return fallback;
  }
}

export async function GET() {
  const settings = await getLiveSettings();
  const fbErrors: string[] = [];
  const [facebook, x, tiktok] = await Promise.all([
    getTopFacebookPost(fbErrors),
    getTopXPost(settings.topXPostUrl),
    getTopTikTokPost(settings.topTikTokPostUrl),
  ]);
  return NextResponse.json({ facebook, x, tiktok, ...(facebook ? {} : { facebookError: fbErrors[0] ?? null }) });
}
