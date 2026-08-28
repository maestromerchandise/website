import { defineCliConfig } from 'sanity/cli'

/**
 * Configuration for the `sanity` command line tool, which is a separate file
 * from sanity.config.ts: that one describes the Studio, this one tells the CLI
 * which project to talk to for `cors`, `deploy`, `dataset` and the rest.
 *
 * At the repository root rather than in studio/, so the commands work from the
 * directory the rest of the project is run from.
 *
 * The ids are read from the environment rather than written here, so the one
 * place they are configured stays the .env file. Either name works: the website
 * uses the VITE_ prefixed pair, the Studio the SANITY_STUDIO_ pair, and the CLI
 * accepts whichever is present.
 */
export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? process.env.VITE_SANITY_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET ?? process.env.VITE_SANITY_DATASET ?? 'production',
  },
})
