// Data access layer. Every page imports FROM HERE, never straight from
// data/content.json — that's what makes swapping to a real Sanity project
// later (Phase 4 of the roadmap) a change to this one file instead of a
// change to every page.
//
// To switch a function over to Sanity once you have a real project:
//   1. Uncomment the Sanity-backed version below the mock version.
//   2. Delete (or comment out) the mock version.
//   3. Fill in .env.local with your project id/dataset (see .env.example).
//
// Until then, everything reads from data/content.json, which was generated
// from your original static HTML by scripts/parse-content.py — so the
// mock data IS your real content, not placeholder text.

import type { Article, Category, CategorySlug, ContentDataset, Lang } from "./types";
import raw from "@/data/content.json";

const dataset = raw as ContentDataset;

export function getCategories(): Category[] {
  return dataset.categories;
}

export function getCategory(slug: string): Category | undefined {
  return dataset.categories.find((c) => c.slug === slug);
}

export function getAllArticles(lang: Lang): Article[] {
  return dataset.articles.filter((a) => a.lang === lang);
}

export function getArticle(lang: Lang, slug: string): Article | undefined {
  return dataset.articles.find((a) => a.lang === lang && a.slug === slug);
}

export function getArticlesByCategory(lang: Lang, category: CategorySlug): Article[] {
  return dataset.articles.filter((a) => a.lang === lang && a.category === category);
}

export function getFeaturedArticles(lang: Lang): Article[] {
  return dataset.articles.filter((a) => a.lang === lang && a.featured);
}

export function getPopularArticles(lang: Lang): Article[] {
  return dataset.articles.filter((a) => a.lang === lang && a.popular);
}

// A handful of "most recent" items for a sidebar, excluding one slug
// (typically the article currently being read).
export function getRecentArticles(lang: Lang, excludeSlug: string, limit = 4): Article[] {
  return dataset.articles.filter((a) => a.lang === lang && a.slug !== excludeSlug).slice(0, limit);
}

// Articles in the same category as `slug`, excluding the article itself —
// used for the "related news" row at the bottom of an article page.
export function getRelatedArticles(lang: Lang, slug: string, limit = 4): Article[] {
  const current = getArticle(lang, slug);
  if (!current) return [];
  return dataset.articles
    .filter((a) => a.lang === lang && a.slug !== slug && a.category === current.category)
    .slice(0, limit);
}

// Case-insensitive match against title, dek, and tags — used by the header
// search box's live results dropdown. An empty/whitespace-only query
// matches nothing (the dropdown only opens once the visitor has typed
// something), and results are capped at `limit` since this renders in a
// small dropdown, not a full results page.
export function searchArticles(lang: Lang, query: string, limit = 6): Article[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return dataset.articles
    .filter((a) => {
      if (a.lang !== lang) return false;
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

/* ────────────────────────────────────────────────────────────────────────
   SANITY-BACKED VERSIONS (Phase 4+) — uncomment once you have a project.
   These assume the GROQ queries in lib/sanity/queries.ts and the client
   in lib/sanity/client.ts. Field names match the schema in
   lib/sanity/schemaTypes/ exactly, so no other code needs to change.
   ────────────────────────────────────────────────────────────────────────

import { sanityClient } from "./sanity/client";
import * as queries from "./sanity/queries";

export async function getCategories(): Promise<Category[]> {
  return sanityClient.fetch(queries.allCategoriesQuery);
}

export async function getArticle(lang: Lang, slug: string): Promise<Article | undefined> {
  return sanityClient.fetch(queries.articleBySlugQuery, { lang, slug });
}

export async function getArticlesByCategory(lang: Lang, category: CategorySlug): Promise<Article[]> {
  return sanityClient.fetch(queries.articlesByCategoryQuery, { lang, category });
}

// ... etc for the rest. Since these become async, every page/component
// that calls them needs `await` — Next.js Server Components support this
// natively (just make the page component itself `async function`).
──────────────────────────────────────────────────────────────────────── */
