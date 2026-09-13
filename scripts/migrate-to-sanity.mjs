#!/usr/bin/env node
/**
 * Phase 4 migration script — reads data/content.json (produced by
 * scripts/parse-content.py from the original static HTML) and writes an
 * NDJSON file that `sanity dataset import` can load straight into a real
 * Sanity project, matching the schema in lib/sanity/schemaTypes/.
 *
 * Usage:
 *   node scripts/migrate-to-sanity.mjs
 *   npx sanity dataset import sanity-migration.ndjson production
 *
 * Why NDJSON + `sanity dataset import` instead of writing documents
 * directly with @sanity/client: the import CLI understands the special
 * "_sanityAsset": "image@<url>" marker below and will download each hero
 * image from Unsplash and upload it as a real Sanity asset for you, so this
 * script doesn't need to do its own async image-upload dance.
 *
 * Two known data-quality issues in the ORIGINAL static site that this
 * script has to paper over — both called out again in the printed summary
 * when you run it, so you can double check the real content before
 * treating a migrated appeal article as live:
 *   1. Appeal amounts (raisedText/targetText) were hand-typed per language
 *      and don't actually agree between the dv and en placeholder pages
 *      for the same appeal (e.g. medical-appeal: MVR 118,500 dv vs MVR
 *      42,500 en). The new schema stores ONE shared raisedAmount/
 *      targetAmount instead of per-language text — this script takes the
 *      English page's numbers as the source of truth. Fix real appeals'
 *      numbers in Sanity after import if that's wrong for your data.
 *   2. Bank-detail rows aren't 1:1 between languages either (dv has 4 rows,
 *      en has 3, with different fields). This script zips them by
 *      position and reuses whichever language runs out of rows first —
 *      review the "Appeal / donation details" section of migrated help
 *      articles in the Studio before publishing.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IN = path.join(__dirname, "..", "data", "content.json");
const OUT = path.join(__dirname, "..", "sanity-migration.ndjson");

const dataset = JSON.parse(readFileSync(IN, "utf-8"));

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// "2 hrs ago" / "18 mins ago" -> an actual ISO datetime, staggered back
// from "now" at migration time. Real published dates should replace these
// in the Studio once you know them — this only keeps relative ordering
// sane so the homepage/category "latest first" queries behave.
function timeAgoToDate(timeAgo) {
  const now = Date.now();
  const m = /^(\d+)\s+(min|mins|hr|hrs)\s+ago$/i.exec(timeAgo.trim());
  if (!m) return new Date(now).toISOString();
  const n = parseInt(m[1], 10);
  const unitMs = /min/i.test(m[2]) ? 60_000 : 3_600_000;
  return new Date(now - n * unitMs).toISOString();
}

const docs = [];

// ---- categories ----
const categoryIdFor = (slug) => `category.${slug}`;
for (const c of dataset.categories) {
  docs.push({
    _id: categoryIdFor(c.slug),
    _type: "category",
    slug: { _type: "slug", current: c.slug },
    labelDv: c.labelDv,
    labelEn: c.labelEn,
  });
}

// ---- authors (deduped by English name) ----
const authorIdByKey = new Map(); // key -> _id
function authorRefFor(dvAuthor, enAuthor) {
  const key = slugify(enAuthor.name);
  const id = `author.${key}`;
  if (!authorIdByKey.has(key)) {
    authorIdByKey.set(key, id);
    docs.push({
      _id: id,
      _type: "author",
      nameDv: dvAuthor.name,
      nameEn: enAuthor.name,
      initialsDv: dvAuthor.initials,
      initialsEn: enAuthor.initials,
    });
  }
  return { _type: "reference", _ref: id };
}

// ---- articles: pair up the dv/en record sharing the same slug ----
const bySlug = new Map();
for (const a of dataset.articles) {
  if (!bySlug.has(a.slug)) bySlug.set(a.slug, {});
  bySlug.get(a.slug)[a.lang] = a;
}

function toPortableText(body) {
  // Converts the mock body blocks (paragraphs + decorative in-article ad
  // placeholders) into Sanity portable text. Ad placeholders are dropped —
  // a real CMS shouldn't store "swap in your ad network here" as content;
  // ad placement belongs in the Next.js templates, not the article body.
  return body
    .filter((b) => b.type === "paragraph")
    .map((b) => ({
      _type: "block",
      _key: Math.random().toString(36).slice(2, 10),
      style: "normal",
      children: [{ _type: "span", _key: Math.random().toString(36).slice(2, 10), text: b.text, marks: [] }],
      markDefs: [],
    }));
}

function parseAmount(text) {
  // "MVR 118,500" / "of MVR 120,000 goal" -> 118500 / 120000
  const m = /([\d,]+)/.exec(text || "");
  return m ? parseInt(m[1].replace(/,/g, ""), 10) : undefined;
}

function buildAppeal(dv, en) {
  if (!dv?.appeal && !en?.appeal) return undefined;
  const src = en?.appeal ?? dv.appeal; // English numbers are the source of truth — see file header note.
  const dvRows = dv?.appeal?.bankDetails ?? [];
  const enRows = en?.appeal?.bankDetails ?? [];
  const rowCount = Math.max(dvRows.length, enRows.length);
  const bankDetails = [];
  for (let i = 0; i < rowCount; i++) {
    const dvRow = dvRows[i] ?? dvRows[dvRows.length - 1];
    const enRow = enRows[i] ?? enRows[enRows.length - 1];
    if (!dvRow && !enRow) continue;
    bankDetails.push({
      _type: "bankDetailRow",
      _key: Math.random().toString(36).slice(2, 10),
      labelDv: dvRow?.label ?? enRow?.label,
      labelEn: enRow?.label ?? dvRow?.label,
      value: enRow?.value ?? dvRow?.value,
    });
  }
  const documents = (en?.appeal?.documents?.length ? en.appeal.documents : dv?.appeal?.documents ?? []).map(
    (d) => ({ _type: "appealDocument", _key: Math.random().toString(36).slice(2, 10), name: d.name, meta: d.meta })
    // NOTE: no `file` set — the original site's documents were decorative
    // placeholders ("📄 Hospital referral letter · PDF · 420 KB") with no
    // real file behind them. Upload real supporting documents in the
    // Studio once you have them.
  );
  return {
    _type: "object",
    raisedAmount: parseAmount(src.raisedText),
    targetAmount: parseAmount(src.targetText),
    bankDetails,
    noteDv: dv?.appeal?.note,
    noteEn: en?.appeal?.note,
    documents,
  };
}

for (const [slug, { dv, en }] of bySlug) {
  if (!dv || !en) {
    console.warn(`Skipping "${slug}" — missing one language's version (dv=${!!dv}, en=${!!en}).`);
    continue;
  }
  const authorRef = authorRefFor(dv.author, en.author);
  const appeal = buildAppeal(dv, en);

  docs.push({
    _id: `article.${slug}`,
    _type: "article",
    slug: { _type: "slug", current: slug },
    category: { _type: "reference", _ref: categoryIdFor(dv.category) },
    author: authorRef,
    publishedAt: timeAgoToDate(en.timeAgo),
    featured: !!dv.featured,
    popular: !!dv.popular,
    heroImage: {
      _type: "image",
      _sanityAsset: `image@${en.heroImage.url}`,
    },
    titleDv: dv.title,
    dekDv: dv.dek,
    heroImageAltDv: dv.heroImage.alt,
    captionDv: dv.caption,
    bodyDv: toPortableText(dv.body),
    tagsDv: dv.tags,
    titleEn: en.title,
    dekEn: en.dek,
    heroImageAltEn: en.heroImage.alt,
    captionEn: en.caption,
    bodyEn: toPortableText(en.body),
    tagsEn: en.tags,
    ...(appeal ? { appeal } : {}),
  });
}

writeFileSync(OUT, docs.map((d) => JSON.stringify(d)).join("\n") + "\n");

console.log(`Wrote ${docs.length} documents to ${path.relative(process.cwd(), OUT)}`);
console.log(`  - ${dataset.categories.length} categories`);
console.log(`  - ${authorIdByKey.size} authors`);
console.log(`  - ${bySlug.size} articles`);
console.log("");
console.log("Next steps:");
console.log("  1. Create a Sanity project if you haven't: npx sanity init");
console.log("  2. Import: npx sanity dataset import sanity-migration.ndjson production");
console.log("     (add --replace if re-running after a previous import)");
console.log("  3. Open the Studio (npm run studio) and spot-check the Help/Appeals");
console.log("     articles' donation details — see the notes at the top of this");
console.log("     script for the two known dv/en data mismatches in the source site.");
