"use client";

import { useEffect, useState } from "react";

export interface TopFacebookPost {
  handle: string;
  body: string;
  permalink: string | null;
  stats: string[];
  image?: string | null;
  noteDv?: string | null;
  noteEn?: string | null;
}

export interface TopXPost {
  url: string;
  handle: string;
  text: string | null;
  noteDv?: string | null;
  noteEn?: string | null;
}

export interface TopTikTokPost {
  url: string;
  handle: string;
  title: string | null;
  thumbnail: string | null;
  noteDv?: string | null;
  noteEn?: string | null;
}

export interface SocialTrendingData {
  facebook: TopFacebookPost | null;
  x: TopXPost | null;
  tiktok: TopTikTokPost | null;
}

// Fetches /api/social-trending, for HomePageClient to swap into the
// "socialTrending" sidebar's Facebook, X and TikTok cards in place of the
// static placeholder content in lib/homeConfig.*.ts:
//  - facebook: AtollWire's real top Facebook post of the day, fully
//    automatic (see that route for how it's picked).
//  - x: the post an editor pasted into Sanity's liveSettings.topXPostUrl,
//    with its author and text, or null if none is set — shown as a
//    compact link card (components/shared/SocialLinkCard.tsx).
//  - tiktok: the video an editor pasted into liveSettings.topTikTokPostUrl,
//    with its creator, caption and preview picture, or null if none is
//    set — shown with the same link card.
// Returns nulls until (and unless) real data loads — callers should keep
// showing the placeholder cards in that case, same fallback approach as
// PrayerWidget's FALLBACK_TIMES.
export function useSocialTrending(): SocialTrendingData {
  const [data, setData] = useState<SocialTrendingData>({
    facebook: null,
    x: null,
    tiktok: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/social-trending");
        const body = await res.json();
        if (!cancelled) {
          setData({
            facebook: body.facebook ?? null,
            x: body.x ?? null,
            tiktok: body.tiktok ?? null,
          });
        }
      } catch {
        // Keep showing the static placeholder cards.
      }
    }
    load();
    // The route's Facebook, X and TikTok sides only recompute every 30
    // minutes (see its `revalidate`), and the pasted links only change
    // when an editor publishes new ones — checking every 15 minutes here
    // picks everything up promptly without hammering the endpoint.
    const id = setInterval(load, 15 * 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return data;
}
