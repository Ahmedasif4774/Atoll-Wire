// Permanent numeric article links (like sun.mv/228619): every article gets
// one number, once, and keeps it forever. /article/10234 then shows the same
// story no matter how its title or slug is edited later.
//
// Where numbers live: NOT on the article itself. Each article's number is
// stored in its own small helper document (_type "articleNumber", _id
// "articleNumber.<article id>"). That's deliberate — if a journalist has an
// unpublished edit open in Studio while the number is assigned, publishing
// that edit would overwrite the article and silently drop a number stored
// on it, and the article would get a different number the next time. A
// separate document can't be overwritten that way.
//
// Uniqueness: numbers come from one counter document updated with Sanity's
// atomic `inc`, so two articles saved at the same moment can never receive
// the same number. If something fails halfway, a number may be skipped (a
// gap) but is never reused.
//
// Everything here is server-side only and needs SANITY_API_TOKEN to have
// Editor (write) access.
import { sanityClient } from "@/lib/sanity/client";

const COUNTER_ID = "articleNumberCounter";
// The first article numbered gets START + 1. Starting at 10000 keeps every
// link a tidy 5 digits for a long time.
const START = 10000;

const NO_STORE = { cache: "no-store" as const };

// "drafts.abc" and "abc" are the same article — always key on the
// published id.
export function publishedId(id: string): string {
  return id.replace(/^drafts\./, "");
}

function mappingId(articleId: string): string {
  return `articleNumber.${publishedId(articleId)}`;
}

// Returns the article's existing number, or null if it has none yet.
export async function getArticleNumber(articleId: string): Promise<number | null> {
  const n: number | null = await sanityClient.fetch(
    `*[_id == $mid][0].number`,
    { mid: mappingId(articleId) },
    NO_STORE,
  );
  return typeof n === "number" ? n : null;
}

// Returns the article's number, creating one if it doesn't have one yet.
// Safe to call repeatedly and concurrently for the same article: whichever
// call writes the mapping first wins and every caller gets that same number.
export async function ensureArticleNumber(articleId: string): Promise<number> {
  const id = publishedId(articleId);

  const existing = await getArticleNumber(id);
  if (existing != null) return existing;

  // Make sure the counter exists (does nothing if it already does).
  await sanityClient.createIfNotExists({ _id: COUNTER_ID, _type: "articleNumberCounter", lastNumber: START });

  // Atomically take the next number.
  const counter = await sanityClient.patch(COUNTER_ID).inc({ lastNumber: 1 }).commit<{ lastNumber: number }>();
  const next = counter.lastNumber;

  // Claim it for this article. If a concurrent call already claimed a
  // number for the same article, createIfNotExists leaves theirs in place
  // (ours becomes an unused gap) and we read theirs back below.
  await sanityClient.createIfNotExists({
    _id: mappingId(id),
    _type: "articleNumber",
    articleId: id,
    number: next,
  });

  const final = await getArticleNumber(id);
  return final ?? next;
}

// Finds the article id that owns a number (null if nobody does).
export async function articleIdForNumber(number: number): Promise<string | null> {
  const id: string | null = await sanityClient.fetch(
    `*[_type == "articleNumber" && number == $number][0].articleId`,
    { number },
    NO_STORE,
  );
  return id ?? null;
}

// ---- Reading numbers for display -------------------------------------
//
// Article lists are fetched in many places, so numbers are looked up
// separately and merged in (see lib/data.ts) rather than joined inside
// every article query. A number never changes once assigned, so what's
// been learned is remembered in memory; the full list is only re-read when
// an article turns up that isn't known yet (at most once every 15 seconds,
// so a brand-new article picks up its number almost immediately). If the
// lookup fails for any reason, links just use the slug — the site keeps
// working either way.
const known = new Map<string, number>();
let lastLoad = 0;
const RELOAD_AFTER_MS = 15_000;

export async function numbersFor(ids: string[]): Promise<Map<string, number>> {
  const wanted = ids.map(publishedId);
  const missing = wanted.some((id) => !known.has(id));
  if (missing && Date.now() - lastLoad > RELOAD_AFTER_MS) {
    lastLoad = Date.now();
    try {
      const rows: { articleId?: string; number?: number }[] = await sanityClient.fetch(
        `*[_type == "articleNumber"]{ articleId, number }`,
        {},
        NO_STORE,
      );
      for (const r of rows) if (r.articleId && typeof r.number === "number") known.set(r.articleId, r.number);
    } catch (err) {
      console.error("[article numbers] could not load numbers — links will use slugs:", err);
    }
  }
  return known;
}

// One-time catch-up for articles that existed before numbering: gives every
// published article without a number one, oldest first, so the oldest story
// gets the lowest number. Safe to run any number of times — articles that
// already have a number are left alone.
export async function backfillArticleNumbers(limit = 150): Promise<{
  assigned: { id: string; number: number }[];
  remaining: number;
}> {
  const missing: { _id: string }[] = await sanityClient.fetch(
    `*[_type == "article" && !(_id in path("drafts.**")) && count(*[_id == "articleNumber." + ^._id]) == 0]
       | order(coalesce(publishedAt, _createdAt) asc, _createdAt asc) { _id }`,
    {},
    NO_STORE,
  );

  const assigned: { id: string; number: number }[] = [];
  // One at a time (not in parallel) so the oldest article really does get
  // the lowest number.
  for (const doc of missing.slice(0, limit)) {
    const number = await ensureArticleNumber(doc._id);
    assigned.push({ id: doc._id, number });
  }
  return { assigned, remaining: Math.max(0, missing.length - assigned.length) };
}
