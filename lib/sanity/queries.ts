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
// raw publishedAt datetime and the body content. Compute them at request
// time instead of storing them:
//   - timeAgo: a small helper (e.g. the `timeago.js` package, or a one-off
//     function) turning `publishedAt` into "2 hrs ago".
//   - readTime: a word-count helper over the plain text of bodyDv/bodyEn
//     (there are small npm packages for this, e.g. `reading-time`, or just
//     `Math.ceil(wordCount / 200) + " min read"`).
// Do that formatting in the Sanity-backed lib/data.ts functions, after the
// fetch, rather than in GROQ.

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
  "body": select($lang == "dv" => bodyDv, bodyEn),
  "tags": select($lang == "dv" => tagsDv, tagsEn),
  featured,
  popular,
  "appeal": select(
    defined(appeal) => {
      "raisedAmount": appeal.raisedAmount,
      "targetAmount": appeal.targetAmount,
      "pctValue": round((appeal.raisedAmount / appeal.targetAmount) * 100),
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

export const articleBySlugQuery = /* groq */ `
  *[_type == "article" && slug.current == $slug][0] ${articleProjection}
`;

export const allArticlesQuery = /* groq */ `
  *[_type == "article"] | order(publishedAt desc) ${articleProjection}
`;

export const articlesByCategoryQuery = /* groq */ `
  *[_type == "article" && category->slug.current == $category] | order(publishedAt desc) ${articleProjection}
`;

export const featuredArticlesQuery = /* groq */ `
  *[_type == "article" && featured == true] | order(publishedAt desc) ${articleProjection}
`;

export const popularArticlesQuery = /* groq */ `
  *[_type == "article" && popular == true] | order(publishedAt desc) ${articleProjection}
`;

export const recentArticlesQuery = /* groq */ `
  *[_type == "article" && slug.current != $excludeSlug] | order(publishedAt desc) [0...$limit] ${articleProjection}
`;

export const relatedArticlesQuery = /* groq */ `
  *[_type == "article" && slug.current != $slug && category->slug.current == $category]
    | order(publishedAt desc) [0...$limit] ${articleProjection}
`;
