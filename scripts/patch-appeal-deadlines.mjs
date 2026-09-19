#!/usr/bin/env node
/**
 * One-off backfill script — run this ONCE, after adding the "deadlineDate"
 * field to lib/sanity/schemaTypes/article.ts.
 *
 * Why this is needed: the appeal articles were migrated into Sanity before
 * the "deadlineDate" field existed on the schema, so their appeal.deadlineDate
 * is currently empty in Sanity even though the original mock content
 * (data/content.json) has a real deadline for each one. This script reads
 * those original dates and patches them onto the matching, already-existing
 * Sanity documents — it does NOT touch anything else (images, body text,
 * approval status, amounts raised, etc.), so it's safe to run against your
 * live "production" dataset.
 *
 * Usage:
 *   node scripts/patch-appeal-deadlines.mjs
 *
 * Safe to run more than once — it just sets the same field to the same
 * value again if you re-run it.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IN = path.join(__dirname, "..", "data", "content.json");
const ENV_FILE = path.join(__dirname, "..", ".env.local");

// ---- Load .env.local by hand (same tiny parser as migrate-to-sanity.mjs) ----
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
  console.error("Missing SANITY_API_TOKEN — check .env.local.");
  process.exit(1);
}

const sanityClient = createClient({ projectId, dataset: dataset_, apiVersion: "2024-01-01", token, useCdn: false });

const dataset = JSON.parse(readFileSync(IN, "utf-8"));

// Collect one deadlineDate per slug (dv and en versions carry the same
// date — see the schema comment on why it's one shared value, not two).
const deadlineBySlug = new Map();
for (const a of dataset.articles) {
  const d = a.appeal?.deadlineDate;
  if (d && !deadlineBySlug.has(a.slug)) {
    deadlineBySlug.set(a.slug, d);
  }
}

console.log(`Found ${deadlineBySlug.size} appeal article(s) with a deadline date in data/content.json.`);
console.log("");

let patched = 0;
let skipped = 0;
for (const [slug, deadlineDate] of deadlineBySlug) {
  const id = `article.${slug}`;
  try {
    // .ifExists()-style safety: check the document (and its appeal object)
    // actually exists before patching, so a typo'd/removed slug doesn't
    // silently create a broken partial document.
    const doc = await sanityClient.getDocument(id);
    if (!doc) {
      console.log(`  SKIP  ${slug} — no document with id "${id}" found in Sanity.`);
      skipped++;
      continue;
    }
    if (!doc.appeal) {
      console.log(`  SKIP  ${slug} — document exists but has no "appeal" object.`);
      skipped++;
      continue;
    }
    await sanityClient.patch(id).set({ "appeal.deadlineDate": deadlineDate }).commit();
    console.log(`  OK    ${slug} -> ${deadlineDate}`);
    patched++;
  } catch (err) {
    console.log(`  FAIL  ${slug} — ${err instanceof Error ? err.message : String(err)}`);
    skipped++;
  }
}

console.log("");
console.log(`Done. Patched ${patched} document(s), skipped ${skipped}.`);
