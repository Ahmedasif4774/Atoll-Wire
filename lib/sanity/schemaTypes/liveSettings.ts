import { defineField, defineType } from "sanity";

// Singleton-style document: there should only ever be ONE liveSettings
// document in the dataset. It exists purely so a non-technical editor can
// paste/clear a Facebook Live URL from Sanity Studio (no code change, no
// redeploy) — YouTube's live status is detected automatically instead, via
// the YouTube Data API (see app/api/live-status/route.ts), because a
// channel handle is stable and doesn't need to be re-entered per stream.
//
// To show a Facebook Live video on the homepage banner: open this document
// in Studio, paste the full facebook.com URL of the live video (a
// "share" link like https://www.facebook.com/share/v/xxxx/ works fine),
// and Publish. To hide it again once the stream ends, clear the field back
// to empty and Publish.
export default defineType({
  name: "liveSettings",
  title: "Live Stream Settings",
  type: "document",
  fields: [
    defineField({
      name: "facebookLiveUrl",
      title: "Facebook Live URL",
      description:
        "Paste the Facebook video/live URL here while a Facebook Live is running, to show it in the homepage live banner. Clear this field (delete the text) and Publish once the stream ends, to hide it again. Leave empty when there is no Facebook Live running.",
      type: "url",
      validation: (Rule) =>
        Rule.uri({ allowRelative: false, scheme: ["http", "https"] }),
    }),
  ],
  preview: {
    prepare() {
      return { title: "Live Stream Settings" };
    },
  },
});
