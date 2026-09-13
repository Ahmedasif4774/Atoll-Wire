import { NextRequest, NextResponse } from "next/server";

// Real live-presence tracking for the "N reading now" badge.
//
// Each open browser tab sends a heartbeat here every few seconds saying
// "I'm still here". We keep a simple in-memory map of sessionId -> last
// time we heard from it, and report back how many sessions are still
// within the active window. That's it — no database, no third-party
// analytics service, just an honest count of tabs currently open on the
// site.
//
// IMPORTANT CAVEAT if this ever gets deployed: this in-memory Map lives
// inside a single Node.js process. That's exactly right for `next start`
// on a normal always-on server (a VPS, Docker container, Render/Railway/etc),
// where one process serves everyone. It will UNDER-count on a serverless
// host that runs multiple isolated instances of your app at once (e.g.
// Vercel's default deployment model) — each instance would keep its own
// separate map, so a visitor could be "seen" by one instance and missed by
// another. For a small/personal site this is usually fine in practice
// (traffic is low enough to land on one warm instance), but if you need
// guaranteed accuracy at scale on serverless, swap this Map for a shared
// store (e.g. Upstash Redis) behind the same get/set calls below.
const sessions = new Map<string, number>();

// A tab counts as "still reading" if we heard from it in the last 25s.
// The client hearts-beats every 10s, so this tolerates a missed beat or
// two (e.g. a background tab getting throttled by the browser) before we
// drop it from the count.
const ACTIVE_WINDOW_MS = 25_000;

function activeCount(): number {
  const cutoff = Date.now() - ACTIVE_WINDOW_MS;
  for (const [id, lastSeen] of sessions) {
    if (lastSeen < cutoff) sessions.delete(id);
  }
  return sessions.size;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const sessionId = body?.sessionId;
  const leaving = body?.leaving === true;

  if (typeof sessionId === "string" && sessionId.length > 0) {
    if (leaving) {
      sessions.delete(sessionId);
    } else {
      sessions.set(sessionId, Date.now());
    }
  }

  return NextResponse.json({ count: activeCount() });
}

export async function GET() {
  return NextResponse.json({ count: activeCount() });
}
