import { defineField, defineType, defineArrayMember } from "sanity";

// Shared between bodyDv and bodyEn below (an editor building the Dhivehi
// and English versions of the same story gets the identical photo/video
// block everywhere) rather than defined twice and risking the two drifting.
//
// Keeping the type name "image" (the default for `type: "image"`, same as
// before this feature existed) rather than renaming it to something like
// "bodyImage" means any article that already had a plain image block in its
// body keeps working unchanged — this just adds two optional fields to it.
const bodyImageMember = defineArrayMember({
  type: "image",
  title: "Photo",
  options: { hotspot: true },
  fields: [
    defineField({ name: "alt", title: "Alt text", description: "Describes the photo for screen readers/SEO.", type: "string" }),
    defineField({ name: "caption", title: "Caption", type: "string" }),
  ],
});

// A pasted YouTube/Vimeo link, not an uploaded video file — see
// lib/videoEmbed.ts for why (turns this URL into an iframe embed at render
// time) and components/*/ArticlePageClient.tsx for where it's rendered.
const bodyVideoMember = defineArrayMember({
  type: "object",
  name: "videoEmbed",
  title: "Video",
  fields: [
    defineField({
      name: "url",
      title: "Video URL",
      description: "Paste a YouTube or Vimeo link (e.g. https://youtu.be/... or https://vimeo.com/...).",
      type: "url",
      validation: (Rule) => Rule.required().uri({ scheme: ["http", "https"] }),
    }),
    defineField({ name: "caption", title: "Caption", type: "string" }),
  ],
  preview: {
    select: { title: "url", subtitle: "caption" },
    prepare({ title, subtitle }) {
      return { title: title || "Video", subtitle };
    },
  },
});

// Phase 0 content model, as agreed on the roadmap doc, implemented as a
// single bilingual document per story (one document = one URL slug,
// reachable at /article/[slug] in Dhivehi and /en/article/[slug] in
// English) rather than two separate documents. That's what lets an editor
// see both language versions of a story side by side, and it's what
// lib/data.ts's Sanity-backed functions (commented out for now) expect.
//
// Fields marked "(both languages)" hold one value per language because the
// original static site's dv/en copy genuinely diverges — different words,
// sometimes different photo captions — not just RTL vs LTR of the same text.
export default defineType({
  name: "article",
  title: "Article",
  type: "document",
  groups: [
    { name: "dv", title: "Dhivehi" },
    { name: "en", title: "English" },
    { name: "meta", title: "Meta", default: true },
  ],
  fields: [
    defineField({
      name: "status",
      title: "Status",
      description:
        "Controls whether this article is visible on the live website. Journalists write and save as Draft, then move it to Pending Review when ready. The article only appears on AtollWire once an editor sets this to Approved — saving or even publishing the document in Sanity does NOT make it public on its own.",
      type: "string",
      options: {
        list: [
          { title: "Draft", value: "draft" },
          { title: "Pending Review", value: "pendingReview" },
          { title: "Approved (live on site)", value: "approved" },
        ],
        layout: "radio",
      },
      initialValue: "draft",
      group: "meta",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      description: "Shared by both language versions, e.g. \"harbor\" → /article/harbor and /en/article/harbor.",
      type: "slug",
      options: { source: "titleEn", maxLength: 96 },
      group: "meta",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
      group: "meta",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "author" }],
      group: "meta",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Published date",
      type: "datetime",
      group: "meta",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "featured",
      title: "Featured",
      description: "Eligible for the homepage hero / editor's-pick slots.",
      type: "boolean",
      initialValue: false,
      group: "meta",
    }),
    defineField({
      name: "popular",
      title: "Popular",
      description:
        "Shown in the \"Popular News\" sidebar on category pages. Not in the original Phase 0 spec — added to model that sidebar as data instead of a hardcoded list; safe to ignore if you don't want it.",
      type: "boolean",
      initialValue: false,
      group: "meta",
    }),
    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "image",
      options: { hotspot: true },
      group: "meta",
      validation: (Rule) => Rule.required(),
    }),

    // ---- Dhivehi ----
    defineField({ name: "titleDv", title: "Title", type: "string", group: "dv", validation: (Rule) => Rule.required() }),
    defineField({ name: "dekDv", title: "Dek (standfirst)", type: "text", rows: 2, group: "dv" }),
    defineField({ name: "heroImageAltDv", title: "Hero image alt text", type: "string", group: "dv" }),
    defineField({ name: "captionDv", title: "Photo caption", type: "string", group: "dv" }),
    defineField({
      name: "bodyDv",
      title: "Body",
      description: "Write your paragraphs, then use the + button to drop in a photo or a YouTube/Vimeo video link wherever it belongs in the story.",
      type: "array",
      of: [defineArrayMember({ type: "block" }), bodyImageMember, bodyVideoMember],
      group: "dv",
    }),
    defineField({
      name: "tagsDv",
      title: "Tags",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
      group: "dv",
    }),

    // ---- English ----
    defineField({ name: "titleEn", title: "Title", type: "string", group: "en", validation: (Rule) => Rule.required() }),
    defineField({ name: "dekEn", title: "Dek (standfirst)", type: "text", rows: 2, group: "en" }),
    defineField({ name: "heroImageAltEn", title: "Hero image alt text", type: "string", group: "en" }),
    defineField({ name: "captionEn", title: "Photo caption", type: "string", group: "en" }),
    defineField({
      name: "bodyEn",
      title: "Body",
      description: "Write your paragraphs, then use the + button to drop in a photo or a YouTube/Vimeo video link wherever it belongs in the story.",
      type: "array",
      of: [defineArrayMember({ type: "block" }), bodyImageMember, bodyVideoMember],
      group: "en",
    }),
    defineField({
      name: "tagsEn",
      title: "Tags",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
      group: "en",
    }),

    // ---- Help / appeal fields (only used when category = "help") ----
    // Amounts are one shared pair of numbers rather than per-language text
    // ("raisedText"/"targetText") — the original static site had those as
    // independently hand-typed strings per language, which drifted (the dv
    // and en placeholder pages even showed different totals for the "same"
    // appeal). Storing one real number and formatting it per language at
    // render time keeps the two language versions honest with each other.
    defineField({
      name: "appeal",
      title: "Appeal / donation details",
      description: "Fill this in only for articles in the Help/Appeals category.",
      type: "object",
      group: "meta",
      fields: [
        defineField({ name: "raisedAmount", title: "Amount raised (MVR)", type: "number" }),
        defineField({ name: "targetAmount", title: "Target amount (MVR)", type: "number" }),
        defineField({
          name: "deadlineDate",
          title: "Campaign deadline",
          description: "Shows a \"N days left\" countdown badge on this appeal wherever it's shown. Leave blank for appeals with no fixed deadline — the badge just won't appear.",
          type: "date",
        }),
        defineField({
          name: "bankDetails",
          title: "Bank details",
          type: "array",
          of: [
            defineArrayMember({
              type: "object",
              name: "bankDetailRow",
              fields: [
                defineField({ name: "labelDv", title: "Label (Dhivehi)", type: "string" }),
                defineField({ name: "labelEn", title: "Label (English)", type: "string" }),
                defineField({ name: "value", title: "Value", type: "string" }),
              ],
              preview: { select: { title: "labelEn", subtitle: "value" } },
            }),
          ],
        }),
        defineField({ name: "noteDv", title: "Note (Dhivehi)", type: "text", rows: 2 }),
        defineField({ name: "noteEn", title: "Note (English)", type: "text", rows: 2 }),
        defineField({
          name: "documents",
          title: "Supporting documents",
          type: "array",
          of: [
            defineArrayMember({
              type: "object",
              name: "appealDocument",
              fields: [
                defineField({ name: "name", title: "Document name", type: "string" }),
                defineField({ name: "file", title: "File", type: "file" }),
                defineField({ name: "meta", title: "Meta text (e.g. \"PDF · 420 KB\")", type: "string" }),
              ],
              preview: { select: { title: "name", subtitle: "meta" } },
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "titleEn", subtitle: "slug.current", media: "heroImage", status: "status" },
    prepare({ title, subtitle, media, status }) {
      const statusLabel =
        status === "approved" ? "✅ Approved" : status === "pendingReview" ? "🕓 Pending Review" : "📝 Draft";
      return { title, subtitle: `${statusLabel} · ${subtitle}`, media };
    },
  },
});
