// Sanity Studio config. The Studio is hosted standalone by Sanity itself at
// https://atollwire.sanity.studio (via `npx sanity deploy`) rather than
// embedded in the Next.js app — the embedded app/studio/[[...tool]] route
// hit an unresolved production bug, so this standalone deployment is the
// one actually in use.
//
// projectId/dataset fall back to hardcoded values rather than relying
// purely on NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET
// being set in the environment: `sanity deploy`'s own build step doesn't
// read Next.js's .env.local the way `next build` does, so those env vars
// are typically undefined during a Studio deploy — without a real
// fallback here, the deployed Studio silently bakes in the literal
// placeholder string "your-project-id" and every login then fails with
// "You are not a member of this project or the project does not exist"
// (that placeholder isn't a real project). Neither value below is a
// secret — both are public identifiers already visible in this project's
// URLs — so hardcoding them is safe.
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./lib/sanity/schemaTypes";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "tinn4qy2";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export default defineConfig({
  name: "atollwire",
  title: "AtollWire",
  projectId,
  dataset,
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
});
