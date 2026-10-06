import HomePageClient from "@/components/en/HomePageClient";
import { getAllArticles } from "@/lib/data";
import { resolveTopStories } from "@/lib/homePicks";
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

// Newest approved articles of one category (`all` is already newest-first),
// as many as the curated list has slots; any shortfall is filled from the
// curated slugs that exist and aren't already included.
function newestInCategory(
  all: Article[],
  category: string,
  curatedSlugs: string[],
  bySlug: Map<string, Article>
): Article[] {
  const slots = curatedSlugs.length;
  const picked = all.filter((a) => a.category === category).slice(0, slots);
  for (const slug of curatedSlugs) {
    if (picked.length >= slots) break;
    const a = bySlug.get(slug);
    if (a && !picked.includes(a)) picked.push(a);
  }
  return picked;
}

export default async function EnHomePage() {
  const all = await getAllArticles("en");
  const bySlug = new Map(all.map((a) => [a.slug, a]));

  // Main story + editor's-choice cards: whichever newest articles an editor
  // ticked "Main story" / "Editor's choice 1/2" on in Sanity, falling back to
  // the defaults in homeConfig for any slot nobody ticked.
  const { hero, editorPair } = resolveTopStories(all, bySlug, cfg);
  // The "Latest" grid fills itself: the newest approved articles first
  // (getAllArticles is already newest-first), skipping the two stories shown
  // above it (main story + editor picks) so nothing appears twice. The
  // sponsored card keeps the slot homeConfig gives it. How many articles are
  // shown is simply however many non-ad slots the config lists.
  const shownAbove = new Set([hero.slug, ...editorPair.map((a) => a.slug)]);
  const newest = all.filter((a) => !shownAbove.has(a.slug));
  let nextNewest = 0;
  const latestResolved: ResolvedLatestEntry[] = [];
  for (const entry of cfg.latestMixed) {
    if ("ad" in entry) {
      latestResolved.push(entry);
    } else if (nextNewest < newest.length) {
      latestResolved.push({ article: newest[nextNewest++] });
    }
  }
  // Sport and World fill themselves too: the newest approved articles in
  // that category (same number of slots as homeConfig lists). If a category
  // has fewer articles than slots, the gap is topped up from the hand-picked
  // list so the section never looks half empty.
  const sportArticles = newestInCategory(all, "sport", cfg.sportSlugs, bySlug);
  const worldArticles = newestInCategory(all, "world", cfg.worldSlugs, bySlug);

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
