import { defineField, defineType } from "sanity";

// Singleton-style document: there should only ever be ONE liveSettings
// document in the dataset. It gives a non-technical editor two ways to
// put a live video on the homepage banner:
//
//  - youtubeLiveUrl: paste the URL of ANY YouTube Live video (not just the
//    default channel — any live event) and Publish to show it. Unlike
//    facebookLiveUrl below, you do NOT need to remember to clear this one
//    when the stream ends: app/api/live-status/route.ts checks YouTube's
//    own "is this specific video live right now" status on every poll, so
//    the banner drops it automatically the moment the stream ends. Leave
//    this field empty and the site falls back to auto-detecting whatever
//    is live on the default channel handle (also configured in that same
//    route file).
//  - facebookLiveUrl: paste the full facebook.com URL of the live video (a
//    "share" link like https://www.facebook.com/share/v/xxxx/ works fine)
//    while a Facebook Live is running, and Publish. Facebook doesn't give
//    us a free way to check whether a video is still live, so — unlike
//    the YouTube field — this one does NOT auto-close: clear the field
//    back to empty and Publish once the stream ends, or the banner will
//    keep showing the ended stream.
export default defineType({
  name: "liveSettings",
  title: "Live Stream Settings",
  type: "document",
  fields: [
    defineField({
      name: "youtubeLiveUrl",
      title: "YouTube Live URL (any channel/event)",
      description:
        "Paste any YouTube Live video URL here to show it in the homepage live banner — not limited to the default channel. Publish to turn it on; no need to clear it afterward, it disappears on its own once YouTube reports the stream has ended. Leave empty to auto-detect the default channel's own live stream instead.",
      type: "url",
      validation: (Rule) =>
        Rule.uri({ allowRelative: false, scheme: ["http", "https"] }),
    }),
    defineField({
      name: "facebookLiveUrl",
      title: "Facebook Live URL",
      description:
        "Paste the Facebook video/live URL here while a Facebook Live is running, to show it in the homepage live banner. Clear this field (delete the text) and Publish once the stream ends, to hide it again — this one does NOT close itself automatically. Leave empty when there is no Facebook Live running.",
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
