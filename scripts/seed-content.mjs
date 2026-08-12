/**
 * Load the copy transcribed from Web Maestro.pdf into Sanity.
 *
 * Run once when the dataset is empty:
 *   node --env-file=.env scripts/seed-content.mjs
 *
 * Uses `createIfNotExists`, so re-running never overwrites an edit made in
 * Studio. To reseed a document, delete it there first.
 *
 * Plain fetch against the mutation API rather than @sanity/client, because this
 * is one POST and the script would otherwise be the only reason the repository
 * has a Sanity dependency at all.
 */
import { readFile } from 'node:fs/promises'

const API_VERSION = '2024-01-01'

const projectId = process.env.VITE_SANITY_PROJECT_ID
const dataset = process.env.VITE_SANITY_DATASET ?? 'production'
const token = process.env.SANITY_WRITE_TOKEN

if (!projectId || !token) {
  console.error(
    'Set VITE_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN, then run:\n' +
      '  node --env-file=.env scripts/seed-content.mjs',
  )
  process.exit(1)
}

const seed = JSON.parse(await readFile(new URL('../content/seed.json', import.meta.url), 'utf8'))

const mutations = [
  {
    createIfNotExists: {
      _id: 'homepage',
      _type: 'homepage',
      ...withKeys(seed.homepage),
    },
  },
  ...seed.products.map(({ id, ...fields }) => ({
    createIfNotExists: {
      // A deterministic id keeps the seed idempotent and keeps the document
      // recognisable in Studio.
      _id: `product.${id}`,
      _type: 'product',
      ...withKeys(fields),
    },
  })),
]

const response = await fetch(
  `https://${projectId}.api.sanity.io/v${API_VERSION}/data/mutate/${dataset}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ mutations }),
  },
)

if (!response.ok) {
  console.error(`Seed failed (${response.status}): ${await response.text()}`)
  process.exit(1)
}

console.log(`Seeded 1 site content document and ${seed.products.length} products.`)

/**
 * Sanity requires a _key on every object inside an array, or Studio cannot
 * track which item moved during a drag. Strings and plain values are untouched.
 */
function withKeys(value) {
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      item !== null && typeof item === 'object'
        ? { _key: `k${index}`, ...withKeys(item) }
        : withKeys(item),
    )
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, withKeys(item)]))
  }
  return value
}
