import { getPopularArticles } from "./data";
import type { Lang } from "./types";

// The "Popular News" sidebar shown on every category page is the same
// site-wide list everywhere (not filtered per category) — that was an
// explicit product decision on the original site, not an oversight.
export function getPopularSidebarArticles(lang: Lang) {
  return getPopularArticles(lang);
}
