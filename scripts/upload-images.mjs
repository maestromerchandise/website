/**
 * Attach the product photography in a folder tree to the documents in Sanity.
 *
 * Both settings arrive as environment values, because `sanity exec` owns the
 * argument list:
 *
 *   IMAGES_DIR=/path/to/images npx sanity exec scripts/upload-images.mjs --with-user-token
 *   IMAGES_DIR=/path/to/images APPLY=1 npx sanity exec scripts/upload-images.mjs --with-user-token
 *
 * The tree is `<NN. Category>/<page>/<Collection> - <Product>.png`, so the
 * folder gives the category and the part after the dash gives the subject. Only
 * .png is read; the .psd beside it is the working file and is far larger.
 *
 * A subject is attached to a product only when the names match after
 * normalising, because a photograph on the wrong product is worse than a
 * product with none. The first file of a subject becomes the product's main
 * image and the numbered variants follow it into the gallery. The first product
 * photographed in a category also supplies that category's cover.
 *
 * Every file is squared up before it is uploaded. The originals disagree on both
 * counts that decide how large a product looks in a tile: their aspect runs from
 * 0.30 to 1.50, and the subject fills anywhere between 45% and 100% of its
 * canvas. Trimming the transparent margin and re-centring on one square canvas
 * makes the products read at a consistent size beside each other.
 *
 * Run through `sanity exec`, which hands the script a client already
 * authenticated as the logged-in user. Nothing here reads a token.
 */
import { readdirSync, statSync } from 'node:fs'
import { join, basename } from 'node:path'
import { getCliClient } from 'sanity/cli'
import sharp from 'sharp'

/** The square every photograph is placed on, and how much of it the product fills. */
const CANVAS = 1200
const SUBJECT = Math.round(CANVAS * 0.88)

/**
 * Trim the empty margin, scale the product to one size, and centre it on a
 * transparent square.
 *
 * Two passes because sharp takes a single resize per pipeline: the first fits
 * the trimmed subject inside the target box, the second pads that out to the
 * square. The padding is transparent, so the tile behind it stays the colour of
 * the page.
 */
async function square(file) {
  const subject = await sharp(file)
    .trim({ threshold: 1 })
    .resize(SUBJECT, SUBJECT, { fit: 'inside' })
    .png()
    .toBuffer()

  return sharp(subject)
    .resize(CANVAS, CANVAS, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
}

/** The numbered folders, in the order the catalogue lists its categories. */
const FOLDER_TO_CATEGORY = {
  '01. Eco Essentials': 'eco-essentials',
  '02. Travel Essentials': 'travel-essentials',
  '03. Sports Collection': 'sports',
  '04. Smart Lifestyle': 'smart-tech',
  '05. Office Collection': 'office',
  '06. Home & Living': 'home-living',
  '07. Automotive': 'automotive',
  '08. Apparel': 'apparel-wearables',
  '09. Custom Made': 'box',
}

// Passed as environment values because `sanity exec` owns the argument list.
const root = process.env.IMAGES_DIR
const apply = process.env.APPLY === '1'

if (!root) {
  console.error('Set IMAGES_DIR to the folder holding the category directories.')
  process.exit(1)
}

/**
 * Compare names loosely enough to survive the spelling in the filenames, which
 * carry "Cutlerry" and "Essenstials", and the trailing "2", "3" of a variant.
 */
function normalise(value) {
  return value
    .toLowerCase()
    .replaceAll('cutlerry', 'cutlery')
    .replaceAll('essenstials', 'essentials')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+\d+\s*$/, '')
    .trim()
}

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const full = join(directory, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const client = getCliClient({ apiVersion: '2024-01-01' })
const products = await client.fetch('*[_type=="product"]{_id,title,"cat":category->slug.current}')

const images = walk(root)
  .filter((file) => file.toLowerCase().endsWith('.png'))
  .map((file) => {
    const relative = file.slice(root.length + 1).split(/[\\/]/)
    const name = basename(file, '.png')
    const subject = name.includes(' - ') ? name.split(' - ').pop() : name
    // "Bottle 3" is the third photograph of "Bottle", not a different product.
    const variant = Number(subject.match(/\s(\d+)\s*$/)?.[1] ?? 1)
    return {
      file,
      category: FOLDER_TO_CATEGORY[relative[0]],
      subject: subject.trim(),
      key: normalise(subject),
      variant,
    }
  })
  .filter((image) => image.category)

/** Group the variants of one subject together, in their numbered order. */
const groups = new Map()
for (const image of images) {
  const id = `${image.category}::${image.key}`
  const group = groups.get(id) ?? {
    category: image.category,
    key: image.key,
    subject: image.subject,
    files: [],
  }
  group.files.push(image)
  groups.set(id, group)
}
for (const group of groups.values()) group.files.sort((a, b) => a.variant - b.variant)

/**
 * Score a subject against a product: an exact name beats one that merely
 * contains the other, so "Padel Racket" wins over "Padel" if both appear.
 */
function score(product, group) {
  if (product.cat !== group.category) return 0
  const title = normalise(product.title)
  if (title === group.key) return 3
  if (title.includes(group.key) || group.key.includes(title)) return 2
  return 0
}

const candidates = []
const unmatched = []
for (const group of groups.values()) {
  // A file called 1.png carries no subject at all, and an empty key would
  // otherwise match every product through `includes`.
  if (group.key.length < 4 || /^\d+$/.test(group.key)) {
    unmatched.push(group)
    continue
  }
  const ranked = products
    .map((product) => ({ product, points: score(product, group) }))
    .filter((entry) => entry.points > 0)
    .sort((a, b) => b.points - a.points)
  if (ranked.length > 0) candidates.push({ ...ranked[0], group })
  else unmatched.push(group)
}

// One product holds one set of photographs, so where two subjects both claim it
// the stronger match keeps it and the other is reported as unmatched.
const plan = []
const taken = new Map()
for (const entry of candidates.sort((a, b) => b.points - a.points || b.group.files.length - a.group.files.length)) {
  const held = taken.get(entry.product._id)
  if (held) {
    unmatched.push(entry.group)
    continue
  }
  taken.set(entry.product._id, entry)
  plan.push({ product: entry.product, group: entry.group })
}

console.log(`${images.length} png files in ${groups.size} subjects.`)
console.log(`${plan.length} subjects match a product, ${unmatched.length} do not.\n`)
for (const { product, group } of plan) {
  const label = group.subject.replace(/\s+\d+\s*$/, '')
  console.log(`  ${product.title.padEnd(26)} <-  ${label}  (${group.files.length})`)
}
if (unmatched.length > 0) {
  console.log(`\nNo product for: ${unmatched.map((group) => group.subject).join(', ')}`)
}

if (!apply) {
  console.log('\nReport only. Run `npm run images:apply` to upload.')
  process.exit(0)
}

const reference = (asset) => ({ _type: 'image', asset: { _type: 'reference', _ref: asset._id } })

const transaction = client.transaction()
const covered = new Set()

for (const { product, group } of plan) {
  const [main, ...rest] = group.files
  const mainAsset = await client.assets.upload('image', await square(main.file), {
    filename: basename(main.file),
  })

  const gallery = []
  for (const [index, image] of rest.entries()) {
    const asset = await client.assets.upload('image', await square(image.file), {
      filename: basename(image.file),
    })
    gallery.push({ ...reference(asset), _key: `g${index}` })
  }

  transaction.patch(product._id, (patch) =>
    patch.set(gallery.length > 0 ? { image: reference(mainAsset), gallery } : { image: reference(mainAsset) }),
  )

  // The first product photographed in a category also stands for the category.
  if (!covered.has(group.category)) {
    covered.add(group.category)
    transaction.patch(`category-${group.category}`, (patch) =>
      patch.set({ coverImage: reference(mainAsset) }),
    )
  }

  console.log(`uploaded ${group.files.length} for ${product.title}`)
}

await transaction.commit()
console.log(`\nAttached photography to ${plan.length} products and ${covered.size} category covers.`)
