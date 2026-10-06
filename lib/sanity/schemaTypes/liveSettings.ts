import { defineField, defineType } from "sanity";

// Singleton-style document: there should only ever be ONE liveSettings
// document in the dataset. It gives a non-technical editor two ways to
// put a live video on the homepage banner:
//
//  - youtubeLiveUrl: paste the URL of ANY YouTube Live video (any channel,
//    any event — nothing is auto-detected) and Publish to show it. Unlike
//    facebookLiveUrl below, you do NOT need to remember to clear this one
//    when the stream ends: app/api/live-status/route.ts checks YouTube's
//    own "is this specific video live right now" status on every poll, so
//    the banner drops it automatically the moment the stream ends. Leave
//    this field empty and the YouTube side of the banner just stays
//    hidden — there is no default channel being watched in the
//    background.
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
        "Paste any YouTube Live video URL here to show it in the homepage live banner. Publish to turn it on; no need to clear it afterward, it disappears on its own once YouTube reports the stream has ended. Leave empty when there is no YouTube Live running.",
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
        defineField({
      name: "topXPostUrl",
      title: "Today's top X (Twitter) post URL",
      description:
        "Paste the URL of the best/most relevant X (formerly Twitter) post of the day here, and Publish. It replaces the placeholder X card in the homepage's \"Trending on Social Media\" sidebar with a live embed of that actual post. Leave empty to show the placeholder card instead.",
      type: "url",
      validation: (Rule) =>
        Rule.uri({ allowRelative: false, scheme: ["http", "https"] }),
    }),
    defineField({
      name: "topFacebookPostUrl",
      title: "Today's top Facebook post URL",
      description:
        "Paste the link of the Facebook post you want in the homepage's \"Trending on Social Media\" sidebar, and Publish. While this is filled, it replaces the automatic pick from the AtollWire Facebook Page. Clear it and Publish to go back to the automatic pick. Facebook does not let the website read other pages' posts, so fill the boxes below (page name, post text, picture) to make the card look like the X and TikTok cards.",
      type: "url",
      validation: (Rule) =>
        Rule.uri({ allowRelative: false, scheme: ["http", "https"] }),
    }),
    defineField({
      name: "topFacebookPostPageName",
      title: "Facebook card — page or person name",
      description: "Shown at the top of the card, e.g. \"Sun Online\". Leave empty to show just \"Facebook\".",
      type: "string",
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: "topFacebookPostText",
      title: "Facebook card — post text",
      description: "Copy a line or two from the post. Shown as the main text of the card (same text on both homepages).",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.max(240),
    }),
    defineField({
      name: "topFacebookPostImage",
      title: "Facebook card — picture",
      description: "Optional. Save the post's picture and upload it here (a screenshot of the post's photo is fine).",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "topFacebookPostNoteDv",
      title: "Facebook card — short description (Dhivehi)",
      description:
        "One or two short lines in Dhivehi shown under the Facebook card on the Dhivehi homepage. The Facebook post itself is picked automatically. Leave empty to show the post's reaction counts instead.",
      type: "text",
      rows: 2,
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: "topFacebookPostNoteEn",
      title: "Facebook card — short description (English)",
      description:
        "One or two short lines in English shown under the Facebook card on the English homepage. The Facebook post itself is picked automatically. Leave empty to show the post's reaction counts instead.",
      type: "text",
      rows: 2,
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: "topXPostNoteDv",
      title: "X post — short description (Dhivehi)",
      description:
        "One or two short lines in Dhivehi explaining what this X post is about. Shown under the post on the Dhivehi homepage. Leave empty to show no description.",
      type: "text",
      rows: 2,
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: "topXPostNoteEn",
      title: "X post — short description (English)",
      description:
        "One or two short lines in English explaining what this X post is about. Shown under the post on the English homepage. Leave empty to show no description.",
      type: "text",
      rows: 2,
      validation: (Rule) => Rule.max(200),
    }),

          defineField({
      name: "topTikTokPostUrl",
      title: "Today's top TikTok video URL",
      description:
        "Paste the URL of the best/most relevant TikTok video of the day here, and Publish. It replaces the placeholder TikTok card in the homepage's \"Trending on Social Media\" sidebar with a live embed of that actual video. Leave empty to show the placeholder card instead.",
      type: "url",
      validation: (Rule) =>
        Rule.uri({ allowRelative: false, scheme: ["http", "https"] }),
    }),
    defineField({
      name: "topTikTokPostNoteDv",
      title: "TikTok video — short description (Dhivehi)",
      description:
        "One or two short lines in Dhivehi explaining what this TikTok video is about. Shown under the video on the Dhivehi homepage. Leave empty to show no description.",
      type: "text",
      rows: 2,
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: "topTikTokPostNoteEn",
      title: "TikTok video — short description (English)",
      description:
        "One or two short lines in English explaining what this TikTok video is about. Shown under the video on the English homepage. Leave empty to show no description.",
      type: "text",
      rows: 2,
      validation: (Rule) => Rule.max(200),
    }),
  ],
  preview: {
    prepare() {
      return { title: "Live Stream Settings" };
    },
  },
});
