import HomePageClient from "@/components/en/HomePageClient";
import { getAllArticles } from "@/lib/data";
import { homeConfigEn as cfg } from "@/lib/homeConfig.en";
import type { Article } from "@/lib/types";

// This file stays a Server Component so it can `await` the Sanity-backed
// data functions in lib/data.ts directly. All the markup/styling (and the
// <style jsx> that requires a Client Component) lives in HomePageClient —
// see the comment at the top of that file.
//
// This page needs a handful of specific articles by slug (hero, editor
// pair, latest grid, sport, world). Fetching each one with its own request
// — which is what this file used to do, firing a dozen-plus of them at
// once via Promise.all — turned out to be unreliable: under that many
// simultaneous requests, Sanity would occasionally return an empty result
// for a request even though the article genuinely existed and was
// approved (confirmed directly in Sanity's own query tool), seemingly due
// to the burst of concurrent traffic rather than any real data problem.
// Fetching the full article list ONCE and picking slugs out of it locally
// avoids that concurrency entirely — one request instead of many.
function reqFrom(bySlug: Map<string, Article>, slug: string): Article {
  const a = bySlug.get(slug);
  if (!a) throw new Error(`Home page config references missing en article: ${slug}`);
  return a;
}

// One entry in the "Latest" grid, resolved: either a real fetched article,
// or the pinned sponsored/native-ad slot passed straight through from
// homeConfig.en.ts. cfg.latestMixed only carries slugs — this file resolves
// each slug to its real Article server-side so HomePageClient never needs
// to fetch anything itself.
type ResolvedLatestEntry = { article: Article } | { ad: true; badgeLabel: string; catLabel: string };

// The "Latest" grid is 4 columns, and this page is LTR (English), so the
// 4th entry in latestMixed lands in the right-most column of the first row.
// The sponsored/ad card should always render on the right side of that
// first row, so we pull it out of wherever it sits in the curated list and
// reinsert it at index 3 for display — this keeps the ad pinned to that
// exact visual spot even if articles are added, removed, or reordered
// around it later. (The Dhivehi homepage pins it to the same index 3, but
// since that page is RTL, index 3 lands in the LEFT-most column instead —
// same list position, mirrored visual result, matching how each page reads.)
const AD_DISPLAY_INDEX = 3;
function withPinnedAd(entries: ResolvedLatestEntry[], pinnedIndex: number): ResolvedLatestEntry[] {
  const adIndex = entries.findIndex((e) => "ad" in e);
  if (adIndex === -1 || adIndex === pinnedIndex) return entries;
  const rest = entries.filter((_, i) => i !== adIndex);
  return [...rest.slice(0, pinnedIndex), entries[adIndex], ...rest.slice(pinnedIndex)];
}

export default async function EnHomePage() {
  const all = await getAllArticles("en");
  const bySlug = new Map(all.map((a) => [a.slug, a]));
  const req = (slug: string) => reqFrom(bySlug, slug);

  const hero = req(cfg.heroSlug);
  const editorPair = cfg.editorPairSlugs.map(req);
  const latestResolved: ResolvedLatestEntry[] = cfg.latestMixed.map((entry) =>
    "ad" in entry ? entry : { article: req(entry.slug) }
  );
  const sportArticles = cfg.sportSlugs.map(req);
  const worldArticles = cfg.worldSlugs.map(req);

  const latestDisplay = withPinnedAd(latestResolved, AD_DISPLAY_INDEX);

  return (
    <HomePageClient
      hero={hero}
      editorPair={editorPair}
      latestDisplay={latestDisplay}
      sportArticles={sportArticles}
      worldArticles={worldArticles}
    />
  );
}
