import { NextRequest, NextResponse } from "next/server";
import { searchArticles } from "@/lib/data";
import type { Lang } from "@/lib/types";

// Small API route backing the header's live search dropdown
// (components/*/Header.tsx). The header is a Client Component, and
// searchArticles() now has to fetch from Sanity (async, server-only), so
// the header can't call it directly anymore — it calls this route instead.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lang: Lang = searchParams.get("lang") === "dv" ? "dv" : "en";
  const q = searchParams.get("q") ?? "";

  const results = await searchArticles(lang, q, 6);
  return NextResponse.json({ results });
}
