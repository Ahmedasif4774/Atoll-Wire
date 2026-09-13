"use client";

import { useEffect, useRef, useState } from "react";

// How often each open tab tells the server "I'm still here".
const HEARTBEAT_MS = 10_000;

// The "N reading now" badge in the corner. This is a REAL live count, not
// a decorative animation: every open browser tab pings /api/presence on
// this interval, and the server reports back how many tabs it's heard
// from recently (see that route for how the count is kept and its
// caveats on serverless hosting). Opening a second tab shows 2; closing a
// tab (or leaving the site) drops the count within ~25 seconds.
export default function VisitorBadge() {
  const [count, setCount] = useState<number | null>(null);
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    // One id per browser tab. sessionStorage is scoped to this specific
    // tab and survives navigating around the site in it (so refreshing or
    // clicking between pages doesn't create a new session), but a
    // freshly opened tab always gets its own id — which is exactly what
    // we want two tabs open side by side to count as 2, not 1.
    let id = sessionStorage.getItem("aw-session-id");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("aw-session-id", id);
    }
    sessionIdRef.current = id;

    const beat = () => {
      fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.count === "number") setCount(data.count);
        })
        .catch(() => {
          // Network hiccup — the next heartbeat will retry.
        });
    };

    beat();
    const intervalId = setInterval(beat, HEARTBEAT_MS);

    // Best-effort: tell the server we're leaving so the count drops right
    // away instead of waiting for the heartbeat to time out. sendBeacon
    // is built for exactly this (fires reliably even as the tab closes).
    const announceLeaving = () => {
      navigator.sendBeacon?.(
        "/api/presence",
        new Blob([JSON.stringify({ sessionId: sessionIdRef.current, leaving: true })], {
          type: "application/json",
        })
      );
    };
    window.addEventListener("pagehide", announceLeaving);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("pagehide", announceLeaving);
    };
  }, []);

  // Don't show a number until the first heartbeat actually lands — a
  // guessed starting value would defeat the point of this being real.
  if (count === null) return null;

  return (
    <div className="visitor-badge">
      <span className="live-dot" />
      <span>
        <strong>{count.toLocaleString()}</strong> reading now
      </span>
      <style jsx>{`
        .visitor-badge {
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 9px 16px 9px 12px;
          box-shadow: 0 6px 20px rgba(14, 42, 46, 0.15);
          font-family: "JetBrains Mono", monospace;
          font-size: 12.5px;
          color: var(--ink);
          direction: ltr;
        }
        .visitor-badge .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2e7d32;
          position: relative;
        }
        .visitor-badge .live-dot::after {
          content: "";
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid #2e7d32;
          animation: pulse-ring 1.8s ease-out infinite;
        }
        @keyframes pulse-ring {
          0% {
            transform: scale(0.6);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
        .visitor-badge strong {
          font-weight: 700;
        }
        @media (max-width: 600px) {
          .visitor-badge {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
