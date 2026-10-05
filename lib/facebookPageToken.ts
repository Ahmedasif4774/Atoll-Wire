// Helpers for talking to the AtollWire Facebook Page from server code.
//
// Values pasted into Vercel often pick up a stray space, line break or pair
// of quotes — any of which makes Facebook answer "Invalid OAuth access
// token" — so cleanEnv() tidies them up.
export function cleanEnv(value: string | undefined): string | undefined {
  const v = value?.trim().replace(/^["']+|["']+$/g, "").trim();
  return v || undefined;
}

export const GRAPH_VERSION = "v19.0";

// A system-user token (the never-expiring kind made in Meta Business
// Settings) normally has to be swapped for the Page's own access token before
// it can post to the Page. Asks Facebook for that Page token; if the swap
// isn't possible (e.g. the token already IS a Page token) the original token
// is returned unchanged, so this is always safe to call.
export async function getPageToken(pageId: string, token: string): Promise<string> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}?fields=access_token&access_token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return token;
    const body = await res.json();
    return typeof body?.access_token === "string" && body.access_token ? body.access_token : token;
  } catch {
    return token;
  }
}
