// The site's public base URL — used anywhere an absolute link is required
// (Open Graph tags for social link previews, and the article links the
// Facebook auto-post webhook builds). Centralized here rather than
// hardcoded in each caller so pointing the site at a custom domain later
// is a one-line change.
//
// Falls back to the current production Vercel URL. Set NEXT_PUBLIC_SITE_URL
// in Vercel's project settings if/when a custom domain is attached.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://atoll-wire.vercel.app").replace(/\/$/, "");
