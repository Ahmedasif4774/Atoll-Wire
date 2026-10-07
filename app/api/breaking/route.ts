// Feeds the red "Breaking news" bar at the top of the site
// (components/shared/BreakingBar.tsx). An editor ticks "Breaking news" on an
// article in Studio; this returns the newest such article for the requested
// language, but only for BREAKING_HOURS after it was last published, so a
// forgotten tick can't leave a stale alert on the site.
import { NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity/client";
import { breakingNewsQuery } from "@/lib/sanity/queries";
import { numbersFor, publishedId } from "@/lib/articleNumbers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BREAKING_HOURS = 6;

interface Row {
  id: string;
  slug?: string;
  title?: string;
  updatedAt?: string;
}

export async function GET(request: Request) {
  const lang = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "dv";
  const none = NextResponse.json({ breaking: null }, { headers: { "Cache-Control": "no-store" } });
  try {
    const rows: Row[] = await sanityClient.fetch(breakingNewsQuery, { lang }, { cache: "no-store" });
    const cutoff = Date.now() - BREAKING_HOURS * 60 * 60 * 1000;
    const top = (rows ?? []).find(
      (r) => r.title && r.slug && r.updatedAt && new Date(r.updatedAt).getTime() > cutoff,
    );
    if (!top) return none;

    // Prefer the permanent numeric link (e.g. /article/10042), like the rest of the site.
    let ref = top.slug as string;
    try {
      const numbers = await numbersFor([top.id]);
      const n = numbers.get(publishedId(top.id));
      if (typeof n === "number") ref = String(n);
    } catch {
      // keep the slug
    }
    const href = lang === "en" ? `/en/article/${ref}` : `/article/${ref}`;
    return NextResponse.json(
      { breaking: { title: top.title, href, updatedAt: top.updatedAt } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[breaking news] could not read breaking news:", err);
    return none;
  }
}
