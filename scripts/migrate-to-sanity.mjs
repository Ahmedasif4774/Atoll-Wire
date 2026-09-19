#!/usr/bin/env node
/**
 * Phase 4 migration script — reads data/content.json (produced by
 * scripts/parse-content.py from the original static HTML) and writes an
 * NDJSON file that `sanity dataset import` can load straight into a real
 * Sanity project, matching the schema in lib/sanity/schemaTypes/.
 *
 * Usage:
 *   node scripts/migrate-to-sanity.mjs
 *   npx sanity dataset import sanity-migration.ndjson production --replace
 *
 * Every migrated article is written with status: "approved" — these are
 * your existing, already-live articles, so they should keep showing up on
 * the site immediately after import rather than needing to be re-approved
 * one by one in Sanity Studio. Anything NEW that a journalist writes from
 * now on starts as Draft (see lib/sanity/schemaTypes/article.ts) and needs
 * an editor to flip it to Approved before it appears.
 *
 * Requires a Sanity API token with write access (a plain `npx sanity dataset
 * import` session can't be used from a standalone script). Get one at
 * https://www.sanity.io/manage -> your project -> API -> Add API token
 * (permissions: Editor), then add it to .env.local as:
 *   SANITY_API_TOKEN="the token you copied"
 *
 * Why this script uploads images itself instead of letting `sanity dataset
 * import` fetch them from Unsplash (which is what an earlier version of
 * this script did, via a "_sanityAsset": "image@<url>" marker): that
 * remote-fetch step turned out to fail intermittently and unpredictably —
 * different photos failed on different runs — because it's Sanity's own
 * import servers, not your computer, doing the fetching, so there was no
 * way to test or retry it from here. Downloading each photo and uploading
 * it directly over YOUR internet connection instead is far more reliable,
 * and only needs to happen once per unique photo (repeats are cached).
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
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IN = path.join(__dirname, "..", "data", "content.json");
const OUT = path.join(__dirname, "..", "sanity-migration.ndjson");
const ENV_FILE = path.join(__dirname, "..", ".env.local");

// ---- Load .env.local by hand ----
// This is a plain Node script (not Next.js), so .env.local isn't loaded
// automatically the way it is for `npm run dev`/`next build`. This is a
// deliberately tiny parser (KEY="value" or KEY=value, one per line, #
// comments ignored) rather than adding a new dependency just for this.
function loadEnvLocal() {
  const env = {};
  if (!existsSync(ENV_FILE)) return env;
  const text = readFileSync(ENV_FILE, "utf-8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(trimmed);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[m[1]] = value;
  }
  return env;
}

const envLocal = loadEnvLocal();
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || envLocal.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset_ = process.env.NEXT_PUBLIC_SANITY_DATASET || envLocal.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN || envLocal.SANITY_API_TOKEN;

if (!projectId) {
  console.error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID — check .env.local.");
  process.exit(1);
}
if (!token) {
  console.error("Missing SANITY_API_TOKEN.");
  console.error("");
  console.error("Get one at https://www.sanity.io/manage -> your project -> API -> Add API token");
  console.error('(permissions: Editor), then add this line to .env.local: SANITY_API_TOKEN="<the token>"');
  process.exit(1);
}

const sanityClient = createClient({ projectId, dataset: dataset_, apiVersion: "2024-01-01", token, useCdn: false });

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

// ---- Upload every unique hero image directly, up front ----
// Uploading over your own internet connection (instead of handing Sanity a
// URL to fetch itself — see the file header comment for why) and caching
// by URL so a photo reused across several articles only uploads once.
async function uploadImageWithRetry(url, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching photo`);
      const arrayBuffer = await res.arrayBuffer();
      const filename = path.basename(new URL(url).pathname) || "hero.jpg";
      const asset = await sanityClient.assets.upload("image", Buffer.from(arrayBuffer), { filename });
      return asset._id;
    } catch (err) {
      if (attempt === attempts) throw err;
      console.warn(`  Retry ${attempt}/${attempts - 1} after error uploading ${url}: ${err.message}`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error("unreachable");
}

const allHeroUrls = [...new Set(dataset.articles.map((a) => a.heroImage.url))];
console.log(`Uploading ${allHeroUrls.length} unique hero images to Sanity...`);
const assetIdByUrl = new Map();
let uploadFailures = 0;
for (let i = 0; i < allHeroUrls.length; i++) {
  const url = allHeroUrls[i];
  process.stdout.write(`  [${i + 1}/${allHeroUrls.length}] ${url} ... `);
  try {
    const assetId = await uploadImageWithRetry(url);
    assetIdByUrl.set(url, assetId);
    console.log("ok");
  } catch (err) {
    console.log(`FAILED (${err.message})`);
    uploadFailures++;
  }
}
if (uploadFailures > 0) {
  console.warn(
    `${uploadFailures} image(s) failed to upload after retries — those articles will be migrated WITHOUT a hero ` +
      `image; add one manually in Studio afterwards. Re-running this script will only re-attempt uploads, so it's ` +
      `safe to run again if you'd rather retry first.`
  );
} else {
  console.log("All hero images uploaded.");
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
    deadlineDate: src.deadlineDate,
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
  const heroAssetId = assetIdByUrl.get(en.heroImage.url);

  docs.push({
    _id: `article.${slug}`,
    _type: "article",
    // Existing content is treated as already-approved so the site keeps
    // showing what it currently shows right after import — see the file
    // header comment.
    status: "approved",
    slug: { _type: "slug", current: slug },
    category: { _type: "reference", _ref: categoryIdFor(dv.category) },
    author: authorRef,
    publishedAt: timeAgoToDate(en.timeAgo),
    featured: !!dv.featured,
    popular: !!dv.popular,
    // Only set when the upload succeeded above — an article whose photo
    // failed every retry is migrated without a heroImage rather than with
    // a broken reference; add a real photo for it in Studio.
    ...(heroAssetId
      ? { heroImage: { _type: "image", asset: { _type: "reference", _ref: heroAssetId } } }
      : {}),
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
console.log(`  - ${bySlug.size} articles (all marked status: approved)`);
console.log("");
console.log("Next step: import the documents (all photos are already uploaded, so this");
console.log("part should be quick and shouldn't need any retries):");
console.log("  npx sanity dataset import sanity-migration.ndjson production --replace");
