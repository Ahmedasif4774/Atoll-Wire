// The homepage on the original static site was hand-curated (an editor
// choosing which article goes in the hero, which four go in "Latest", etc.)
// rather than generated from a rule ("newest first"). This config captures
// that curation as data, keyed by article slug — lib/data.ts resolves each
// slug to its real Article record, so titles/images/dates always match
// the article's own content instead of being retyped a second time.
//
// If/when this becomes a real Sanity-backed site, this maps naturally onto
// a "Homepage" singleton document with reference fields — see the note in
// lib/sanity/schemaTypes/README.md.

export const homeConfigDv = {
  heroSlug: "harbor",
  editorPairSlugs: ["football-squad", "medical-appeal"],
  latestMixed: [
    { slug: "feydhoo-flooding" },
    { slug: "fifa-ban-bassam" },
    { slug: "school-vaccine" },
    { slug: "night-market" },
    { slug: "remittance-slowdown" },
    { ad: true as const, badgeLabel: "ސްޕޮންސަރ", catLabel: "ސްޕޮންސަރ" },
    { slug: "cargo-route" },
    { slug: "coalition-talks" },
    { slug: "ferry-schedule" },
    { slug: "swimming-record" },
  ],
  sportSlugs: ["fifa-ban-bassam", "basketball-final", "volleyball-championship", "football-squad", "cricket-series"],
  worldSlugs: ["earthquake", "cargo-route", "trade-summit", "climate-agreement"],
  socialTrending: {
    heading: "📱 ސޯޝަލް މީޑިއާގައި ފާހަގަ ކޮށްލެވޭ",
    cards: [
      {
        platformBg: "#000",
        platformIcon: "𝕏",
        handle: "@atoll_reader92",
        body: "ބަނދަރު ތަރައްޤީގެ މަޝްރޫޢު ފެށުމަކީ ވަރަށް ބޮޑު ހަބަރެއް! 🎉 @AtollWire ގައި ފުރިހަމަ ތަފްޞީލު ބައްލަވާ",
        stats: ["🔁 342", "❤️ 1.2k"],
      },
      {
        platformBg: "#000",
        platformIcon: "♪",
        handle: "@maldives.today",
        tiktok: true,
        body: "ޤައުމީ ފުޓްބޯޅަ ޓީމުގެ ސްކޮޑް އިއުލާންކުރި ވަގުތުގެ ވީޑިއޯ 🔥⚽",
        stats: ["👁 89.4k", "❤️ 6.7k"],
      },
      {
        platformBg: "#1877F2",
        platformIcon: "f",
        handle: "Atoll Wire",
        body: "5 އަހަރުގެ ދަރިފުޅަށް އެހީއަށް އެދި ކުރި ޕޯސްޓަށް އާދަޔާ ޚިލާފު ތަރުޙީބެއް 💙 ހިއްސާކޮށްދެއްވާ",
        stats: ["💬 210", "👍 3.4k"],
      },
    ],
  },
  video: {
    title: "ވީޑިއޯ",
    items: [
      { image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=170&fit=crop", alt: "ވަޒީރު", caption: "ތެލުގެ އަގު ބަދަލުވުމާ ގުޅޭ ސުވާލުތަކަށް ވަޒީރު ޖަވާބުދެއްވަނީ" },
      { image: "https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=300&h=170&fit=crop", alt: "މަސް ބާޒާރު", caption: "އާ މަސް ބާޒާރު އެތެރެ" },
      { image: "https://images.unsplash.com/photo-1592210454359-9043f067919b?w=300&h=170&fit=crop", alt: "މޫސުން", caption: "ހަފްތާ ބަންދުގެ މޫސުން" },
      { image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=300&h=170&fit=crop", alt: "ފުޓްބޯޅަ", caption: "ލީގު ފެށޭ މެޗުގެ ހައިލައިޓްސް" },
    ],
  },
  adBanner: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1456&h=180&fit=crop",
  sidebarAdTop: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600&h=500&fit=crop",
  sidebarAdBottom: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600&h=500&fit=crop",
};
