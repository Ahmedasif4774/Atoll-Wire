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

// Default YouTube channel handle to auto-detect when no manual link is
// pasted into liveSettings.youtubeLiveUrl (see below). Change this (and
// redeploy) if the channel ever changes — it's a stable identifier, unlike
// a video ID.
const YOUTUBE_HANDLE = "NiyaaAcademy";

// Two separate cache lifetimes, both driven by plain fetch-level
// revalidate (no route-level `export const revalidate`, since these two
// calls genuinely want different freshness):
//  - The handle -> channelId lookup essentially never changes, so it's
//    cached for a full day. This also means the very first request each
//    day is the only one that spends a YouTube quota unit on it.
//  - The actual "is this video/channel live right now" check needs to be
//    fresh enough that the banner shows up promptly once a stream starts
//    and disappears promptly once it ends, so it's cached for only 30
//    seconds.
const CHANNEL_ID_REVALIDATE = 60 * 60 * 24;
const LIVE_CHECK_REVALIDATE = 30;

// Pulls a video ID out of any of the URL shapes YouTube hands out for a
// live stream (a channel's own live page, a watch link, or a youtu.be
// share link). Returns null for anything that isn't recognizably a
// YouTube video URL, so a garbled paste just fails closed instead of
// throwing.
function extractYouTubeVideoId(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1);
      return id || null;
    }
    if (url.hostname.endsWith("youtube.com")) {
      const watchId = url.searchParams.get("v");
      if (watchId) return watchId;
      // Handles /live/VIDEOID and /embed/VIDEOID style links.
      const match = url.pathname.match(/\/(?:live|embed)\/([^/?]+)/);
      if (match) return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

// Auto-detects whether YOUTUBE_HANDLE's channel is currently live, with no
// editor action needed at all: polls the channel itself, so it only ever
// shows *that* channel's own stream.
async function getChannelLiveVideoId(apiKey: string): Promise<string | null> {
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
    console.error("YouTube channel live check failed:", err);
    return null;
  }
}

// Checks whether a specific, manually-pasted video is live *right now*.
// This is what makes the manual link self-closing: unlike the Facebook
// field, nobody has to remember to come back and clear this one once the
// stream ends — the next poll just stops seeing liveBroadcastContent ===
// "live" and the banner drops it on its own.
async function isVideoCurrentlyLive(videoId: string, apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`,
      { next: { revalidate: LIVE_CHECK_REVALIDATE } }
    );
    if (!res.ok) throw new Error(`videos.list responded ${res.status}`);
    const body = await res.json();
    const liveBroadcastContent: string | undefined = body?.items?.[0]?.snippet?.liveBroadcastContent;
    return liveBroadcastContent === "live";
  } catch (err) {
    console.error("YouTube manual-link live check failed:", err);
    return false;
  }
}

async function getYouTubeLiveVideoId(manualUrl: string | null): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    // No key configured yet — fail closed (banner just stays hidden for
    // YouTube) rather than throwing, so the rest of the site is unaffected.
    return null;
  }

  // A manually-pasted link (any live event, not just YOUTUBE_HANDLE's own
  // channel) takes priority over the auto-detected channel, since an
  // editor pasting one is a deliberate "show this specific stream" choice.
  if (manualUrl) {
    const videoId = extractYouTubeVideoId(manualUrl);
    if (!videoId) return null;
    const isLive = await isVideoCurrentlyLive(videoId, apiKey);
    return isLive ? videoId : null;
  }

  return getChannelLiveVideoId(apiKey);
}

async function getLiveSettings(): Promise<{ facebookLiveUrl: string | null; youtubeLiveUrl: string | null }> {
  try {
    const settings = await sanityClient.fetch(liveSettingsQuery);
    const facebookLiveUrl: string | undefined = settings?.facebookLiveUrl;
    const youtubeLiveUrl: string | undefined = settings?.youtubeLiveUrl;
    return {
      facebookLiveUrl: facebookLiveUrl && facebookLiveUrl.trim() ? facebookLiveUrl.trim() : null,
      youtubeLiveUrl: youtubeLiveUrl && youtubeLiveUrl.trim() ? youtubeLiveUrl.trim() : null,
    };
  } catch (err) {
    console.error("Failed to read liveSettings from Sanity:", err);
    return { facebookLiveUrl: null, youtubeLiveUrl: null };
  }
}

export async function GET() {
  const { facebookLiveUrl, youtubeLiveUrl } = await getLiveSettings();
  const youtubeVideoId = await getYouTubeLiveVideoId(youtubeLiveUrl);

  return NextResponse.json({
    youtube: youtubeVideoId ? { videoId: youtubeVideoId } : null,
    facebook: facebookLiveUrl ? { url: facebookLiveUrl } : null,
  });
}
