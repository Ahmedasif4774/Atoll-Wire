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

// How fresh the "is this specific pasted video live right now" check needs
// to be, so the banner shows up promptly once a stream starts and
// disappears promptly once it ends.
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
    console.log("[live-status debug] videoId:", videoId, "liveBroadcastContent:", liveBroadcastContent);
    return liveBroadcastContent === "live";
  } catch (err) {
    console.error("YouTube manual-link live check failed:", err);
    return false;
  }
}

// YouTube only ever shows a stream when an editor deliberately pastes a
// link into liveSettings.youtubeLiveUrl — there is no "default channel"
// auto-detection. (An earlier version watched a specific channel handle
// automatically; that was only for testing and has been removed.)
async function getYouTubeLiveVideoId(manualUrl: string | null): Promise<string | null> {
  console.log("[live-status debug] manualUrl:", manualUrl);
  if (!manualUrl) return null;

  const apiKey = process.env.YOUTUBE_API_KEY;
  console.log("[live-status debug] apiKey present:", Boolean(apiKey), "length:", apiKey ? apiKey.length : 0);
  if (!apiKey) {
    // No key configured yet — fail closed (banner just stays hidden for
    // YouTube) rather than throwing, so the rest of the site is unaffected.
    return null;
  }

  const videoId = extractYouTubeVideoId(manualUrl);
  console.log("[live-status debug] extracted videoId:", videoId);
  if (!videoId) return null;
  const isLive = await isVideoCurrentlyLive(videoId, apiKey);
  console.log("[live-status debug] isLive:", isLive);
  return isLive ? videoId : null;
}

async function getLiveSettings(): Promise<{ facebookLiveUrl: string | null; youtubeLiveUrl: string | null }> {
  try {
    // --- TEMPORARY DEEP DEBUG ---
    // Log exactly which Sanity project/dataset this deployment is reading
    // from, and pull back EVERY liveSettings document with its raw _id
    // (not just the projected [0] result) so we can see whether the
    // document that Sanity's Vision tool finds actually exists here as a
    // normal published id, or only as a "drafts.xxx" id (which would mean
    // it was never really published to the live dataset — e.g. because it
    // was published into a pinned Content Release instead of straight to
    // "published").
    console.log(
      "[live-status debug] projectId:",
      process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      "dataset:",
      process.env.NEXT_PUBLIC_SANITY_DATASET || "production (default)"
    );
    const allDocs = await sanityClient.fetch(
      `*[_type == "liveSettings"]{ _id, _type, _rev, _updatedAt, youtubeLiveUrl, facebookLiveUrl }`
    );
    console.log("[live-status debug] ALL liveSettings docs (raw, unfiltered):", JSON.stringify(allDocs));
    // --- END TEMPORARY DEEP DEBUG ---

    const settings = await sanityClient.fetch(liveSettingsQuery);
    console.log("[live-status debug] raw settings from Sanity:", JSON.stringify(settings));
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
