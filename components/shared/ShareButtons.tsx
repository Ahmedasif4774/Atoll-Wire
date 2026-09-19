"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/types";

// Three real share actions for an article page, replacing the original
// static site's decorative `<a href="#">🔗💬↗</a>` placeholders (they
// looked right but didn't do anything). Client Component because it needs
// onClick handlers, clipboard access, and the Web Share API.
//
//  - Link icon  -> copies the article's URL to the clipboard.
//  - WhatsApp icon -> opens a WhatsApp "share" link pre-filled with the
//    article's title and URL. WhatsApp is the dominant way news gets
//    shared/forwarded in the Maldives, so it gets its own dedicated button
//    rather than being folded into the generic share button.
//  - Share icon -> uses the device's native share sheet (navigator.share) —
//    works well on phones/tablets. Desktop browsers mostly don't support
//    navigator.share, so it falls back to the same "copy link" behavior
//    there instead of silently doing nothing.
export default function ShareButtons({ title, lang }: { title: string; lang: Lang }) {
  const [copied, setCopied] = useState(false);
  // The WhatsApp button below has to be a real <a href> (see the comment on
  // it) — real links need their href up front, but window.location isn't
  // available during server rendering, so this starts empty and fills in
  // right after the page loads in the browser.
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Clipboard API can be unavailable (very old browser, insecure
      // context) — fail silently rather than showing an error for what's
      // a minor convenience feature.
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function shareGeneric() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url: window.location.href });
        return;
      } catch {
        // User cancelled the share sheet, or it threw — either way, no
        // fallback needed here since the sheet itself already opened.
        return;
      }
    }
    // No native share sheet on this browser (most desktops) — copying the
    // link is the next best thing.
    copyLink();
  }

  const labels =
    lang === "dv"
      ? { copy: "ލިންކު ކޮޕީކުރައްވާ", whatsapp: "ވަޓްސްއެޕުން ހިއްސާކުރައްވާ", share: "ހިއްސާކުރައްވާ", copied: "ކޮޕީ ކުރެވިއްޖެ" }
      : { copy: "Copy link", whatsapp: "Share on WhatsApp", share: "Share", copied: "Copied!" };

  // WhatsApp URL, built from whatever we know so far — "#" until pageUrl is
  // filled in just after mount (see the useEffect above).
  const waHref = pageUrl ? `https://wa.me/?text=${encodeURIComponent(`${title} ${pageUrl}`)}` : "#";

  return (
    <div className="share-btns">
      <span className={`copied-toast${copied ? " show" : ""}`}>{labels.copied}</span>
      <button type="button" className="share-btn" aria-label={labels.copy} title={labels.copy} onClick={copyLink}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
          <path d="M14 11a5 5 0 0 0-7.07 0l-2.83 2.83a5 5 0 0 0 7.07 7.07l1.5-1.5" />
        </svg>
      </button>
      {/* A real link, not a button+window.open — mobile browsers reliably
          hand a genuine <a href="https://wa.me/..."> tap off to the
          WhatsApp app, but often silently swallow window.open() calls as
          a blocked popup, which is why the old version of this button
          worked on desktop but did nothing when tapped on a phone. */}
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="share-btn whatsapp"
        aria-label={labels.whatsapp}
        title={labels.whatsapp}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.06-1.33A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2Zm0 18c-1.6 0-3.13-.43-4.45-1.19l-.32-.19-3.02.79.81-2.94-.21-.31A7.9 7.9 0 0 1 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8Zm4.44-5.97c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.44-1.34-1.68-.14-.24-.02-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.4-.54-.4h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.43-.58 1.63-1.15.2-.56.2-1.04.14-1.15-.06-.1-.22-.16-.46-.28Z" />
        </svg>
      </a>
      <button type="button" className="share-btn" aria-label={labels.share} title={labels.share} onClick={shareGeneric}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </button>

      <style jsx>{`
        .share-btns {
          display: flex;
          gap: 8px;
          direction: ltr;
          position: relative;
        }
        .share-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid var(--line);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ink);
          cursor: pointer;
          padding: 0;
        }
        .share-btn svg {
          width: 16px;
          height: 16px;
        }
        .share-btn:hover {
          border-color: var(--coral);
          color: var(--coral);
        }
        .share-btn.whatsapp:hover {
          border-color: #25d366;
          color: #25d366;
        }
        .copied-toast {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%) translateY(4px);
          background: var(--ink);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .copied-toast.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      `}</style>
    </div>
  );
}
