"use client";

import { useEffect } from "react";

const EMBED_SCRIPT_SRC = "https://www.tiktok.com/embed.js";
const EMBED_SCRIPT_ID = "tiktok-embed-js";

// Loads TikTok's official (and free, no API key needed) embed.js exactly
// once per page load. embed.js watches the page for `.tiktok-embed`
// blockquotes and renders them automatically, including ones added after
// the script has already loaded, so unlike XPostEmbed.tsx there is no
// manual re-scan call to make.
function loadEmbedScript() {
  if (typeof window === "undefined") return;
  if (document.getElementById(EMBED_SCRIPT_ID)) return;
  const script = document.createElement("script");
  script.id = EMBED_SCRIPT_ID;
  script.src = EMBED_SCRIPT_SRC;
  script.async = true;
  document.body.appendChild(script);
}

// Renders a live embed of a TikTok video using the ready-made HTML that
// TikTok's own free oEmbed endpoint returns. That HTML is fetched
// server-side in app/api/social-trending/route.ts, so it already contains
// the correct video id. If embed.js can't load (ad blocker, offline), the
// blockquote still shows TikTok's own plain link to the video as a fallback.
export default function TikTokEmbed({ html }: { html: string }) {
  useEffect(() => {
    loadEmbedScript();
  }, [html]);

  return (
    <div
      className="tiktok-embed-wrap"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
