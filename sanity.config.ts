// Sanity Studio config (Phase 1). Run `npx sanity dev` (after `npm install`)
// to open the Studio locally at localhost:3333, or `npx sanity deploy` to
// host it at <project>.sanity.studio.
//
// You'll need a free Sanity project first: run `npx sanity init` in this
// folder, which will create the project and fill in the ids below (or set
// them directly in .env.local — see .env.example).
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./lib/sanity/schemaTypes";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "your-project-id";
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
