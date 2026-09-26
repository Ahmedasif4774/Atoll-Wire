// Shared content types — this is the Phase 0 content model from the
// roadmap, implemented as plain TypeScript types so the same shapes work
// whether the data underneath is the local mock JSON (data/content.json)
// or a real Sanity dataset (see lib/sanity/*). Keeping one shape for both
// is what makes swapping the data source later a small change instead of
// a rewrite.

export type Lang = "dv" | "en";

export type CategorySlug =
  | "news"
  | "sport"
  | "business"
  | "world"
  | "report"
  | "lifestyle"
  | "help"
  | "fundraising";

export interface Category {
  slug: CategorySlug;
  labelDv: string;
  labelEn: string;
}

export interface Author {
  name: string;
  initials: string;
}

export interface ImageRef {
  url: string;
  alt: string;
}

// How wide an in-body photo displays. "large" (the original, only size
// before this field existed) fills the article's text column, matching
// every photo block saved before the size picker was added.
export type PhotoSize = "small" | "medium" | "large" | "full";

export type ArticleBodyBlock =
  | { type: "paragrap
  | { type: "ad"; imageUrl: string; alt: string }
  // An editor-inserted photo within the article body (distinct from the
  // required top-of-article heroImage) — alt text and caption are both
  // optional since an editor may not fill them in for every photo.
    | { type: "photo"; imageUrl: string; alt?: string; caption?: string; size?: PhotoSize }
  // A YouTube/Vimeo link an editor pasted into the body. `embedUrl` is the
  // already-converted iframe-embeddable URL (see lib/videoEmbed.ts) — null
  // when the pasted link couldn't be recognized, so the template can skip
  // rendering a broken iframe instead of showing one.
  | { type: "video"; embedUrl: string | null; caption?: string };

export interface DonationBankDetail {
  label: string;
  value: string;
}

export interface DonationDocument {
  name: string;
  meta: string;
}

// Present only on Help/appeal articles.
export interface AppealFields {
  raisedText: string;
  targetText: string;
  pctText: string;
  pctValue: number | null;
  // ISO date ("YYYY-MM-DD") the campaign closes on. Optional — older/older-
  // style appeals may not have one. Used to show a "N days left" badge, so
  // several campaigns running in the same window (e.g. three overlapping
  // fundraisers) can each show their own countdown instead of just a date.
  deadlineDate?: string;
  bankDetails: DonationBankDetail[];
  note: string;
  documents: DonationDocument[];
}

export interface Article {
  slug: string;
  lang: Lang;
  category: CategorySlug;
  title: string;
  dek: string;
  author: Author;
  timeAgo: string;
  readTime: string;
  heroImage: ImageRef;
  caption: string;
  body: ArticleBodyBlock[];
  tags: string[];
  featured: boolean;
  // Site-wide "Popular News" sidebar toggle (editorial pick, not derived
  // from view counts — the original static site didn't track real analytics).
  popular?: boolean;
  appeal?: AppealFields;
}

export interface ContentDataset {
  categories: Category[];
  articles: Article[];
}

// One entry in a homepage "Latest" grid: either a real article (by slug) or
// the pinned sponsored/native-ad slot. Written as an explicit union (instead
// of letting TypeScript infer it from the array literal in homeConfig.*.ts)
// so the "ad" in entry narrowing in app/(dv)/page.tsx and app/(en)/en/page.tsx
// reliably gives `catLabel`/`badgeLabel` as required strings rather than
// TypeScript merging the two shapes into one type with every field optional.
export type LatestMixedEntry = { slug: string } | { ad: true; badgeLabel: string; catLabel: string };
