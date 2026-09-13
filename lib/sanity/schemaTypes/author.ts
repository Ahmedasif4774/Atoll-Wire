import { defineField, defineType } from "sanity";

// Phase 1 — one Author document per journalist. Invite the 15 journalists
// as Sanity Studio users separately (Settings → Members); this schema is
// just the public byline data attached to their articles.
//
// nameDv/nameEn are separate fields (not one name translated at display
// time) because a Dhivehi byline is a transliteration, not the same
// string in another script — e.g. "Aminath Waheed" / "އާމިނަތު ވަހީދު".
export default defineType({
  name: "author",
  title: "Author",
  type: "document",
  fields: [
    defineField({
      name: "nameDv",
      title: "Name (Dhivehi)",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "nameEn",
      title: "Name (English)",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "initialsDv",
      title: "Initials (Dhivehi)",
      description: 'Shown in the round avatar badge on article pages (e.g. "އވ").',
      type: "string",
      validation: (Rule) => Rule.required().max(3),
    }),
    defineField({
      name: "initialsEn",
      title: "Initials (English)",
      description: 'Shown in the round avatar badge on article pages (e.g. "AW").',
      type: "string",
      validation: (Rule) => Rule.required().max(3),
    }),
    defineField({
      name: "avatar",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
    }),
  ],
  preview: {
    select: { title: "nameEn", subtitle: "initialsEn" },
  },
});
