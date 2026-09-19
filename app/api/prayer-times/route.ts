import { NextResponse } from "next/server";

// Malé, Maldives coordinates — used to request the correct location's
// prayer times regardless of where a visitor is actually browsing from
// (the site always shows Malé times, same as the "Malé · ..." weather
// line next to it).
const LATITUDE = 4.1755;
const LONGITUDE = 73.5093;

// Muslim World League calculation (Fajr 18°, Isha 17°) — a widely used
// standard. If a day's output doesn't line up with the Salat MV app,
// this is the one number to try changing: aladhan.com/calculation-methods
// lists the other method ids available.
const CALCULATION_METHOD = 3;

// Maldives keeps a fixed UTC+5 offset year-round (no daylight saving) —
// the same trick used elsewhere in this app (see lib/liveDate.ts) to
// compute "today" in Malé regardless of the server's or visitor's own
// clock/timezone.
function getMaldivesTodayDDMMYYYY(): string {
  const now = new Date();
  const maldives = new Date(now.getTime() + 5 * 60 * 60000);
  const dd = String(maldives.getUTCDate()).padStart(2, "0");
  const mm = String(maldives.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = maldives.getUTCFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// The Aladhan API appends a UTC-offset suffix to every time, e.g.
// "04:49 (+05)" — strip it down to a plain "HH:MM".
function stripOffset(time: string): string {
  return time.split(" ")[0];
}

// Prayer times only change once a day, so there's no need to hit the
// upstream API more than once an hour even under heavy traffic.
export const revalidate = 3600;

export async function GET() {
  const date = getMaldivesTodayDDMMYYYY();
  const url = `https://api.aladhan.com/v1/timings/${date}?latitude=${LATITUDE}&longitude=${LONGITUDE}&method=${CALCULATION_METHOD}`;

  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) throw new Error(`Aladhan API responded ${res.status}`);
    const body = await res.json();
    const timings = body?.data?.timings;
    if (!timings) throw new Error("Unexpected Aladhan API response shape");

    return NextResponse.json({
      fajr: stripOffset(timings.Fajr),
      sunrise: stripOffset(timings.Sunrise),
      dhuhr: stripOffset(timings.Dhuhr),
      asr: stripOffset(timings.Asr),
      maghrib: stripOffset(timings.Maghrib),
      isha: stripOffset(timings.Isha),
    });
  } catch (err) {
    console.error("Failed to fetch prayer times:", err);
    // The client-side PrayerWidget falls back to a fixed placeholder set
    // of times when this route errors, so the card never renders blank.
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
