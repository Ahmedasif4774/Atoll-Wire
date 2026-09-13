# AtollWire — Next.js + Sanity rebuild

This is the Next.js rebuild of the AtollWire static site, following the
Backend & CMS Roadmap. It was built by hand-porting the original 104 static
HTML pages (`atollwire-site-final 12 Sept.zip`) into a proper Next.js app,
with all real article content extracted programmatically (see
`scripts/parse-content.py`) rather than retyped.

**Important — this was built without a working npm registry connection**,
so none of it has been run through `npm install` / `npm run dev` / `npm run
build` yet. Everything below is written correctly as far as careful
code review can confirm, but please run the "First run" steps yourself and
fix anything that comes up — most likely candidates are minor dependency
version mismatches, since exact versions weren't verified against a live
install.

## What's here

- **Two fully separate locale trees** — `app/(dv)/*` (Dhivehi, RTL, root
  URLs) and `app/(en)/en/*` (English, LTR, `/en/*` URLs) — mirroring how the
  original site had a completely separate HTML file per language. Each has
  its own root layout (`layout.tsx`), so each gets its own `<html lang
  dir>` and default font.
- **`data/content.json`** — the real content from all 80 articles (40 per
  language), extracted from the original HTML by `scripts/parse-content.py`.
  This is what the site runs on right now; it is not placeholder text.
- **`lib/data.ts`** — the only place pages import article/category data
  from. Swapping to Sanity later (Phase 4) means changing this one file,
  not every page — see the commented-out Sanity-backed versions at the
  bottom of it.
- **`lib/sanity/`** — the Phase 1 Studio schema (`schemaTypes/`), a
  configured client (`client.ts`), and the GROQ queries (`queries.ts`) that
  `lib/data.ts` will call once you're on Sanity.
- **`scripts/migrate-to-sanity.mjs`** — Phase 4 migration script. Reads
  `data/content.json` and writes an NDJSON file that `sanity dataset
  import` can load straight into a real project, images and all.

## First run

```bash
npm install
npm run dev
```

Then open http://localhost:3000 (Dhivehi homepage) and
http://localhost:3000/en (English homepage). Click around — every article,
category, and the four static pages (Terms, Privacy, Editorial Policy,
Contact) should work in both languages.

Things worth checking first, since they couldn't be verified without a
live install:

- The MV Waheed font actually renders (`public/fonts/MVWaheed.otf` — it was
  extracted from the original page's inline base64 `@font-face`, so it
  should be correct, but do look at a Dhivehi page and confirm the text
  isn't falling back to the browser default).
- Dark mode toggle (top right) actually flips every page correctly.
- No console errors on any of the ~90 generated routes. Run `npm run build`
  to statically generate every article/category page at once — that will
  surface any bad data reference faster than clicking through by hand.

## Phase 1 — Sanity Studio

```bash
npx sanity init        # creates a project, fills in ids
cp .env.example .env.local   # then paste in your project id/dataset
npm run studio         # opens the Studio at localhost:3333
```

The schema (`lib/sanity/schemaTypes/`) has three document types:

- **`category`** — the 7 fixed categories (News, Sport, Business, World,
  Report, Lifestyle, Appeals).
- **`author`** — one per journalist. Invite your 15 journalists as Studio
  members separately (Settings → Members in manage.sanity.io) — this
  schema is just their public byline info.
- **`article`** — one document per story, holding BOTH languages' fields
  (`titleDv`/`titleEn`, `bodyDv`/`bodyEn`, etc.) rather than two separate
  documents. That's what lets an editor see both language versions side by
  side, and it's what `slug` being shared between `/article/[slug]` and
  `/en/article/[slug]` assumes. Includes the `featured` toggle (per your
  answer on the roadmap doc) and an `appeal` object for Help/Appeals
  category articles (donation amounts, bank details, supporting documents).

One deliberate change from the original static site: appeal amounts are
now one shared pair of numbers (`raisedAmount`/`targetAmount`) instead of
separately hand-typed text per language — the original dv/en placeholder
pages actually disagreed with each other on the numbers for the "same"
appeal, which a real CMS shouldn't allow.

## Phase 4 — migrating real content into Sanity

Once Phase 1's Studio is set up:

```bash
node scripts/migrate-to-sanity.mjs
npx sanity dataset import sanity-migration.ndjson production
```

This turns the 80 parsed articles into 59 Sanity documents (7 categories +
12 authors + 40 articles) and uploads every hero image from Unsplash as a
real Sanity asset along the way. Read the comment block at the top of
`scripts/migrate-to-sanity.mjs` first — it explains two data-quality issues
in the *original* static site (mismatched appeal amounts and bank-detail
rows between the dv/en placeholder pages) that the script has to make a
judgment call about, and that you should double check in the Studio
afterwards for any real appeal articles.

After importing, flip `lib/data.ts` over to its Sanity-backed functions
(commented out at the bottom of the file — uncomment them, delete the mock
versions above them, and make each page component `async` so it can
`await` them).

## Phase 6 — deploying

This is a standard Next.js App Router project, so it deploys to Vercel
with no special configuration:

```bash
npx vercel
```

Set `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` as
environment variables in the Vercel project settings once you're on Sanity
(same values as your `.env.local`). Deploy the Studio separately with `npm
run studio:deploy` (hosts it free at `<project>.sanity.studio`) so your
journalists don't need a local checkout to publish.

## Content model reference

See `lib/types.ts` for the exact TypeScript shape every page works with,
and the roadmap doc (`atollwire-backend-roadmap.md`, wherever you kept it)
for the original Phase 0 field-by-field discussion this schema implements.

## What's NOT done yet (Phase 5, optional/incremental per the roadmap)

- Contact form backend (it's currently a demo that doesn't send anywhere,
  matching the original static site's behavior exactly).
- Real donation-tracking integration (the `appeal` fields are structured
  data now, but nothing updates `raisedAmount` automatically).
- Site search.
- Comments.

None of these block Phases 0–4/6 — they're separate, addable later.
