// English mirror of homeConfig.dv.ts — same curation (same article slugs),
// just the English-language widget copy (social posts, video captions).
// See homeConfig.dv.ts for the general explanation of this file's shape.

import type { LatestMixedEntry } from "./types";

export const homeConfigEn = {
  heroSlug: "harbor",
  editorPairSlugs: ["football-squad", "medical-appeal"],
  latestMixed: [
    { slug: "feydhoo-flooding" },
    { slug: "fifa-ban-bassam" },
    { slug: "school-vaccine" },
    { slug: "night-market" },
    { slug: "remittance-slowdown" },
    { ad: true as const, badgeLabel: "Sponsor", catLabel: "Sponsored" },
    { slug: "cargo-route" },
    { slug: "coalition-talks" },
    { slug: "ferry-schedule" },
    { slug: "swimming-record" },
  ] as LatestMixedEntry[],
  sportSlugs: ["fifa-ban-bassam", "basketball-final", "volleyball-championship", "football-squad", "cricket-series"],
  worldSlugs: ["earthquake", "cargo-route", "trade-summit", "climate-agreement"],
  socialTrending: {
    heading: "📱 Trending on Social Media",
    cards: [
      {
        platformBg: "#000",
        platformIcon: "𝕏",
        handle: "@atoll_reader92",
        body: "Big news for the harbour project! 🎉 Full details on @AtollWire",
        stats: ["🔁 342", "❤️ 1.2k"],
      },
      {
        platformBg: "#000",
        platformIcon: "♪",
        handle: "@maldives.today",
        tiktok: true,
        body: "The moment the national football squad was announced 🔥⚽",
        stats: ["👁 89.4k", "❤️ 6.7k"],
      },
      {
        platformBg: "#1877F2",
        platformIcon: "f",
        handle: "Atoll Wire",
        body: "Incredible response to our post about the 5-year-old needing surgery 💙 please share",
        stats: ["💬 210", "👍 3.4k"],
      },
    ],
  },
  video: {
    title: "Video",
    items: [
      { image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=170&fit=crop", alt: "Minister", caption: "Minister answers questions on fuel price changes" },
      { image: "https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=300&h=170&fit=crop", alt: "Fish market", caption: "Inside the new fish market" },
      { image: "https://images.unsplash.com/photo-1592210454359-9043f067919b?w=300&h=170&fit=crop", alt: "Weather", caption: "Weekend weather outlook" },
      { image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=300&h=170&fit=crop", alt: "Football", caption: "Highlights from the league opener" },
    ],
  },
  adBanner: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1456&h=180&fit=crop",
  sidebarAdTop: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600&h=500&fit=crop",
  sidebarAdBottom: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600&h=500&fit=crop",
};
