import { defineField, defineType } from "sanity";

// Singleton-style document: create ONE "Homepage — top stories" document and
// keep editing it. It lets an editor choose which stories fill the three big
// slots at the top of each homepage (the large main story, and the two
// "editor's choice" cards beside the weather box) without touching code.
//
// Each language site has its own set, so a story that exists only in English
// can be the main story on the English homepage without affecting the
// Dhivehi one. Anything left empty — or a choice that isn't available on
// that site (for example an English-only story picked for the Dhivehi
// homepage) — simply falls back to the site's built-in default story, so a
// homepage slot is never blank.
//
// Changes only go live when this document is PUBLISHED.
const approved = (language: "dv" | "en") =>
  `status == "approved" && defined(${language === "dv" ? "titleDv" : "titleEn"}) && ${
    language === "dv" ? "titleDv" : "titleEn"
  } != ""`;

function pick(name: string, title: string, description: string, language: "dv" | "en", group: "dv" | "en") {
  return defineField({
    name,
    title,
    description,
    type: "reference",
    to: [{ type: "article" }],
    options: { filter: approved(language) },
    group,
  });
}

export default defineType({
  name: "homepageSettings",
  title: "Homepage — top stories",
  type: "document",
  groups: [
    { name: "dv", title: "Dhivehi homepage", default: true },
    { name: "en", title: "English homepage" },
  ],
  fields: [
    pick(
      "heroDv",
      "Main story (big photo)",
      "The large story at the top of the Dhivehi homepage. Only approved stories with a Dhivehi title can be chosen.",
      "dv",
      "dv",
    ),
    pick("editorPickDv1", "Editor's choice 1", "First small card beside the weather box.", "dv", "dv"),
    pick("editorPickDv2", "Editor's choice 2", "Second small card beside the weather box.", "dv", "dv"),
    pick(
      "heroEn",
      "Main story (big photo)",
      "The large story at the top of the English homepage. Only approved stories with an English title can be chosen.",
      "en",
      "en",
    ),
    pick("editorPickEn1", "Editor's choice 1", "First small card beside the weather box.", "en", "en"),
    pick("editorPickEn2", "Editor's choice 2", "Second small card beside the weather box.", "en", "en"),
  ],
  preview: {
    prepare() {
      return { title: "Homepage — top stories", subtitle: "Choose the main story and editor's picks" };
    },
  },
});
