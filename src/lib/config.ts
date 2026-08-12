/**
 * Runtime configuration, read once and validated at module load.
 *
 * Every value here is baked into the bundle at build time and is public by
 * design. Failing loudly on a missing or unedited placeholder catches a broken
 * deploy on first load instead of at the first Sanity request.
 */

// Vite only substitutes literal `import.meta.env.VITE_X` member access, so each
// value is read here rather than looked up from a name.
const raw = {
  sanityProjectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  sanityDataset: import.meta.env.VITE_SANITY_DATASET,
}

function isBlank(value: string | undefined): boolean {
  return !value || value.startsWith('your_')
}

/**
 * True when `npm run dev` is running without a .env.
 *
 * The site then renders from content/seed.json, so the design can be reviewed
 * before a Sanity project exists. A production build never takes this path:
 * `import.meta.env.DEV` is compiled to `false` and the branch is dropped.
 */
export const isPreview = import.meta.env.DEV && isBlank(raw.sanityProjectId)

function required(name: string, value: string | undefined): string {
  if (isBlank(value)) {
    if (isPreview) return ''
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env and fill it in.`)
  }
  return value as string
}

export const config = {
  sanityProjectId: required('VITE_SANITY_PROJECT_ID', raw.sanityProjectId),
  sanityDataset: required('VITE_SANITY_DATASET', raw.sanityDataset),
}
