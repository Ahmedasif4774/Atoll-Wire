/**
 * This route is responsible for the built-in authoring environment using Sanity Studio.
 * All routes under your studio path is handled by this file using Next.js' catch-all routes:
 * https://nextjs.org/docs/routing/dynamic-routes#catch-all-routes
 *
 * You can learn more about the next-sanity package here:
 * https://github.com/sanity-io/next-sanity
 *
 * This file stays a plain Server Component (so it's allowed to export
 * `metadata`/`viewport`) and just renders StudioPageClient.tsx, which is
 * where the actual Studio — and the sanity.config.ts import — lives. See
 * that file for why the split is necessary.
 */

import StudioPageClient from "./StudioPageClient";

export const dynamic = "force-static";

export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  return <StudioPageClient />;
}
