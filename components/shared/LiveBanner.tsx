"use client";

import { useEffect, useState } from "react";

// Homepage "we're live" banner. Polls app/api/live-status every 30s (kept
// in sync with that route's own YouTube-freshness cache window) and shows
// nothing at all until something is actually live, then automatically
// hides itself again the next time it polls after the stream ends — no
// manual dismiss needed, no leftover banner.
//
// Language-agnostic like ArticleCard: all visible text comes in as
// pre-translated string props from the en/dv HomePageClient callers, this
// component itself doesn't branch on language.
//
// YouTube's live status is detected automatically (channel handle is
// baked into the API route). Facebook's is sourced from a single Sanity
// document (liveSettings) that an editor pastes a URL into by hand while a
// Facebook Live is running — see lib/sanity/schemaTypes/liveSettings.ts
// for why: auto-detecting a Facebook Page's live status needs a Meta
// Developer app + Page Access Token, which is a heavier one-time setup
// than this shared component should block on.
export interface LiveBannerProps {
  liveNowLabel: string;
  youtubeLabel: string;
  facebookLabel: string;
}

interface LiveStatus {
  youtube: { videoId: string } | null;
  facebook: { url: string } | null;
}

const POLL_INTERVAL_MS = 30000;

export default function LiveBanner({ liveNowLabel, youtubeLabel, facebookLabel }: LiveBannerProps) {
  const [status, setStatus] = useState<LiveStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/live-status");
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        if (!cancelled) setStatus(data);
      } catch {
        // Leave whatever status we already had (or null) — a transient
        // failure here shouldn't flip a genuinely-live banner off, and a
        // never-loaded banner should just keep failing closed.
      }
    }

    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const youtubeVideoId = status?.youtube?.videoId ?? null;
  const facebookUrl = status?.facebook?.url ?? null;

  if (!youtubeVideoId && !facebookUrl) return null;

  return (
    <div className="live-banner">
      <div className="live-banner-badge">
        <span className="live-dot" />
        {liveNowLabel}
      </div>

      <div className="live-banner-streams">
        {youtubeVideoId && (
          <div className="live-stream-block">
            <p className="live-stream-label">{youtubeLabel}</p>
            <div className="live-stream-frame">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=0`}
                title={youtubeLabel}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {facebookUrl && (
          <div className="live-stream-block">
            <p className="live-stream-label">{facebookLabel}</p>
            <div className="live-stream-frame">
              <iframe
                src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(facebookUrl)}&show_text=false&autoplay=false`}
                title={facebookLabel}
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .live-banner {
          background: #111;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          color: #fff;
        }
        .live-banner-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #e11d2e;
          color: #fff;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 6px 12px;
          border-radius: 999px;
          margin-bottom: 12px;
        }
        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #fff;
          animation: live-pulse 1.4s ease-in-out infinite;
        }
        @keyframes live-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.35;
          }
        }
        .live-banner-streams {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }
        .live-stream-label {
          font-size: 13px;
          font-weight: 600;
          margin: 0 0 8px;
          color: #ddd;
        }
        .live-stream-frame {
          position: relative;
          width: 100%;
          padding-top: 56.25%;
          border-radius: 8px;
          overflow: hidden;
          background: #000;
        }
        .live-stream-frame iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }
      `}</style>
    </div>
  );
}
