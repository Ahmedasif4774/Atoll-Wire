import HomePageClient from "@/components/dv/HomePageClient";
import { getAllArticles } from "@/lib/data";
import { homeConfigDv as cfg } from "@/lib/homeConfig.dv";
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
  if (!a) throw new Error(`Home page config references missing dv article: ${slug}`);
  return a;
}

// One entry in the "Latest" grid, resolved: either a real fetched article,
// or the pinned sponsored/native-ad slot passed straight through from
// homeConfig.dv.ts. cfg.latestMixed only carries slugs — this file resolves
// each slug to its real Article server-side so HomePageClient never needs
// to fetch anything itself.
type ResolvedLatestEntry = { article: Article } | { ad: true; badgeLabel: string; catLabel: string };

// The "Latest" grid is 4 columns, and this page is RTL (Dhivehi), so cards
// are laid out right-to-left: the 1st entry in latestMixed lands in the
// right-most column, and the 4th entry lands in the left-most column of the
// first row. The sponsored/ad card should always render in that left-most
// slot (the one advertisers see first), so we pull it out of wherever it
// sits in the curated list and reinsert it at index 3 for display — this
// keeps the ad pinned to that exact visual spot even if articles are added,
// removed, or reordered around it later.
const AD_DISPLAY_INDEX = 3;
function withPinnedAd(entries: ResolvedLatestEntry[], pinnedIndex: number): ResolvedLatestEntry[] {
  const adIndex = entries.findIndex((e) => "ad" in e);
  if (adIndex === -1 || adIndex === pinnedIndex) return entries;
  const rest = entries.filter((_, i) => i !== adIndex);
  return [...rest.slice(0, pinnedIndex), entries[adIndex], ...rest.slice(pinnedIndex)];
}

export default async function DvHomePage() {
  // TEMPORARY DEBUG LOGGING — safe to ignore/remove later.
  console.log(
    `[DEBUG dv] projectId=${JSON.stringify(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)} dataset=${JSON.stringify(
      process.env.NEXT_PUBLIC_SANITY_DATASET
    )}`
  );
  const { sanityClient } = await import("@/lib/sanity/client");
  const rawCount = await sanityClient.fetch(`count(*[_type == "article"])`);
  const approvedCount = await sanityClient.fetch(`count(*[_type == "article" && status == "approved"])`);
  console.log(`[DEBUG dv] total article docs=${rawCount}, approved=${approvedCount}`);

  // Bypass @sanity/client entirely and hit the raw HTTP API directly with
  // Node's own fetch, to rule out anything the library might be doing
  // differently from a normal browser request.
  try {
    const rawUrl = `https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${process.env.NEXT_PUBLIC_SANITY_DATASET}?query=${encodeURIComponent(`count(*[_type == "article"])`)}`;
    const rawRes = await fetch(rawUrl, { cache: "no-store" });
    const rawText = await rawRes.text();
    console.log(`[DEBUG dv] raw fetch (no perspective) status=${rawRes.status} body=${rawText}`);

    const rawUrlPublished = `${rawUrl}&perspective=published`;
    const rawResPub = await fetch(rawUrlPublished, { cache: "no-store" });
    const rawTextPub = await rawResPub.text();
    console.log(`[DEBUG dv] raw fetch (perspective=published) status=${rawResPub.status} body=${rawTextPub}`);

    // Same query again, but this time WITH the API token attached as an
    // Authorization header — to test whether the dataset is silently
    // requiring authentication for reads (which would explain why the
    // logged-in Studio/Vision tool sees everything but anonymous requests
    // see nothing, even though both hit the same "Public" dataset).
    const token = process.env.SANITY_API_TOKEN;
    console.log(`[DEBUG dv] token present? ${!!token}, length=${token ? token.length : 0}`);
    const rawResAuth = await fetch(rawUrl, {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const rawTextAuth = await rawResAuth.text();
    console.log(`[DEBUG dv] raw fetch (with token) status=${rawResAuth.status} body=${rawTextAuth}`);
  } catch (err) {
    console.log(`[DEBUG dv] raw fetch THREW: ${err instanceof Error ? err.message : String(err)}`);
  }

  const all = await getAllArticles("dv");
  console.log(
    `[DEBUG dv] getAllArticles returned ${all.length} articles. Has "harbor"? ${all.some((a) => a.slug === "harbor")}`
  );
  console.log(`[DEBUG dv] all slugs: ${all.map((a) => a.slug).join(", ")}`);
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
