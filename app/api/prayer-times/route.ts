import { NextResponse } from "next/server";

// Malé, Maldives coordinates — used to request the correct location's
// prayer times regardless of where a visitor is actually browsing from
// (the site always shows Malé times, same as the "Malé · ..." weather
// line next to it).
const LATITUDE = 4.1755;
const LONGITUDE = 73.5093;

// Muslim World League calculation (Fajr 18°, Isha 17°) as the base method,
// then nudged per-prayer (see TUNE_MINUTES below) to match Salat MV — the
// app most people in the Maldives actually check.
const CALCULATION_METHOD = 3;

// Salat MV (like most national prayer-time authorities) doesn't publish
// its exact angles/offsets, so instead of guessing we calibrated directly:
// on 19 Sep 2026 (Malé) Salat MV showed Fajr 04:44, Sunrise 05:55, Dhuhr
// 12:04, Asr 15:06, Maghrib 18:06, Isha 19:17, while the raw Muslim World
// League calculation above gave 04:47 / 05:56 / 12:00 / 15:06 / 18:03 /
// 19:08. These are the differences (in minutes), passed to Aladhan's
// `tune` parameter to shift each time to match.
//
// Because Malé sits almost exactly on the equator, the sun crosses the
// horizon at a steep angle year-round and day length barely varies with
// season — so unlike at higher latitudes, a fixed-minute offset like this
// stays accurate across the whole year rather than drifting in and out
// with the seasons. Still, if a future spot-check against Salat MV drifts
// by more than a minute or two, re-calibrate these numbers the same way:
// compare a day's Salat MV times against /api/prayer-times?tune=0,0,0,0,0,0,0,0,0
// (which returns the untuned Muslim World League times) and adjust.
//
// Order (Aladhan's `tune` format): Imsak, Fajr, Sunrise, Dhuhr, Asr,
// Maghrib, Sunset, Isha, Midnight. Only the six we display are tuned.
const TUNE_MINUTES = "0,-3,-1,4,0,3,0,9,0";

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

export async function GET(request: Request) {
  const date = getMaldivesTodayDDMMYYYY();
  // Allow an explicit ?tune= override (see the recalibration note above) so
  // a future check against Salat MV can pull the untuned raw times without
  // editing/redeploying this file first.
  const requestedTune = new URL(request.url).searchParams.get("tune");
  const tune = requestedTune ?? TUNE_MINUTES;
  const url = `https://api.aladhan.com/v1/timings/${date}?latitude=${LATITUDE}&longitude=${LONGITUDE}&method=${CALCULATION_METHOD}&tune=${encodeURIComponent(tune)}`;

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
