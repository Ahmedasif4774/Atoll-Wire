"use client";

import { useEffect, useState } from "react";

export interface TopFacebookPost {
  handle: string;
  body: string;
  permalink: string | null;
  stats: string[];
}

export interface TopTikTokPost {
  url: string;
  html: string | null;
}

export interface SocialTrendingData {
  facebook: TopFacebookPost | null;
  xUrl: string | null;
  tiktok: TopTikTokPost | null;
}

// Fetches /api/social-trending, for HomePageClient to swap into the
// "socialTrending" sidebar's Facebook, X and TikTok cards in place of the
// static placeholder content in lib/homeConfig.*.ts:
//  - facebook: AtollWire's real top Facebook post of the day, fully
//    automatic (see that route for how it's picked).
//  - xUrl: the URL an editor pasted into Sanity's liveSettings.topXPostUrl
//    for today's best X post, or null if none is set — rendered with
//    components/shared/XPostEmbed.tsx.
//  - tiktok: the URL an editor pasted into liveSettings.topTikTokPostUrl,
//    plus the ready-made embed HTML TikTok's oEmbed endpoint returned for
//    it (null if that fetch failed) — rendered with
//    components/shared/TikTokEmbed.tsx.
// Returns nulls until (and unless) real data loads — callers should keep
// showing the placeholder cards in that case, same fallback approach as
// PrayerWidget's FALLBACK_TIMES.
export function useSocialTrending(): SocialTrendingData {
  const [data, setData] = useState<SocialTrendingData>({
    facebook: null,
    xUrl: null,
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
            xUrl: body.xUrl ?? null,
            tiktok: body.tiktok ?? null,
          });
        }
      } catch {
        // Keep showing the static placeholder cards.
      }
    }
    load();
    // The route's Facebook and TikTok sides only recompute every 30 minutes
    // (see its `revalidate`), and the X URL only changes when an editor
    // publishes a new one — checking every 15 minutes here picks all of
    // them up promptly without hammering the endpoint.
    const id = setInterval(load, 15 * 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return data;
}
