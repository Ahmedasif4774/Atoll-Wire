"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    twttr?: {
      widgets: { load: (el?: HTMLElement) => void };
    };
  }
}

const WIDGETS_SCRIPT_SRC = "https://platform.twitter.com/widgets.js";
const WIDGETS_SCRIPT_ID = "twitter-widgets-js";

// Loads X's official — and still free, no API key needed — widgets.js
// exactly once per page load, however many XPostEmbed instances exist, and
// resolves once it's ready to scan the page for `.twitter-tweet`
// blockquotes to render.
let widgetsScriptPromise: Promise<void> | null = null;
function loadWidgetsScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.twttr) return Promise.resolve();
  if (widgetsScriptPromise) return widgetsScriptPromise;

  widgetsScriptPromise = new Promise((resolve) => {
    const existing = document.getElementById(WIDGETS_SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.id = WIDGETS_SCRIPT_ID;
    script.src = WIDGETS_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    // If the script fails to load (blocked, offline), resolve anyway so
    // callers don't hang forever — the plain link inside the blockquote
    // below is the fallback in that case.
    script.onerror = () => resolve();
    document.body.appendChild(script);
  });
  return widgetsScriptPromise;
}

// Renders a live embed of the given X (Twitter) post URL using X's own
// still-free oEmbed/widgets.js mechanism — no API key, no cost. See the
// research note on lib/sanity/schemaTypes/liveSettings.ts's topXPostUrl
// field for why an editor pasting this URL by hand is the actual free
// option in 2026, X's own API having no free tier at all. If widgets.js
// can't load or run (blocked script, ad blocker, offline), the plain link
// inside the blockquote still works as a fallback.
export default function XPostEmbed({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadWidgetsScript().then(() => {
      if (cancelled) return;
      window.twttr?.widgets.load(containerRef.current ?? undefined);
    });
    return () => {
      cancelled = true;
    };
    // Re-run whenever the pasted URL changes (a new day's post) so the new
    // blockquote gets scanned and rendered too.
  }, [url]);

  return (
    <div ref={containerRef} className="x-post-embed">
      <blockquote className="twitter-tweet" data-dnt="true">
        <a href={url}>View post on X</a>
      </blockquote>
    </div>
  );
}
