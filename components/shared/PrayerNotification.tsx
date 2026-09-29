"use client";

import { useEffect, useRef, useState } from "react";

type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

// Sunrise is intentionally excluded here — it's shown in the prayer time
// card for reference, but it isn't a prayer, so it doesn't get a popup.
const PRAYER_LABELS: Record<"dv" | "en", Record<PrayerKey, { icon: string; name: string }>> = {
  dv: {
    fajr: { icon: "🌙", name: "ފަތިސް" },
    dhuhr: { icon: "☀️", name: "މެންދުރު" },
    asr: { icon: "🌤️", name: "ޢަޞްރު" },
    maghrib: { icon: "🌇", name: "މަޣްރިބް" },
    isha: { icon: "✨", name: "ޢިޝާ" },
  },
  en: {
    fajr: { icon: "🌙", name: "Fajr" },
    dhuhr: { icon: "☀️", name: "Dhuhr" },
    asr: { icon: "🌤️", name: "Asr" },
    maghrib: { icon: "🌇", name: "Maghrib" },
    isha: { icon: "✨", name: "Isha" },
  },
};

const MESSAGE: Record<"dv" | "en", (name: string) => string> = {
  dv: (name) => `${name} ނަމާދުގެ ވަގުތު ޖެހިއްޖެ`,
  en: (name) => `It's time for ${name} prayer`,
};

// Same fallback times PrayerWidget uses, so the notification still fires
// at a sensible moment if the live /api/prayer-times call ever fails.
const FALLBACK_TIMES: Record<PrayerKey, string> = {
  fajr: "04:49",
  dhuhr: "12:04",
  asr: "15:07",
  maghrib: "18:09",
  isha: "19:18",
};

// How long the popup stays on screen before it auto-dismisses. Keep this
// in sync with the "10s" in the .pt-progress animation below.
const VISIBLE_MS = 10_000;

// How often we check the clock against the prayer times. Times are
// minute-precision, so checking every few seconds is plenty and keeps the
// popup's appearance within a few seconds of the real time without being
// wasteful.
const CHECK_INTERVAL_MS = 5_000;

const SESSION_KEY = "aw-prayer-notified";

function getMaldivesNow(): { hhmm: string; dateKey: string } {
  // Maldives keeps a fixed UTC+5 offset year-round (no daylight saving) —
  // same trick used elsewhere in this app (see lib/liveDate.ts and
  // PrayerWidget) to compute "now" in Malé regardless of the visitor's
  // own clock/timezone.
  const now = new Date();
  const maldives = new Date(now.getTime() + 5 * 60 * 60000);
  const hh = String(maldives.getUTCHours()).padStart(2, "0");
  const mm = String(maldives.getUTCMinutes()).padStart(2, "0");
  const dateKey = `${maldives.getUTCFullYear()}-${maldives.getUTCMonth()}-${maldives.getUTCDate()}`;
  return { hhmm: `${hh}:${mm}`, dateKey };
}

// A small toast that pops up the moment a prayer time is reached, stays
// for VISIBLE_MS, then disappears on its own (or sooner if dismissed).
// Mounted once per locale in that locale's root layout, same pattern as
// VisitorBadge.
export default function PrayerNotification({ locale }: { locale: "dv" | "en" }) {
  const [times, setTimes] = useState<Record<PrayerKey, string>>(FALLBACK_TIMES);
  const [active, setActive] = useState<PrayerKey | null>(null);
  // Tracks which "dateKey-prayerKey" combos already popped, so a prayer
  // time triggers the notification exactly once rather than on every
  // check-interval tick while the clock still matches that minute.
  const notifiedRef = useRef<Set<string>>(new Set());
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live prayer times, fetched once and re-checked hourly — same approach
  // as PrayerWidget (times only change once a day).
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/prayer-times");
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        if (!cancelled && !data.error) {
          setTimes({
            fajr: data.fajr,
            dhuhr: data.dhuhr,
            asr: data.asr,
            maghrib: data.maghrib,
            isha: data.isha,
          });
        }
      } catch {
        // Keep showing FALLBACK_TIMES.
      }
    }
    load();
    const id = setInterval(load, 60 * 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    // Restore today's already-notified set from sessionStorage so a page
    // refresh right after a prayer time doesn't pop the same notification
    // again later in the same browsing session. Best-effort: if this
    // fails (private browsing, storage disabled) the notification can at
    // worst re-fire once after a refresh, which is harmless.
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const { dateKey: today } = getMaldivesNow();
        if (parsed?.dateKey === today && Array.isArray(parsed.keys)) {
          notifiedRef.current = new Set(parsed.keys);
        }
      }
    } catch {
      // Ignore — sessionStorage may be unavailable.
    }

    function persist(dateKey: string) {
      try {
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ dateKey, keys: Array.from(notifiedRef.current) })
        );
      } catch {
        // Best-effort only.
      }
    }

    function check() {
      const { hhmm, dateKey } = getMaldivesNow();
      (Object.keys(times) as PrayerKey[]).forEach((key) => {
        if (times[key] !== hhmm) return;
        const fireKey = `${dateKey}-${key}`;
        if (notifiedRef.current.has(fireKey)) return;
        notifiedRef.current.add(fireKey);
        persist(dateKey);
        setActive(key);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(() => setActive(null), VISIBLE_MS);
      });
    }

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => {
      clearInterval(id);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [times]);

  if (!active) return null;

  const { icon, name } = PRAYER_LABELS[locale][active];

  return (
    <div className="prayer-toast" role="status" dir={locale === "dv" ? "rtl" : "ltr"}>
      <span className="pt-icon">{icon}</span>
      <div className="pt-body">
        <div className="pt-message">{MESSAGE[locale](name)}</div>
        <div className="pt-time">{times[active]}</div>
      </div>
      <button
        type="button"
        className="pt-close"
        aria-label={locale === "dv" ? "ބަންދުކުރޭ" : "Dismiss"}
        onClick={() => {
          if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
          setActive(null);
        }}
      >
        ×
      </button>
      <div className="pt-progress" />
      <style jsx>{`
        .prayer-toast {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 200;
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 14px 18px;
          box-shadow: 0 10px 30px rgba(14, 42, 46, 0.22);
          max-width: min(92vw, 380px);
          overflow: hidden;
          animation: prayer-toast-in 0.35s ease-out;
        }
        .pt-icon {
          font-size: 28px;
          flex-shrink: 0;
        }
        .pt-body {
          flex: 1;
          min-width: 0;
        }
        .pt-message {
          color: var(--ink);
          font-size: 14px;
          font-weight: 700;
          line-height: 1.4;
        }
        .pt-time {
          color: var(--ink-soft);
          font-size: 12px;
          margin-top: 2px;
          direction: ltr;
        }
        .pt-close {
          background: none;
          border: none;
          color: var(--ink-soft);
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
          padding: 4px;
          flex-shrink: 0;
        }
        .pt-close:hover {
          color: var(--ink);
        }
        .pt-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background: var(--teal);
          animation: prayer-toast-progress 10s linear forwards;
        }
        @keyframes prayer-toast-in {
          from {
            opacity: 0;
            transform: translate(-50%, -12px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        @keyframes prayer-toast-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
