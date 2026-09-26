// GROQ queries for the Sanity-backed versions of lib/data.ts's functions
// (see the commented-out block at the bottom of that file).
//
// The article schema (lib/sanity/schemaTypes/article.ts) stores both
// languages on one document — titleDv/titleEn, bodyDv/bodyEn, etc — so
// every query here takes a $lang param ("dv" | "en") and uses GROQ's
// select() to pick the right language's fields, projecting the result into
// the exact same shape as lib/types.ts's Article/Category interfaces. That
// means no page component needs to change when you switch lib/data.ts over
// from the mock JSON to these queries.
//
// Two fields on the mock Article type — timeAgo and readTime — are
// pre-formatted strings in data/content.json, but Sanity only stores the
// raw publishedAt datetime and the body content. lib/data.ts computes them
// at request time from publishedAt/body after fetching, rather than in GROQ.
//
// Note on recentArticlesQuery/relatedArticlesQuery: these deliberately do
// NOT slice the result in GROQ (no "[0...$limit]") — GROQ array slice
// bounds need to be plain numbers, not query parameters, so the $limit
// truncation happens in JS after the fetch instead (see lib/data.ts).

const articleProjection = /* groq */ `{
  "slug": slug.current,
  "lang": $lang,
  "category": category->slug.current,
  "title": select($lang == "dv" => titleDv, titleEn),
  "dek": select($lang == "dv" => dekDv, dekEn),
  "author": {
    "name": select($lang == "dv" => author->nameDv, author->nameEn),
    "initials": select($lang == "dv" => author->initialsDv, author->initialsEn)
  },
  "publishedAt": publishedAt,
  "heroImage": {
    "url": heroImage.asset->url,
    "alt": select($lang == "dv" => heroImageAltDv, heroImageAltEn)
  },
  "caption": select($lang == "dv" => captionDv, captionEn),
  // The raw body array's "block" (paragraph) and "videoEmbed" entries
  // already carry every field lib/data.ts's blocksToBody() needs via the
  // "..." spread below. An "image" entry only stores an asset REFERENCE
  // though, so it needs its own projection to resolve that into an actual
  // URL the <img> tag can use — same asset->url pattern as heroImage above.
  "body": select($lang == "dv" => bodyDv, bodyEn)[]{
    ...,
    _type == "image" => {
      "imageUrl": asset->url,
      size
    }
  },
  "tags": select($lang == "dv" => tagsDv, tagsEn),
  featured,
  popular,
  "appeal": select(
    defined(appeal) => {
      "raisedAmount": appeal.raisedAmount,
      "targetAmount": appeal.targetAmount,
      "pctValue": round((appeal.raisedAmount / appeal.targetAmount) * 100),
      "deadlineDate": appeal.deadlineDate,
      "bankDetails": appeal.bankDetails[]{
        "label": select($lang == "dv" => labelDv, labelEn),
        value
      },
      "note": select($lang == "dv" => appeal.noteDv, appeal.noteEn),
      "documents": appeal.documents[]{ name, meta, "fileUrl": file.asset->url }
    },
    null
  )
}`;

export const allCategoriesQuery = /* groq */ `
  *[_type == "category"] | order(labelEn asc) {
    "slug": slug.current, labelDv, labelEn
  }
`;

// Every query below filters on status == "approved" — this is the actual
// approval gate. A journalist can write, save, and even "Publish" a document
// in Sanity Studio; none of that makes it visible on the live site until an
// editor flips its Status field to Approved (see lib/sanity/schemaTypes/
// article.ts). Do not remove this filter from a query without adding an
// equivalent check elsewhere, or unapproved drafts become publicly visible.
const APPROVED = `status == "approved"`;

export const articleBySlugQuery = /* groq */ `
  *[_type == "article" && slug.current == $slug && ${APPROVED}][0] ${articleProjection}
`;

export const allArticlesQuery = /* groq */ `
  *[_type == "article" && ${APPROVED}] | order(publishedAt desc) ${articleProjection}
`;

export const articlesByCategoryQuery = /* groq */ `
  *[_type == "article" && category->slug.current == $category && ${APPROVED}] | order(publishedAt desc) ${articleProjection}
`;

export const featuredArticlesQuery = /* groq */ `
  *[_type == "article" && featured == true && ${APPROVED}] | order(publishedAt desc) ${articleProjection}
`;

export const popularArticlesQuery = /* groq */ `
  *[_type == "article" && popular == true && ${APPROVED}] | order(publishedAt desc) ${articleProjection}
`;

// No slice here — lib/data.ts's getRecentArticles takes the first `limit`
// results in JS after fetching.
export const recentArticlesQuery = /* groq */ `
  *[_type == "article" && slug.current != $excludeSlug && ${APPROVED}] | order(publishedAt desc) ${articleProjection}
`;

// No slice here either — see recentArticlesQuery's comment above.
export const relatedArticlesQuery = /* groq */ `
  *[_type == "article" && slug.current != $slug && category->slug.current == $category && ${APPROVED}]
    | order(publishedAt desc) ${articleProjection}
`;

// Singleton document (lib/sanity/schemaTypes/liveSettings.ts) holding the
// manually-pasted YouTube and Facebook Live URLs. Deliberately NOT sliced
// with "[0]" here — a live production bug showed that a bare
// "*[_type == \"liveSettings\"][0] { ... }" query returned null even though
// the exact same unsliced query reliably found the one matching document.
// Slicing in JS after the fetch (same pattern already used by
// recentArticlesQuery/relatedArticlesQuery above) sidesteps that entirely.
export const liveSettingsQuery = /* groq */ `
  *[_type == "liveSettings"] { youtubeLiveUrl, facebookLiveUrl }
`;
