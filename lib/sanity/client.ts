import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import type { Image } from "sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

if (!projectId) {
  // Thrown only when something actually tries to use the client (the mock
  // data layer in lib/data.ts doesn't import this file at all yet), so it's
  // safe for this file to exist before you've set up a Sanity project.
  console.warn(
    "NEXT_PUBLIC_SANITY_PROJECT_ID is not set — lib/sanity/client.ts will fail if used. See .env.example."
  );
}

// The "production" dataset turned out to be set to Private read access
// (confirmed by testing directly: an anonymous request only ever sees
// image asset documents, never the article/category/author documents —
// which is exactly what Sanity does for a private dataset, since asset
// files are always served publicly through the CDN regardless of the
// dataset's own visibility setting). Sanity Studio/Vision could always see
// everything because that tool uses your logged-in session, which has
// full access regardless of the dataset's public/private setting.
//
// Rather than flipping the dataset to Public (which would let anyone on
// the internet read every article and appeal — including ones not yet
// approved — directly through Sanity's API, bypassing the approval
// workflow entirely), the fix is to have the server authenticate every
// read with the same API token used for the migration script. This token
// lives only in SANITY_API_TOKEN (no NEXT_PUBLIC_ prefix), so Next.js
// never sends it to the browser — it's only ever used here, server-side.
//
// useCdn is turned off unconditionally: Sanity's CDN (apicdn.sanity.io)
// doesn't honor the Authorization header the same way the regular API
// does, so mixing a token with useCdn:true can silently serve stale or
// empty results on a private dataset. This site is small enough that the
// CDN's speed benefit isn't worth that risk.
export const sanityClient = createClient({
  projectId: projectId || "",
  dataset,
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const builder = imageUrlBuilder(sanityClient);

export function urlForImage(source: Image) {
  return builder.image(source);
}
