/**
 * Put one image on every product, for checking the card and panel layout
 * before the real photography exists.
 *
 *   node --env-file=.env scripts/set-test-image.mjs public/maestro-image-test.png
 *   node --env-file=.env scripts/set-test-image.mjs --clear
 *
 * The file is uploaded once and every product then references that one asset,
 * which is how Sanity is meant to be used: uploading per product would leave 22
 * copies of the same bytes in the dataset and 22 assets to clean up afterwards.
 *
 * `--clear` unsets the field again, because a test image you cannot remove in
 * one step is one you end up shipping.
 *
 * Plain fetch rather than @sanity/client, matching scripts/seed-content.mjs.
 */
import { readFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'

const API_VERSION = '2024-01-01'

const projectId = process.env.VITE_SANITY_PROJECT_ID
const dataset = process.env.VITE_SANITY_DATASET ?? 'production'
const token = process.env.SANITY_WRITE_TOKEN

if (!projectId || projectId.startsWith('your_') || !token) {
  console.error(
    'Set VITE_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN in .env first.\n' +
      'The project id is the one shown in your Sanity project settings.',
  )
  process.exit(1)
}

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }

const clear = process.argv.includes('--clear')
const file = process.argv.slice(2).find((arg) => !arg.startsWith('--'))

if (!clear && !file) {
  console.error('Pass an image path, or --clear to remove the test image again.')
  process.exit(1)
}

/** Every product in the dataset, not just the seeded ones. */
const query = encodeURIComponent('*[_type == "product"]{_id}')
const read = await fetch(
  `https://${projectId}.apicdn.sanity.io/v${API_VERSION}/data/query/${dataset}?query=${query}`,
)
if (!read.ok) {
  console.error(`Could not read products: ${read.status} ${await read.text()}`)
  process.exit(1)
}
const products = (await read.json()).result ?? []

if (products.length === 0) {
  console.error('No product documents found. Run scripts/seed-content.mjs first.')
  process.exit(1)
}

let set
if (clear) {
  set = null
} else {
  const extension = extname(file).toLowerCase()
  const contentType = MIME[extension]
  if (!contentType) {
    console.error(`Unsupported image type ${extension}. Use png, jpg or webp.`)
    process.exit(1)
  }

  const upload = await fetch(
    `https://${projectId}.api.sanity.io/v${API_VERSION}/assets/images/${dataset}` +
      `?filename=${encodeURIComponent(basename(file))}`,
    {
      method: 'POST',
      headers: { 'Content-Type': contentType, Authorization: `Bearer ${token}` },
      body: await readFile(file),
    },
  )
  if (!upload.ok) {
    console.error(`Upload failed: ${upload.status} ${await upload.text()}`)
    process.exit(1)
  }

  const assetId = (await upload.json()).document._id
  console.log(`Uploaded ${basename(file)} as ${assetId}`)
  set = { _type: 'image', asset: { _type: 'reference', _ref: assetId } }
}

// One request for every product, so the dataset is never half updated.
const mutations = products.map(({ _id }) => ({
  patch: clear ? { id: _id, unset: ['image'] } : { id: _id, set: { image: set } },
}))

const response = await fetch(
  `https://${projectId}.api.sanity.io/v${API_VERSION}/data/mutate/${dataset}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ mutations }),
  },
)

if (!response.ok) {
  console.error(`Mutation failed: ${response.status} ${await response.text()}`)
  process.exit(1)
}

console.log(
  clear
    ? `Cleared the main image on ${products.length} products.`
    : `Set the main image on ${products.length} products.`,
)
