import { NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity/client";
import { liveSettingsQuery } from "@/lib/sanity/queries";

// Without this, Next.js sees a GET handler that makes no explicit use of
// cookies/headers/searchParams and treats it as eligible for STATIC
// generation — meaning it would call this route exactly once at BUILD
// time (in a sandboxed environment that may not have real network access
// or the right env vars) and then serve that single frozen response to
// every visitor forever, regardless of the per-fetch `revalidate` values
// below. That's exactly what was happening: the build's one-time call
// failed/returned nothing, and the resulting `{youtube:null,facebook:null}`
// got baked in as a static response no live stream could ever change.
// Forcing this route dynamic makes Next.js actually execute GET() again
// on every request, so the per-fetch revalidate windows below do their
// intended job instead of being moot.
export const dynamic = "force-dynamic";

// YouTube channel handle to watch. Change this (and redeploy) if the
// channel ever changes — it's a stable identifier, unlike a video ID.
const YOUTUBE_HANDLE = "NiyaaAcademy";

// Two separate cache lifetimes, both driven by plain fetch-level
// revalidate (no route-level `export const revalidate`, since these two
// calls genuinely want different freshness):
//  - The handle -> channelId lookup essentially never changes, so it's
//    cached for a full day. This also means the very first request each
//    day is the only one that spends a YouTube quota unit on it.
//  - The actual "is this channel live right now" check needs to be fresh
//    enough that the banner shows up promptly once a stream starts and
//    disappears promptly once it ends, so it's cached for only 30 seconds.
const CHANNEL_ID_REVALIDATE = 60 * 60 * 24;
const LIVE_CHECK_REVALIDATE = 30;

async function getYouTubeLiveVideoId(): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    // No key configured yet — fail closed (banner just stays hidden for
    // YouTube) rather than throwing, so the rest of the site is unaffected.
    return null;
  }

  try {
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${YOUTUBE_HANDLE}&key=${apiKey}`,
      { next: { revalidate: CHANNEL_ID_REVALIDATE } }
    );
    if (!channelRes.ok) throw new Error(`channels.list responded ${channelRes.status}`);
    const channelBody = await channelRes.json();
    const channelId: string | undefined = channelBody?.items?.[0]?.id;
    if (!channelId) return null;

    const liveRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`,
      { next: { revalidate: LIVE_CHECK_REVALIDATE } }
    );
    if (!liveRes.ok) throw new Error(`search.list responded ${liveRes.status}`);
    const liveBody = await liveRes.json();
    const videoId: string | undefined = liveBody?.items?.[0]?.id?.videoId;
    return videoId ?? null;
  } catch (err) {
    console.error("YouTube live check failed:", err);
    return null;
  }
}

async function getFacebookLiveUrl(): Promise<string | null> {
  try {
    const settings = await sanityClient.fetch(liveSettingsQuery);
    const url: string | undefined = settings?.facebookLiveUrl;
    return url && url.trim() ? url.trim() : null;
  } catch (err) {
    console.error("Failed to read liveSettings from Sanity:", err);
    return null;
  }
}

export async function GET() {
  const [youtubeVideoId, facebookLiveUrl] = await Promise.all([
    getYouTubeLiveVideoId(),
    getFacebookLiveUrl(),
  ]);

  return NextResponse.json({
    youtube: youtubeVideoId ? { videoId: youtubeVideoId } : null,
    facebook: facebookLiveUrl ? { url: facebookLiveUrl } : null,
  });
}
