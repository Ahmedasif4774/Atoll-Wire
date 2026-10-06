// Works out the three top-of-homepage stories (the big main story and the
// two editor's-choice cards) for one language site. Editors choose them in
// Sanity ("Homepage — top stories"); anything not chosen, or not available
// on this language's site, falls back to the built-in defaults from
// homeConfig.*.ts so a slot is never empty.
import type { Article } from "./types";

export interface HomePicks {
  hero?: string; // slug
  pick1?: string;
  pick2?: string;
}

export function resolveTopStories(
  bySlug: Map<string, Article>,
  picks: HomePicks,
  cfg: { heroSlug: string; editorPairSlugs: string[] },
): { hero: Article; editorPair: Article[] } {
  const get = (slug?: string) => (slug ? bySlug.get(slug) : undefined);

  const hero = get(picks.hero) ?? get(cfg.heroSlug);
  if (!hero) throw new Error(`Home page has no main story: default "${cfg.heroSlug}" is missing`);

  const slots = cfg.editorPairSlugs.length;
  const editorPair: Article[] = [];
  const add = (a?: Article) => {
    if (a && a !== hero && !editorPair.includes(a) && editorPair.length < slots) editorPair.push(a);
  };
  add(get(picks.pick1));
  add(get(picks.pick2));
  // Fill any remaining slot from the defaults.
  for (const slug of cfg.editorPairSlugs) add(get(slug));
  return { hero, editorPair };
}
