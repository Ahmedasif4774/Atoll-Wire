// Turns a YouTube or Vimeo link an editor pasted into an article body into
// an iframe-embeddable URL. Kept separate from lib/data.ts (rather than
// inlined there) because it's a plain synchronous string transform with no
// Sanity/network dependency, so both the (server-only) data layer and, if
// ever needed, a client component can import it without pulling in
// lib/data.ts's async Sanity-fetching functions.
//
// Returns null for anything not recognized as a YouTube/Vimeo URL, rather
// than throwing — callers should skip rendering a video block whose
// embedUrl comes back null instead of showing a broken iframe.
export function toVideoEmbedUrl(url: string | undefined | null): string | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === "youtube.com") {
    if (parsed.pathname === "/watch") {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.pathname.startsWith("/shorts/")) {
      const id = parsed.pathname.split("/")[2];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.pathname.startsWith("/embed/")) {
      // Already an embed URL — pass it through as-is.
      return url;
    }
    return null;
  }

  if (host === "vimeo.com") {
    const id = parsed.pathname.split("/").filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }

  return null;
}
