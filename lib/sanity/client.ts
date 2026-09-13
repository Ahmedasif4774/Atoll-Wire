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

export const sanityClient = createClient({
  projectId: projectId || "",
  dataset,
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
});

const builder = imageUrlBuilder(sanityClient);

export function urlForImage(source: Image) {
  return builder.image(source);
}
