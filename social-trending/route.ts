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
//    post into Sanity; this route just passes that URL through for
//    components/shared/XPostEmbed.tsx to render with X's still-free oEmbed
//    widget.
//
// TikTok is not handled here yet — same paid-API tradeoff, not yet
// implemented.
const PAGE_ID = process.env.FB_PAGE_ID;
const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

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
}

async function getTopFacebookPost(): Promise<TopFacebookPost | null> {
  if (!PAGE_ID || !PAGE_ACCESS_TOKEN) return null;

  const fields = "message,permalink_url,created_time,likes.summary(true),comments.summary(true),shares";
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PAGE_ID}/posts?fields=${fields}&limit=25&access_token=${encodeURIComponent(PAGE_ACCESS_TOKEN)}`;

  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) throw new Error(`Graph API responded ${res.status}`);
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
    };
  } catch (err) {
    console.error("Failed to fetch top Facebook post:", err);
    return null;
  }
}

async function getTopXPostUrl(): Promise<string | null> {
  try {
    // liveSettingsQuery returns an array (see the comment on it in
    // lib/sanity/queries.ts) — same "take the first one in JS" pattern
    // app/api/live-status/route.ts uses.
    const allSettings = await sanityClient.fetch(liveSettingsQuery, {}, { cache: "no-store" });
    const settings = Array.isArray(allSettings) ? allSettings[0] : allSettings;
    const url: string | undefined = settings?.topXPostUrl;
    return url && url.trim() ? url.trim() : null;
  } catch (err) {
    console.error("Failed to read topXPostUrl from Sanity:", err);
    return null;
  }
}

export async function GET() {
  const [facebook, xUrl] = await Promise.all([getTopFacebookPost(), getTopXPostUrl()]);
  return NextResponse.json({ facebook, xUrl });
}
