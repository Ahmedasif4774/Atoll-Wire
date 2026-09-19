// Live Gregorian + Hijri date helpers, shared by the English and Dhivehi
// Header/PrayerWidget components. Both language versions used to show a
// date that was hard-coded at the time the site was built (see the git
// history for components/{en,dv}/Header.tsx and PrayerWidget.tsx) — this
// file replaces that with a value computed from the real clock every time
// it's called, so the displayed date actually advances day to day.

// Elsewhere in the app (PrayerWidget's prayer-time countdown) the site
// simulates a fixed Maldives time (UTC+5, no DST) so every visitor sees the
// same local time regardless of their own timezone. Reuse that same trick
// here so the date rolls over at Maldives midnight for everyone, not at
// each visitor's own midnight.
export function getMaldivesNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + 5 * 60 * 60000);
}

// Tabular ("Kuwaiti algorithm") Gregorian -> Hijri conversion: pure
// arithmetic, no external dependency or network call. It's accurate to
// within about a day of the real moon-sighting-based calendar, which is
// fine for a decorative date display (the same margin the site's original
// hard-coded placeholder date carried).
export function gregorianToHijri(gy: number, gm: number, gd: number) {
  const jd =
    Math.floor((1461 * (gy + 4800 + Math.floor((gm - 14) / 12))) / 4) +
    Math.floor((367 * (gm - 2 - 12 * Math.floor((gm - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((gy + 4900 + Math.floor((gm - 14) / 12)) / 100)) / 4) +
    gd -
    32075;
  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l =
    l -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const hm = Math.floor((24 * l) / 709);
  const hd = l - Math.floor((709 * hm) / 24);
  const hy = 30 * n + j - 30;
  return { year: hy, month: hm, day: hd }; // month is 1-12
}

const EN_WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];
const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const EN_HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
  "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah",
];

// Same spellings the site's original hard-coded placeholder date used.
const DV_WEEKDAYS = [
  "އާދިއްތަ", "ހޯމަ", "އަންގާރަ", "ބުދަ", "ބުރާސްފަތި", "ހުކުރު", "ހޮނިހިރު",
];
const DV_MONTHS = [
  "ޖެނުއަރީ", "ފެބްރުއަރީ", "މާރިޗު", "އޭޕްރީލް", "މޭ", "ޖޫން",
  "ޖުލައި", "އޮގަސްޓް", "ސެޕްޓެމްބަރު", "އޮކްޓޯބަރު", "ނޮވެމްބަރު", "ޑިސެމްބަރު",
];
const DV_HIJRI_MONTHS = [
  "މުޙައްރަމް", "ޞަފަރު", "ރަބީޢުލްއައްވަލް", "ރަބީޢުލްއާޚިރު",
  "ޖުމާދަލްއޫލާ", "ޖުމާދަލްއާޚިރާ", "ރަޖަބު", "ޝަޢުބާން",
  "ރަމަޟާން", "ޝައްވާލް", "ޛުލްޤައިދާ", "ޛުލްޙައްޖާ",
];

export interface LiveDates {
  /** Full date shown in the site header, e.g. "Monday, September 7, 2026". */
  headerDate: string;
  /** Short Gregorian date shown on the homepage weather/prayer card. */
  gregDate: string;
  /** Hijri date shown on the same card. */
  hijriDate: string;
}

export function getLiveDates(lang: "en" | "dv"): LiveDates {
  const now = getMaldivesNow();
  const gy = now.getUTCFullYear();
  const gm = now.getUTCMonth() + 1;
  const gd = now.getUTCDate();
  const weekday = now.getUTCDay();
  const hijri = gregorianToHijri(gy, gm, gd);

  if (lang === "en") {
    return {
      headerDate: `${EN_WEEKDAYS[weekday]}, ${EN_MONTHS[gm - 1]} ${gd}, ${gy}`,
      gregDate: `${gd} ${EN_MONTHS[gm - 1]} ${gy}`,
      hijriDate: `${hijri.day} ${EN_HIJRI_MONTHS[hijri.month - 1]} ${hijri.year} AH`,
    };
  }

  return {
    headerDate: `${DV_WEEKDAYS[weekday]}، ${gd} ${DV_MONTHS[gm - 1]} ${gy}`,
    gregDate: `${gd} ${DV_MONTHS[gm - 1]} ${gy}`,
    hijriDate: `${hijri.day} ${DV_HIJRI_MONTHS[hijri.month - 1]} ${hijri.year}ހ`,
  };
}
