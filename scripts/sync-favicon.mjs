/**
 * Write the favicon uploaded in Studio into the site as plain files.
 *
 *   node scripts/sync-favicon.mjs          into dist/, run by `npm run build`
 *   node scripts/sync-favicon.mjs public   refresh the defaults committed in public/
 *
 * The site also swaps the tab icon to the Studio favicon from JavaScript, but
 * only some browsers follow that. Safari, an iPhone, apps that open links in their
 * own browser, and search engines read the icon the HTML names and nothing else.
 * Copying the Studio favicon into those files is what makes them show it too,
 * from the next build on.
 *
 * Anything that stops it, no project configured or Sanity out of reach, keeps the
 * committed defaults and never fails the build. Nothing printed names the project.
 */
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const OUT = process.argv[2] ?? 'dist'

/** The files the HTML entry points link to, and the size each is written at. */
const FILES = [
  ['favicon-32.png', 32],
  ['favicon-192.png', 192],
  ['apple-touch-icon.png', 180],
]

/**
 * Tries before giving up. A connection that times out once often succeeds on
 * the next try, and a build that silently kept an old favicon is hard to notice.
 */
const ATTEMPTS = 3

// Vite reads .env for its own bundle only, so this separate process loads it.
if (!process.env.VITE_SANITY_PROJECT_ID && existsSync('.env')) process.loadEnvFile('.env')
const projectId = process.env.VITE_SANITY_PROJECT_ID
const dataset = process.env.VITE_SANITY_DATASET ?? 'production'

async function sync() {
  const query = encodeURIComponent('*[_type == "siteSettings"][0].favicon.asset->url')
  const response = await fetch(
    `https://${projectId}.apicdn.sanity.io/v2024-01-01/data/query/${dataset}?query=${query}`,
  )
  if (!response.ok) throw new Error(`Sanity answered ${response.status}`)
  const { result: source } = await response.json()
  if (!source) return 'no favicon is set in Studio'

  // Every size is downloaded before any is written, so a failure part way never
  // leaves the tab icon and the home screen icon showing different images.
  const images = []
  for (const [file, size] of FILES) {
    const image = await fetch(`${source}?w=${size}&h=${size}&fit=max&fm=png`)
    if (!image.ok) throw new Error(`the favicon download answered ${image.status}`)
    images.push([file, Buffer.from(await image.arrayBuffer())])
  }
  for (const [file, bytes] of images) writeFileSync(join(OUT, file), bytes)
  return null
}

if (!projectId || projectId.startsWith('your_')) {
  console.log(`Kept the default favicon in ${OUT}/: no Sanity project is configured`)
} else {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const skipped = await sync()
      console.log(
        skipped
          ? `Kept the default favicon in ${OUT}/: ${skipped}`
          : `Wrote the Studio favicon to ${OUT}/ at ${FILES.map(([, size]) => `${size}px`).join(', ')}`,
      )
      break
    } catch (error) {
      if (attempt < ATTEMPTS) continue
      // Only the network error code is added, never its message, which names the
      // host and with it the project.
      const code = error.cause?.code ? ` (${error.cause.code})` : ''
      console.log(`Kept the default favicon in ${OUT}/ after ${ATTEMPTS} tries: ${error.message}${code}`)
    }
  }
}
