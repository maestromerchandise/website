/**
 * Load the copy transcribed from Web Maestro.pdf into Sanity.
 *
 * Run once when the dataset is empty:
 *   node --env-file=.env scripts/seed-content.mjs
 *
 * Uses `createIfNotExists`, so re-running never overwrites an edit made in
 * Studio. To reseed a document, delete it there first.
 *
 * With `--out <file>` it writes the documents as NDJSON instead of posting them,
 * for `sanity dataset import <file> --missing`. That route authenticates as the
 * logged-in CLI user and needs no write token, which is the shorter path when the
 * token in .env has expired.
 *
 * Plain fetch against the mutation API rather than @sanity/client, because this
 * is one POST and the script would otherwise be the only reason the website
 * package has a Sanity dependency at all.
 */
import { readFile, writeFile } from 'node:fs/promises'

const API_VERSION = '2024-01-01'

const projectId = process.env.VITE_SANITY_PROJECT_ID
const dataset = process.env.VITE_SANITY_DATASET ?? 'production'
const token = process.env.SANITY_WRITE_TOKEN

const outFlag = process.argv.indexOf('--out')
const outFile = outFlag === -1 ? null : process.argv[outFlag + 1]

// Writing a file needs no credentials; posting the mutation does.
if (!outFile && (!projectId || !token)) {
  console.error(
    'Set VITE_SANITY_PROJECT_ID and SANITY_WRITE_TOKEN, then run:\n' +
      '  node --env-file=.env scripts/seed-content.mjs\n' +
      '\nOr skip the token and go through the logged-in CLI instead:\n' +
      '  npm run seed:cli',
  )
  process.exit(1)
}

const seed = JSON.parse(await readFile(new URL('../content/seed.json', import.meta.url), 'utf8'))

/**
 * A category document id, referenced by every product in that category.
 *
 * A dash rather than a dot: the default grant that makes a public dataset
 * readable is `_id in path("*")`, which matches ids at the top level only. A
 * dotted id sits a level down, so anonymous readers, meaning the website, get
 * nothing back while an authenticated query still returns everything.
 */
const categoryDocId = (id) => `category-${id}`

const mutations = [
  // Singletons take a fixed id, which is what pins them in the Studio structure.
  {
    createIfNotExists: {
      _id: 'siteSettings',
      _type: 'siteSettings',
      ...withKeys(seed.settings),
    },
  },
  {
    createIfNotExists: {
      _id: 'homepage',
      _type: 'homepage',
      ...withKeys(seed.homepage),
    },
  },
  {
    createIfNotExists: {
      _id: 'aboutPage',
      _type: 'aboutPage',
      ...withKeys(seed.about),
    },
  },

  ...seed.categories.map((category) => ({
    createIfNotExists: {
      _id: categoryDocId(category.id),
      _type: 'productCategory',
      title: category.label,
      slug: { _type: 'slug', current: category.id },
      // Only written when it differs, so an ordinary category stays unset.
      ...(category.anchor !== category.id ? { anchorOverride: category.anchor } : {}),
      showInStrip: category.showInStrip !== false,
      order: category.order ?? 100,
    },
  })),

  ...seed.products.map(({ id, category, ...fields }) => ({
    createIfNotExists: {
      // A deterministic id keeps the seed idempotent and keeps the document
      // recognisable in Studio.
      _id: `product-${id}`,
      _type: 'product',
      slug: { _type: 'slug', current: id },
      category: { _type: 'reference', _ref: categoryDocId(category) },
      ...withKeys(fields),
    },
  })),
]

if (outFile) {
  // One document per line, which is the shape `sanity dataset import` reads.
  const documents = mutations.map((mutation) => JSON.stringify(mutation.createIfNotExists))
  await writeFile(outFile, documents.join('\n') + '\n')
  console.log(`Wrote ${documents.length} documents to ${outFile}.`)
  process.exit(0)
}

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

console.log(
  `Seeded 3 singletons, ${seed.categories.length} categories and ${seed.products.length} products.`,
)

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
