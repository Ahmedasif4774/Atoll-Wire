import { defineField, defineType } from "sanity";

// Phase 0 content model — categories are a small fixed list (7 of them),
// but modeling them as documents (rather than a hardcoded array) lets an
// editor rename/reorder them later without a code change.
export default defineType({
  name: "category",
  title: "Category",
  type: "document",
  fields: [
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "labelEn" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "labelDv",
      title: "Label (Dhivehi)",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "labelEn",
      title: "Label (English)",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: "labelEn", subtitle: "slug.current" },
  },
});
