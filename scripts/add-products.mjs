/**
 * Add the catalogue's product list to Sanity without touching what is already
 * there.
 *
 *   npx sanity exec scripts/add-products.mjs --with-user-token            report only
 *   APPLY=1 npx sanity exec scripts/add-products.mjs --with-user-token    write
 *
 * A listed product that does not exist yet is created with placeholder copy and
 * no image. One that already exists keeps every field it has; only an empty
 * tagline, description, features or specifications is filled in. Nothing is
 * deleted and the dataset is never reset.
 *
 * Without --with-user-token the report still runs, reading anonymously, but it
 * sees published documents only. A product saved in Studio and not yet published
 * is a draft, and would be reported as missing and then created a second time,
 * so always read the logged-in report before applying.
 */
import { getCliClient } from 'sanity/cli'

/** The list as the client sent it, in the order it should appear per category. */
const LIST = {
  sports: [
    'Golf Bag',
    'Foldable Hard Shell Golf Travel Cover',
    'Golf Glove',
    'Golf Ball Pouch',
    'Padel Racket',
    'Padel Cover',
    'Padel Bag',
    'Tennis Tote Bag',
    'Cap',
    'Yoga Mat',
    'Portable Massage Gun',
    'Portable Cooling Fan',
    'Utility Pouch',
    'Duffel Bag',
    'Bag Charm',
  ],
  automotive: ['Vacuum Cleaner Portable'],
  'apparel-wearables': ['Track Jacket', 'Shirt', 'T-Shirt', 'Hoodie'],
  'home-living': [
    'Clock',
    'Coaster',
    'Crystal',
    'Crystal Vase',
    'Decanter',
    'Diffuser',
    'Electri Umbrella',
    'Folded Umbrella',
    'Golf Umbrella',
    'Keycar Cover',
    'Keychain',
    'Keycar Wallet',
    'Matcha Set',
    'Pillow',
    'Reed Diffuser',
    'Teapot Set',
    'Teapot Set 2',
    'Towel',
    'Umbrella',
  ],
  office: [
    'Agenda',
    'Bag',
    'Ballpoint',
    'Card Wallet',
    'Desklamp',
    'Stationery Case',
    'Urban Tote Bag',
    'Wallet',
  ],
  'smart-tech': [
    'Hairdryer',
    'Cross Body Bag',
    'Sling Bag',
    'Head Massager',
    'Mahjong Set',
    'Makeup Brush Magnet',
    'PB Magsafe',
    'Sling Bag',
    'Smart BT Speaker',
    'Smart Cooker',
    'Snowglobe',
  ],
}

/** Stand-in copy, replaced in Studio once the real text arrives. */
const PLACEHOLDER = {
  tagline: 'Lorem ipsum dolor sit amet sed do.',
  description:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  features: Array(4).fill('Lorem ipsum dolor sit amet, consectetur adipiscing elit.'),
  specifications: Array(4).fill('Lorem ipsum dolor sit amet.'),
}

const apply = process.env.APPLY === '1'
const client = getCliClient({ apiVersion: '2024-01-01' })

/**
 * Titles compare case and punctuation blind, and the slug is built the same way.
 * A misspelling already saved in Studio is mapped to the listed spelling, so the
 * product it names is filled in rather than added a second time.
 */
const key = (title) =>
  title
    .toLowerCase()
    .replaceAll('portale', 'portable')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
const isEmpty = (value) =>
  value == null || (typeof value === 'string' ? value.trim() === '' : value.length === 0)
const isDraft = (id) => id.startsWith('drafts.')
const baseId = (id) => id.replace(/^drafts\./, '')

const [categories, products] = await Promise.all([
  client.fetch(`*[_type=="productCategory" && !(_id in path("drafts.**"))]{_id,"slug":slug.current}`),
  // Drafts included, which only a logged-in read returns, so a product still
  // being written in Studio counts as existing rather than being added again.
  client.fetch(
    `*[_type=="product"]{_id,_rev,title,order,tagline,description,features,specifications,"slug":slug.current,"cat":category->slug.current}`,
  ),
])

const categoryIds = new Map(categories.map((category) => [category.slug, category._id]))
const takenIds = new Set(products.map((product) => baseId(product._id)))
const takenSlugs = new Set(products.map((product) => product.slug))

const creates = []
const fills = []
const complete = []
const notes = []

for (const [category, titles] of Object.entries(LIST)) {
  const categoryId = categoryIds.get(category)
  if (!categoryId) {
    notes.push(`${category}: no such category in the dataset, its ${titles.length} products were left out`)
    continue
  }

  // New products follow the ones already there, in the order they were listed.
  let order = Math.max(
    0,
    ...products.filter((product) => product.cat === category).map((product) => product.order ?? 0),
  )
  const seen = new Set()

  for (const title of titles) {
    const name = key(title)
    if (seen.has(name)) {
      notes.push(`${category}: "${title}" is listed twice, added once`)
      continue
    }
    seen.add(name)

    // A product whose category does not resolve, such as one pointing at a
    // category still in draft, is matched on its title alone. It is the same
    // product, and its category is someone's work in progress, so it is left be.
    //
    // The published document and its draft are filled separately, each only
    // where that version is empty, so the editor sees the same copy the site does.
    const existing = products.filter(
      (product) => (product.cat === category || product.cat == null) && key(product.title) === name,
    )
    if (existing.length > 0) {
      for (const product of existing) {
        if (product.cat == null) {
          notes.push(`${category}: "${product.title}" exists with a category that does not resolve, category left as it is`)
        }
        const missing = missingOf(product)
        if (Object.keys(missing).length > 0) fills.push({ product, category, missing })
        else complete.push({ product, category })
      }
      continue
    }

    const slug = name.replaceAll(' ', '-')
    const id = `product-${slug}`
    if (takenIds.has(id) || takenSlugs.has(slug)) {
      const owner = products.find((product) => baseId(product._id) === id || product.slug === slug)
      notes.push(`${category}: "${title}" not created, its slug belongs to "${owner.title}" in ${owner.cat}`)
      continue
    }
    takenIds.add(id)
    takenSlugs.add(slug)

    order += 10
    creates.push({
      category,
      document: {
        _id: id,
        _type: 'product',
        title,
        slug: { _type: 'slug', current: slug },
        category: { _type: 'reference', _ref: categoryId },
        ...PLACEHOLDER,
        readyMade: false,
        order,
      },
    })
  }
}

/**
 * Categories filled as a whole rather than from a list: every product already in
 * them, published or draft, gets the placeholder wherever it is empty. Nothing
 * is created in them.
 */
const WHOLE_CATEGORIES = ['travel-essentials']

for (const product of products.filter((candidate) => WHOLE_CATEGORIES.includes(candidate.cat))) {
  const missing = missingOf(product)
  if (Object.keys(missing).length > 0) fills.push({ product, category: product.cat, missing })
  else complete.push({ product, category: product.cat })
}

/** The placeholder fields this version of a product has left empty. */
function missingOf(product) {
  return Object.fromEntries(Object.entries(PLACEHOLDER).filter(([field]) => isEmpty(product[field])))
}

const label = (product) => `${product.title}${isDraft(product._id) ? ' [draft]' : ''}`

console.log(`${creates.length} to create, ${fills.length} to fill in, ${complete.length} already complete.\n`)
for (const { category, document } of creates) console.log(`  + ${category.padEnd(18)} ${document.title}`)
for (const { product, category, missing } of fills) {
  console.log(`  ~ ${category.padEnd(18)} ${label(product)}  (${Object.keys(missing).join(', ')})`)
}
for (const { product, category } of complete) console.log(`  = ${category.padEnd(18)} ${label(product)}`)
if (notes.length > 0) console.log(`\n${notes.map((note) => `  ! ${note}`).join('\n')}`)

if (!apply) {
  console.log('\nReport only. Nothing was written.')
  process.exit(0)
}

const transaction = client.transaction()
for (const { document } of creates) transaction.createIfNotExists(document)
// Pinned to the revision the report read, so an edit made in Studio in the
// meantime makes the write fail instead of being overwritten.
for (const { product, missing } of fills) {
  transaction.patch(product._id, (patch) => patch.ifRevisionId(product._rev).set(missing))
}
await transaction.commit()
console.log(`\nCreated ${creates.length} products and filled in ${fills.length}.`)
