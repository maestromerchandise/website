/**
 * Runtime configuration, read once and validated at module load.
 *
 * Every value here is baked into the bundle at build time and is public by
 * design. Failing loudly on a missing or unedited placeholder catches a broken
 * deploy on first load instead of at the first Sanity or Supabase request.
 */
function required(name: string, value: string | undefined): string {
  // Vite only substitutes literal `import.meta.env.VITE_X` member access, so the
  // value has to be passed in rather than looked up from `name`.
  if (!value || value.startsWith('your_')) {
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env and fill it in.`)
  }
  return value
}

export const config = {
  sanityProjectId: required('VITE_SANITY_PROJECT_ID', import.meta.env.VITE_SANITY_PROJECT_ID),
  sanityDataset: required('VITE_SANITY_DATASET', import.meta.env.VITE_SANITY_DATASET),
  supabaseUrl: required('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: required('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY),
}
