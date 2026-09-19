"use client";

/**
 * The actual Studio rendering has to live in its own Client Component file,
 * separate from page.tsx. sanity.config.ts's config object bundles in
 * functions (default document actions/badges/inspectors from the Sanity
 * plugins), and Next.js's App Router can't send functions from a Server
 * Component across to a Client Component as a prop — it tries to and throws
 * "Functions cannot be passed directly to Client Components". Importing
 * config here instead, inside a file that is itself a Client Component,
 * means it's built directly in the browser bundle and never needs to cross
 * that boundary.
 */

import { NextStudio } from "next-sanity/studio";
import config from "../../../sanity.config";

export default function StudioPageClient() {
  return <NextStudio config={config} />;
}
