"use client";

import { useEffect, useState } from "react";
import { getLiveDates } from "@/lib/liveDate";

interface PrayerTime {
  icon: string;
  name: string;
  time: string; // "HH:MM"
}

type PrayerKey = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";

const PRAYER_META: { key: PrayerKey; icon: string; name: string }[] = [
  { key: "fajr", icon: "🌙", name: "Fajr" },
  { key: "sunrise", icon: "🌅", name: "Sunrise" },
  { key: "dhuhr", icon: "☀️", name: "Dhuhr" },
  { key: "asr", icon: "🌤️", name: "Asr" },
  { key: "maghrib", icon: "🌇", name: "Maghrib" },
  { key: "isha", icon: "✨", name: "Isha" },
];

// Shown until the live /api/prayer-times call resolves, and kept as a
// fallback if that request ever fails — so the card never renders blank.
// These are the same demo placeholder times the original static homepage
// used for Malé.
const FALLBACK_TIMES: Record<PrayerKey, string> = {
  fajr: "04:49",
  sunrise: "05:59",
  dhuhr: "12:04",
  asr: "15:07",
  maghrib: "18:09",
  isha: "19:18",
};

function buildTimes(times: Record<PrayerKey, string>): PrayerTime[] {
  return PRAYER_META.map((m) => ({ icon: m.icon, name: m.name, time: times[m.key] }));
}

function getMaldivesNowMinutes() {
  const now = new Date();
  const maldivesMillis = now.getTime() + 5 * 60 * 60000; // fixed UTC+5
  const d = new Date(maldivesMillis);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function findNextIndex(times: PrayerTime[]): number {
  const nowMinutes = getMaldivesNowMinutes();
  let bestIdx = 0;
  let bestDiff = Infinity;
  times.forEach((t, idx) => {
    const [h, m] = t.time.split(":").map(Number);
    let diff = h * 60 + m - nowMinutes;
    if (diff < 0) diff += 24 * 60;
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = idx;
    }
  });
  return bestIdx;
}

export default function PrayerWidget({
  temp = "31°C",
  weatherDesc = "Malé · Partly cloudy",
  gregDate,
  hijriDate,
}: {
  temp?: string;
  weatherDesc?: string;
  gregDate?: string;
  hijriDate?: string;
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // Live prayer times for Malé, fetched from our own /api/prayer-times
  // route (which in turn asks the Aladhan calculation API) instead of the
  // fixed placeholder times the original static homepage used. Fetched
  // once on mount and re-checked hourly — the times only change once a
  // day, so there's no reason to poll more often than that. Falls back to
  // FALLBACK_TIMES if the request ever fails, so the card still shows
  // something reasonable rather than breaking.
  const [times, setTimes] = useState<Record<PrayerKey, string>>(FALLBACK_TIMES);
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
            sunrise: data.sunrise,
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
  const displayTimes = buildTimes(times);

  useEffect(() => {
    setActiveIdx(findNextIndex(displayTimes));
    const id = setInterval(() => setActiveIdx(findNextIndex(displayTimes)), 60000);
    return () => clearInterval(id);
  }, [times]);

  // gregDate/hijriDate used to default to strings hard-coded at build time.
  // When the caller doesn't pass an explicit date (the homepage never
  // does), compute today's real date instead, client-side only — same
  // reasoning as the header date fix.
  const [liveDates, setLiveDates] = useState({ gregDate: "", hijriDate: "" });
  useEffect(() => {
    const update = () => setLiveDates(getLiveDates("en"));
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);
  const displayGregDate = gregDate ?? liveDates.gregDate;
  const displayHijriDate = hijriDate ?? liveDates.hijriDate;

  return (
    <div className="hero-prayer-mini">
      <div className="hpm-top">
        <div className="hpm-weather">
          <span className="hpm-icon">⛅</span>
          <div>
            <div className="hpm-temp">{temp}</div>
            <div className="hpm-desc">{weatherDesc}</div>
          </div>
        </div>
        <div className="hpm-dates">
          <div className="hpm-greg">{displayGregDate}</div>
          <div className="hpm-hijri">{displayHijriDate}</div>
        </div>
      </div>
      <div className="hpm-times">
        {displayTimes.map((t, idx) => (
          <div
            key={t.name}
            className={`hpm-time-item${idx === activeIdx ? " hpm-active" : ""}`}
          >
            <div className="hpm-t-icon">{t.icon}</div>
            <div className="hpm-t-name">{t.name}</div>
            <div className="hpm-t-time">{t.time}</div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .hero-prayer-mini {
          background: linear-gradient(135deg, #0e2a47 0%, #1b3a6b 100%);
          border-radius: 12px;
          padding: 16px 18px;
          margin-bottom: 8px;
        }
        .hpm-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 14px;
          margin-bottom: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }
        .hpm-weather {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .hpm-weather .hpm-icon {
          font-size: 34px;
        }
        .hpm-weather .hpm-temp {
          color: #fff;
          font-size: 22px;
          font-weight: 800;
          direction: ltr;
        }
        .hpm-weather .hpm-desc {
          /* This card's background is a fixed dark navy gradient in both
             themes (not tied to --sea), so its secondary text needs a
             fixed light color too — var(--sea) flips dark in dark mode
             and would vanish against this always-dark card. */
          color: rgba(255, 255, 255, 0.72);
          font-size: 13px;
        }
        .hpm-dates {
          text-align: right;
        }
        .hpm-dates .hpm-greg {
          color: #fff;
          font-size: 14px;
          font-weight: 700;
        }
        .hpm-dates .hpm-hijri {
          color: rgba(255, 255, 255, 0.72);
          font-size: 12px;
          margin-top: 2px;
        }
        .hpm-times {
          display: flex;
          justify-content: space-between;
          gap: 2px;
        }
        .hpm-time-item {
          text-align: center;
          flex: 1;
          min-width: 0;
        }
        .hpm-time-item .hpm-t-icon {
          font-size: 19px;
          margin-bottom: 4px;
        }
        .hpm-time-item .hpm-t-name {
          color: rgba(255, 255, 255, 0.72);
          font-size: 11px;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .hpm-time-item .hpm-t-time {
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          direction: ltr;
        }
        .hpm-time-item.hpm-active {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 5px 2px;
        }
        .hpm-time-item.hpm-active .hpm-t-time,
        .hpm-time-item.hpm-active .hpm-t-name {
          color: #ef4444;
        }
      `}</style>
    </div>
  );
}
