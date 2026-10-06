import { NextResponse } from "next/server";
import { backfillArticleNumbers } from "@/lib/articleNumbers";
import { sanityClient } from "@/lib/sanity/client";

// One-time catch-up: gives every article that existed before numeric links
// a permanent number (oldest story = lowest number). Open
// /api/article-numbers in a browser to run it.
//
// Safe to open as many times as you like — articles that already have a
// number are never touched, so a second visit just reports "assigned: 0".
// New articles don't need this: they are numbered automatically when saved
// in Sanity (see app/api/webhooks/sanity-publish/route.ts).
//
// Shows only counts and article ids — never tokens or secrets.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { assigned, remaining } = await backfillArticleNumbers();
    const total: number = await sanityClient.fetch(
      `count(*[_type == "articleNumber"])`,
      {},
      { cache: "no-store" },
    );
    return NextResponse.json({
      assignedNow: assigned.length,
      stillWaiting: remaining,
      totalNumberedArticles: total,
      note:
        remaining > 0
          ? "More articles are waiting — open this page again to number the next batch."
          : "All articles are numbered.",
      sample: assigned.slice(0, 5),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const looksLikePermission = /permission|insufficient|unauthori[sz]ed|forbidden|403|401/i.test(message);
    return NextResponse.json(
      {
        error: "Could not assign numbers",
        likelyCause: looksLikePermission
          ? "The SANITY_API_TOKEN saved in Vercel can only read. It needs Editor access so it can save article numbers."
          : "See details.",
        details: message.slice(0, 300),
      },
      { status: 500 },
    );
  }
}
