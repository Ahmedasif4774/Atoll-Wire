/**
* This configuration file lets you run `$ sanity [command]` in this folder
* Go to https://www.sanity.io/docs/cli to learn more.
**/
import { defineCliConfig } from 'sanity/cli'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

// Pins the deploy target to the existing atollwire.sanity.studio hostname.
// Without this, `sanity deploy` always asks (interactively) whether to
// reuse an existing hostname or create a new one — harmless when you're
// sitting at a terminal to answer it, but in GitHub Actions there's no
// terminal to answer it, so the CLI just prints the question and exits
// without actually deploying anything (this is why earlier automated
// deploys "succeeded" in a couple of seconds without changing the live
// Studio at all). Setting studioHost answers that question ahead of time.
export default defineCliConfig({ api: { projectId, dataset }, studioHost: 'atollwire' })
