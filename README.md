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

## Facebook auto-posting

When an editor sets an article's Status to **Approved** in Sanity Studio, it
gets posted to the AtollWire Facebook Page automatically — unless that
article has **"Don't share to social media"** ticked (Meta tab, defaults to
unticked). The plumbing: a Sanity webhook fires on every article
create/update → `app/api/webhooks/sanity-publish/route.ts` checks the
status/checkbox/already-posted gates → posts a plain link (title + dek) to
the Page via the Graph API → writes `socialPostedAt`/`socialPostId` back
onto the article so it's never posted twice.

None of this does anything until the one-time setup below is done.

**1. Create a Facebook Page access token** (skip if you already have a Page
and a Meta developer app):

1. Make sure you have a Facebook **Page** for AtollWire (not a personal
   profile — the Graph API only posts to Pages).
2. Create a Meta app at https://developers.facebook.com/apps (type:
   "Business"), and add the Page as an asset the app can access.
3. In [Graph API Explorer](https://developers.facebook.com/tools/explorer),
   select your app, generate a **User** token with the `pages_show_list` and
   `pages_manage_posts` permissions, then call
   `GET /me/accounts` — this returns your Page's `id` and a **Page access
   token** in the same response.
4. That Page token from step 3 is already long-lived in practice for
   Business-verified apps; if Meta later requires it, exchange it for a
   long-lived one via `GET /oauth/access_token?grant_type=fb_exchange_token&...`
   (see Meta's docs — this only differs if you hit token-expiry issues).
5. Getting the app fully reviewed by Meta (required before it can post
   without you personally being logged in as a developer/tester on the app)
   typically takes 2-4 weeks — until then the token only works for
   admins/testers added to the app.

**2. Set environment variables in Vercel** (Project Settings → Environment
Variables): `FB_PAGE_ID`, `FB_PAGE_ACCESS_TOKEN`, and `SANITY_WEBHOOK_SECRET`
(any long random string — generate one with e.g. `openssl rand -hex 24`).
Also confirm `SANITY_API_TOKEN` is set to a token with **Editor** access, not
just Viewer — the webhook needs to write `socialPostedAt` back to the
article after posting.

**3. Create the webhook in Sanity** at manage.sanity.io → your project → API
→ Webhooks → Create webhook:

- **URL**: `https://<your-deployed-domain>/api/webhooks/sanity-publish`
- **Dataset**: `production`
- **Trigger on**: Create, Update
- **Filter**: `_type == "article"`
- **Projection**:
  ```
  {
    "_id": _id,
    "_type": _type,
    "status": status,
    "skipSocialShare": skipSocialShare,
    "socialPostedAt": socialPostedAt,
    "titleDv": titleDv,
    "dekDv": dekDv,
    "slug": slug.current
  }
  ```
- **Secret**: the same value you put in `SANITY_WEBHOOK_SECRET`
- **HTTP method**: POST, **API version**: latest

Once all three are done, approving an article (with the checkbox left
unticked) should post it to the Page within a few seconds. Check the
article's "Posted to Facebook at" field in Studio, or the Vercel function
logs for `[sanity-publish webhook]` lines, if a post doesn't show up.

## What's NOT done yet (Phase 5, optional/incremental per the roadmap)

- Contact form backend (it's currently a demo that doesn't send anywhere,
  matching the original static site's behavior exactly).
- Real donation-tracking integration (the `appeal` fields are structured
  data now, but nothing updates `raisedAmount` automatically).
- Site search.
- Comments.

None of these block Phases 0–4/6 — they're separate, addable later.
