// Works out the three top-of-homepage stories (the big main story and the
// two editor's-choice cards) for one language site.
//
// Editors tick "Main story", "Editor's choice 1" or "Editor's choice 2" on an
// article in Sanity. `all` is that language's approved articles newest-first,
// so for each slot the NEWEST ticked article wins — publishing tomorrow's
// story with the box ticked automatically replaces today's, and nobody needs
// to untick the old one. A slot with nothing ticked (or whose ticked story
// isn't available on this language's site) falls back to the built-in
// defaults from homeConfig.*.ts, so a slot is never empty.
import type { Article } from "./types";

export function resolveTopStories(
  all: Article[],
  bySlug: Map<string, Article>,
  cfg: { heroSlug: string; editorPairSlugs: string[] },
): { hero: Article; editorPair: Article[] } {
  const used = new Set<Article>();
  const newestWith = (flag: "homeMain" | "homeEditor1" | "homeEditor2") =>
    all.find((a) => a[flag] && !used.has(a));

  const hero = newestWith("homeMain") ?? bySlug.get(cfg.heroSlug);
  if (!hero) throw new Error(`Home page has no main story: default "${cfg.heroSlug}" is missing`);
  used.add(hero);

  // One entry per editor's-choice slot, in order.
  const slots = cfg.editorPairSlugs.length;
  const chosen: (Article | undefined)[] = [];
  const flags = ["homeEditor1", "homeEditor2"] as const;
  for (let i = 0; i < slots; i++) {
    const a = i < flags.length ? newestWith(flags[i]) : undefined;
    if (a) used.add(a);
    chosen.push(a);
  }

  // Fill any slot nobody ticked from the defaults.
  const defaults = cfg.editorPairSlugs.map((s) => bySlug.get(s)).filter((a): a is Article => !!a);
  const editorPair = chosen.map((a) => {
    if (a) return a;
    const d = defaults.find((x) => !used.has(x));
    if (d) used.add(d);
    return d;
  });
  return { hero, editorPair: editorPair.filter((a): a is Article => !!a) };
}
