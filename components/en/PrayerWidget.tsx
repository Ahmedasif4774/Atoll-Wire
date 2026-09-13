"use client";

import { useEffect, useState } from "react";

interface PrayerTime {
  icon: string;
  name: string;
  time: string; // "HH:MM"
}

// Same 6 daily prayer times shown on the original static homepage. These
// are demo placeholder times for Malé — wire up a real prayer-times API
// later if this goes live.
const TIMES: PrayerTime[] = [
  { icon: "🌙", name: "Fajr", time: "04:49" },
  { icon: "🌅", name: "Sunrise", time: "05:59" },
  { icon: "☀️", name: "Dhuhr", time: "12:04" },
  { icon: "🌤️", name: "Asr", time: "15:07" },
  { icon: "🌇", name: "Maghrib", time: "18:09" },
  { icon: "✨", name: "Isha", time: "19:18" },
];

function getMaldivesNowMinutes() {
  const now = new Date();
  const maldivesMillis = now.getTime() + 5 * 60 * 60000; // fixed UTC+5
  const d = new Date(maldivesMillis);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function findNextIndex(): number {
  const nowMinutes = getMaldivesNowMinutes();
  let bestIdx = 0;
  let bestDiff = Infinity;
  TIMES.forEach((t, idx) => {
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
  gregDate = "7 September 2026",
  hijriDate = "25 Rabi' al-Awwal 1448 AH",
}: {
  temp?: string;
  weatherDesc?: string;
  gregDate?: string;
  hijriDate?: string;
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useEffect(() => {
    setActiveIdx(findNextIndex());
    const id = setInterval(() => setActiveIdx(findNextIndex()), 60000);
    return () => clearInterval(id);
  }, []);

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
          <div className="hpm-greg">{gregDate}</div>
          <div className="hpm-hijri">{hijriDate}</div>
        </div>
      </div>
      <div className="hpm-times">
        {TIMES.map((t, idx) => (
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
