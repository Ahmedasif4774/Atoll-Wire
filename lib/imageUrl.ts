// Sanity serves every uploaded photo at its ORIGINAL size unless asked
// otherwise — a phone or camera photo is often 3–8 MB, which is why pages
// and Facebook link previews were slow to show pictures. Sanity's image CDN
// can resize on the fly just by adding options to the address, so these
// helpers add them. Anything that isn't a Sanity image address is returned
// untouched.
const SANITY_IMAGE = /^https:\/\/cdn\.sanity\.io\/images\//;

function withParams(url: string, params: Record<string, string | number>): string {
  if (!url || !SANITY_IMAGE.test(url)) return url;
  const base = url.split("?")[0];
  const query = Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return `${base}?${query}`;
}

// For photos shown on the site (cards, hero, in-article photos). `auto=format`
// lets Sanity send a modern, much smaller format to browsers that support it.
export function sizedImage(url: string, width = 1200): string {
  return withParams(url, { w: width, q: 75, auto: "format" });
}

// For the preview picture Facebook/WhatsApp/X show when a link is shared:
// the standard 1200×630 shape, always JPEG (the most widely supported).
export function socialImage(url: string): string {
  return withParams(url, { w: 1200, h: 630, fit: "crop", q: 80, fm: "jpg" });
}
