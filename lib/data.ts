// Data access layer. Every page imports FROM HERE, never straight from
// data/content.json or lib/sanity/* — that's what let this file switch from
// mock JSON to a real Sanity project without any page needing to change.
//
// Categories still come from data/content.json (they're just nav labels,
// not editorial content that needs an approval workflow, so there's no
// reason to move them into Sanity). Articles now come from Sanity, and
// every query that fetches them filters on status == "approved" (see
// lib/sanity/queries.ts) — that's the actual approval gate: a journalist
// can write and save an article, but it stays invisible on the live site
// until an editor marks it Approved in Sanity Studio.
//
// Because articles are now fetched over the network, every article-fetching
// function here is async. Server Components (page.tsx files) can call them
// directly with `await`. Client Components can't — see app/api/search/
// route.ts + components/*/Header.tsx for how live search handles that.

import { sanityClient } from "./sanity/client";
import * as queries from "./sanity/queries";
import raw from "@/data/content.json";
import type {
  AppealFields,
  Article,
  ArticleBodyBlock,
  Category,
  CategorySlug,
  ContentDataset,
  Lang,
} from "./types";

const dataset = raw as ContentDataset;

export function getCategories(): Category[] {
  return dataset.categories;
}

export function getCategory(slug: string): Category | undefined {
  return dataset.categories.find((c) => c.slug === slug);
}

/* ────────────────────────────────────────────────────────────────────────
   Helpers: Sanity gives us raw fields (publishedAt, portable-text body,
   raw appeal numbers) — these turn that into the exact display strings/
   shapes the mock JSON used to provide directly, so no component below
   lib/data.ts needs to know the difference.
   ──────────────────────────────────────────────────────────────────────── */

// "2 hrs ago" / "18 mins ago" / "3 days ago" — computed from the real clock
// at request time. Matches the mock content's format exactly (including on
// the Dhivehi site, which reused these English words rather than
// translating them — see components/dv/*'s `.replace(" ago", "")` calls).
function timeAgoFromISO(iso: string | null | undefined): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(diffMs / 60000));
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

// Word count over the plain text of a portable-text body -> "N min read".
function readTimeFromBlocks(blocks: PortableBlock[] | undefined): string {
  const text = (blocks ?? [])
    .filter((b) => b?._type === "block")
    .flatMap((b) => (b.children ?? []).map((c) => c.text ?? ""))
    .join(" ");
  const words = text.trim().length ? text.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

interface PortableSpan {
  text?: string;
}
interface PortableBlock {
  _type?: string;
  children?: PortableSpan[];
}

// Portable text -> the simple { type: "paragraph", text }[] shape the
// article templates render. Images embedded in the body are skipped for
// now (the templates only render paragraph blocks) rather than crashing.
function blocksToBody(blocks: PortableBlock[] | undefined): ArticleBodyBlock[] {
  return (blocks ?? [])
    .filter((b) => b?._type === "block")
    .map((b) => ({
      type: "paragraph" as const,
      text: (b.children ?? []).map((c) => c.text ?? "").join(""),
    }));
}

interface RawAppeal {
  raisedAmount?: number;
  targetAmount?: number;
  pctValue?: number;
  deadlineDate?: string;
  bankDetails?: { label: string; value: string }[];
  note?: string;
  documents?: { name: string; meta: string }[];
}

// Sanity stores one shared raisedAmount/targetAmount (not per-language
// strings — see the schema/queries comments on why), so the display text
// is formatted here per language at request time.
function formatAppeal(lang: Lang, a: RawAppeal | null | undefined): AppealFields | undefined {
  if (!a) return undefined;
  const raised = a.raisedAmount ?? 0;
  const target = a.targetAmount ?? 0;
  const pctValue = a.pctValue ?? (target ? Math.round((raised / target) * 100) : null);
  return {
    raisedText: lang === "dv" ? `ރ. ${raised.toLocaleString()}` : `MVR ${raised.toLocaleString()}`,
    targetText:
      lang === "dv" ? `ޢަމާޒު: ރ. ${target.toLocaleString()}` : `Target: MVR ${target.toLocaleString()}`,
    pctText: lang === "dv" ? `${pctValue}% ހަމަވެއްޖެ` : `${pctValue}% raised`,
    pctValue,
    deadlineDate: a.deadlineDate,
    bankDetails: a.bankDetails ?? [],
    note: a.note ?? "",
    documents: (a.documents ?? []).map((d) => ({ name: d.name, meta: d.meta })),
  };
}

interface RawArticle {
  slug: string;
  category: CategorySlug;
  title: string;
  dek?: string;
  author?: { name?: string; initials?: string };
  publishedAt?: string;
  heroImage?: { url?: string; alt?: string };
  caption?: string;
  body?: PortableBlock[];
  tags?: string[];
  featured?: boolean;
  popular?: boolean;
  appeal?: RawAppeal | null;
}

function mapArticle(a: RawArticle, lang: Lang): Article {
  return {
    slug: a.slug,
    lang,
    category: a.category,
    title: a.title,
    dek: a.dek ?? "",
    author: { name: a.author?.name ?? "", initials: a.author?.initials ?? "" },
    timeAgo: timeAgoFromISO(a.publishedAt),
    readTime: readTimeFromBlocks(a.body),
    heroImage: { url: a.heroImage?.url ?? "", alt: a.heroImage?.alt ?? "" },
    caption: a.caption ?? "",
    body: blocksToBody(a.body),
    tags: a.tags ?? [],
    featured: !!a.featured,
    popular: !!a.popular,
    appeal: formatAppeal(lang, a.appeal),
  };
}

/* ────────────────────────────────────────────────────────────────────────
   Sanity-backed article functions. All async — see the file header comment
   for what that means for callers.
   ──────────────────────────────────────────────────────────────────────── */

// Next.js patches the global fetch() to cache data requests by default
// (this is what makes static pages fast in production) — but that means a
// Sanity query result can get cached and then never re-checked, so a newly
// approved article (or one that didn't exist yet at the moment it was first
// requested, like during initial migration) can keep showing stale/empty
// results indefinitely instead of picking up new data. { cache: "no-store" }
// tells Next.js to never cache these and always ask Sanity fresh — exactly
// what an editorial approval workflow needs: approve an article in Studio
// and it should show up right away, not after the next full rebuild/deploy.
const NO_STORE = { cache: "no-store" as const };

export async function getAllArticles(lang: Lang): Promise<Article[]> {
  const raws: RawArticle[] = await sanityClient.fetch(queries.allArticlesQuery, { lang }, NO_STORE);
  return raws.map((a) => mapArticle(a, lang));
}

export async function getArticle(lang: Lang, slug: string): Promise<Article | undefined> {
  const a: RawArticle | null = await sanityClient.fetch(queries.articleBySlugQuery, { lang, slug }, NO_STORE);
  return a ? mapArticle(a, lang) : undefined;
}

export async function getArticlesByCategory(lang: Lang, category: CategorySlug): Promise<Article[]> {
  const raws: RawArticle[] = await sanityClient.fetch(queries.articlesByCategoryQuery, { lang, category }, NO_STORE);
  return raws.map((a) => mapArticle(a, lang));
}

export async function getFeaturedArticles(lang: Lang): Promise<Article[]> {
  const raws: RawArticle[] = await sanityClient.fetch(queries.featuredArticlesQuery, { lang }, NO_STORE);
  return raws.map((a) => mapArticle(a, lang));
}

export async function getPopularArticles(lang: Lang): Promise<Article[]> {
  const raws: RawArticle[] = await sanityClient.fetch(queries.popularArticlesQuery, { lang }, NO_STORE);
  return raws.map((a) => mapArticle(a, lang));
}

// A handful of "most recent" items for a sidebar, excluding one slug
// (typically the article currently being read).
export async function getRecentArticles(lang: Lang, excludeSlug: string, limit = 4): Promise<Article[]> {
  const raws: RawArticle[] = await sanityClient.fetch(queries.recentArticlesQuery, { lang, excludeSlug }, NO_STORE);
  return raws.slice(0, limit).map((a) => mapArticle(a, lang));
}

// Articles in the same category as `slug`, excluding the article itself —
// used for the "related news" row at the bottom of an article page.
export async function getRelatedArticles(lang: Lang, slug: string, limit = 4): Promise<Article[]> {
  const current = await getArticle(lang, slug);
  if (!current) return [];
  const raws: RawArticle[] = await sanityClient.fetch(
    queries.relatedArticlesQuery,
    { lang, slug, category: current.category },
    NO_STORE
  );
  return raws.slice(0, limit).map((a) => mapArticle(a, lang));
}

// Case-insensitive match against title, dek, and tags — used by the header
// search box's live results dropdown (via app/api/search/route.ts, since
// the header is a Client Component and can't call this directly anymore).
// An empty/whitespace-only query matches nothing, and results are capped at
// `limit` since this renders in a small dropdown, not a full results page.
export async function searchArticles(lang: Lang, query: string, limit = 6): Promise<Article[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const all = await getAllArticles(lang);
  return all
    .filter((a) => {
      if (a.title.toLowerCase().includes(q)) return true;
      if (a.dek.toLowerCase().includes(q)) return true;
      return a.tags.some((tag) => tag.toLowerCase().includes(q));
    })
    .slice(0, limit);
}

// The whole site pretends "today" is a fixed date for demo purposes (see
// DECORATIVE_DATE in components/*/Header.tsx) — a fundraising countdown is
// computed against that SAME fixed date, not the visitor's real clock, so
// it doesn't silently drift as real time passes on a demo deployment. Swap
// this for `new Date()` once real dates are wired up site-wide.
const SITE_TODAY = new Date("2026-09-07T00:00:00Z");

// Whole days remaining until an appeal's deadline. Several appeals can have
// overlapping/concurrent deadlines with no special handling needed — each
// article just computes and shows its own countdown independently. Can come
// back 0 or negative once a deadline has passed.
export function getDaysLeft(deadlineDate: string): number {
  const deadline = new Date(`${deadlineDate}T00:00:00Z`);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((deadline.getTime() - SITE_TODAY.getTime()) / msPerDay);
}

// Localized "N days left" badge text for a countdown. Kept here (rather
// than in the shared ArticleCard component) since the two language sites
// need their own wording, not just a translated number.
export function formatDaysLeftLabel(lang: Lang, daysLeft: number): string {
  if (lang === "dv") {
    return daysLeft > 0 ? `ބާކީ ${daysLeft} ދުވަސް` : "އެންމެ ފަހު ދުވަސް";
  }
  return daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : "Last day";
}
