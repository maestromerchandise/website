import { createStudioConfig } from './studio-config'

/**
 * Entry for the Sanity CLI: `sanity deploy`, `sanity cors add`, and the
 * standalone `npm run studio`. The Studio served at /studio by the website uses
 * the same definition through src/studio-main.tsx.
 */
export default createStudioConfig({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
})
