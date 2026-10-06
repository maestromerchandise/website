/**
 * Write the favicon uploaded in Studio into the site as plain files.
 *
 *   node scripts/sync-favicon.mjs          into dist/, run by `npm run build`
 *   node scripts/sync-favicon.mjs public   refresh the defaults committed in public/
 *
 * The icon the HTML names is the only one Safari, an iPhone, an app that opens
 * links in its own browser, or a search engine ever reads, so the Studio favicon
 * is copied into those files at build time. The site does not swap the icon from
 * JavaScript: these files are the one source of it.
 *
 * Anything that stops it, no project configured or Sanity out of reach, keeps the
 * committed defaults and never fails the build. Nothing printed names the project.
 */
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const OUT = process.argv[2] ?? 'dist'

/**
 * The files the HTML entry points link to.
 *
 * The two tab icons are cut to a circle; a square upload otherwise sits in the
 * tab as a white tile. The home screen icon is left square on purpose: iOS puts
 * its own rounded mask over it and fills transparency with black, so a circle cut
 * here would come back as a black-cornered square on the home screen.
 */
const FILES = [
  ['favicon-32.png', 32, 'circle'],
  ['favicon-192.png', 192, 'circle'],
  ['apple-touch-icon.png', 180, 'square'],
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

/** Keep what falls inside the inscribed circle and make the corners transparent. */
async function circle(bytes, size) {
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  )
  return sharp(bytes)
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()
}

async function sync() {
  const query = encodeURIComponent('*[_type == "siteSettings"][0].favicon.asset->url')
  const response = await fetch(
    `https://${projectId}.apicdn.sanity.io/v2024-01-01/data/query/${dataset}?query=${query}`,
  )
  if (!response.ok) throw new Error(`Sanity answered ${response.status}`)
  const { result: source } = await response.json()
  if (!source) return 'no favicon is set in Studio'

  // Every size is downloaded and cut before any is written, so a failure part way
  // never leaves the tab icon and the home screen icon showing different images.
  const images = []
  for (const [file, size, shape] of FILES) {
    const image = await fetch(`${source}?w=${size}&h=${size}&fit=max&fm=png`)
    if (!image.ok) throw new Error(`the favicon download answered ${image.status}`)
    const bytes = Buffer.from(await image.arrayBuffer())
    images.push([file, shape === 'circle' ? await circle(bytes, size) : bytes])
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
