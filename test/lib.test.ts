import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { FALLBACK_CATEGORIES, hasOwnSection } from '../src/lib/categories.ts'
import { enquiryMailto } from '../src/lib/enquiry.ts'
import { galleryImages, shownImage } from '../src/lib/gallery.ts'
import { imageSrcSet, imageUrl } from '../src/lib/img.ts'
import { wrapOffset } from '../src/lib/marquee.ts'
import { resolve } from '../src/lib/seo.ts'
import { whatsappLink, whatsappProductLink } from '../src/lib/whatsapp.ts'

const ASSET = 'https://cdn.sanity.io/images/abc123/production/deadbeef-2000x2000.jpg'

test('imageUrl asks the CDN for a sized, auto-format image', () => {
  assert.equal(imageUrl(ASSET, 800), `${ASSET}?w=800&q=75&fit=max&auto=format`)
})

test('imageUrl rounds a fractional width, because the CDN rejects one', () => {
  assert.match(imageUrl(ASSET, 799.6), /[?&]w=800(&|$)/)
})

test('imageUrl returns empty for a missing asset, so no request is made', () => {
  assert.equal(imageUrl(undefined, 800), '')
  assert.equal(imageUrl('', 800), '')
})

test('imageSrcSet offers a 2x candidate', () => {
  assert.equal(imageSrcSet(ASSET, 400), `${imageUrl(ASSET, 400)} 1x, ${imageUrl(ASSET, 800)} 2x`)
})

test('imageSrcSet is undefined for a missing asset, so no srcset attribute renders', () => {
  assert.equal(imageSrcSet(undefined, 400), undefined)
})

test('wrapOffset keeps an offset inside one lap', () => {
  assert.equal(wrapOffset(30, 100), 30)
  assert.equal(wrapOffset(100, 100), 0)
  assert.equal(wrapOffset(130, 100), 30)
})

test('wrapOffset wraps a backwards drag forward, not to a negative offset', () => {
  assert.equal(wrapOffset(-10, 100), 90)
  assert.equal(wrapOffset(-210, 100), 90)
})

test('wrapOffset survives an unmeasured track', () => {
  assert.equal(wrapOffset(50, 0), 0)
})

// WhatsApp is the primary conversion channel, so a malformed number is a lost
// lead rather than a visible error.
test('whatsappLink strips everything wa.me will not accept', () => {
  const link = whatsappLink({ whatsappNumber: '+62 812-3456-7890' }, 'Hi')
  assert.equal(link, 'https://wa.me/6281234567890?text=Hi')
})

test('whatsappLink drops a leading zero, which wa.me treats as invalid', () => {
  assert.match(whatsappLink({ whatsappNumber: '06281234567890' }, 'Hi')!, /wa\.me\/6281234567890\?/)
})

test('whatsappLink is undefined with no number, so the button is not rendered', () => {
  assert.equal(whatsappLink({}, 'Hi'), undefined)
  assert.equal(whatsappLink(null), undefined)
  assert.equal(whatsappLink({ whatsappNumber: '   ' }), undefined)
})

test('whatsappLink encodes a message, so a & or # cannot truncate it', () => {
  const link = whatsappLink({ whatsappNumber: '6281234567890' }, 'Boxes & bags #1')
  assert.ok(link!.endsWith('?text=Boxes%20%26%20bags%20%231'), link)
})

test('whatsappProductLink fills the product name into the configured template', () => {
  const link = whatsappProductLink(
    { whatsappNumber: '6281234567890', whatsappProductMessage: 'Hello, about {product} please' },
    'Eco Tote Bag',
  )
  assert.ok(link!.includes('Eco%20Tote%20Bag'), link)
  assert.ok(!link!.includes('{product}'), 'the placeholder must be replaced')
})

// The enquiry is handed to the visitor's own mail app, so the URL has to be
// correct in one shot: there is no server to retry against.
test('enquiryMailto addresses the configured recipient with the visitor details', () => {
  const url = enquiryMailto(
    { enquiryEmail: 'sales@maestro.com', enquirySubject: 'Enquiry from {name}' },
    { name: 'Rahfi', email: 'r@example.com', phone: '628123', message: 'Ten tote bags please' },
  )
  assert.ok(url.startsWith('mailto:sales@maestro.com?'), url)
  assert.ok(url.includes('Enquiry%20from%20Rahfi'), 'subject carries the name')
  assert.ok(url.includes('628123'), 'the WhatsApp number reaches the inbox')
  assert.ok(url.includes('Ten%20tote%20bags%20please'), 'the message body is carried')
})

test('enquiryMailto encodes a space as %20, which every mail client accepts', () => {
  const url = enquiryMailto(null, {
    name: 'A B',
    email: 'a@example.com',
    phone: '1',
    message: 'x',
  })
  assert.ok(!url.includes('+'), 'a + would show literally in the subject line')
})

// Picking a colour has to change the photograph, which is the whole point of
// the swatches. A colour the editor has not yet photographed must leave the
// current picture alone rather than blanking the panel.
const SHIRT = {
  id: 'shirt',
  title: 'Shirt',
  category: 'apparel-wearables',
  image: 'main.jpg',
  gallery: ['detail.jpg'],
  colors: [
    { name: 'Navy', hex: '#22304A', image: 'navy.jpg' },
    { name: 'White', hex: '#F5F3F0' },
  ],
}

test('picking a colour shows that colour photograph', () => {
  assert.equal(shownImage(SHIRT, '#22304A', undefined), 'navy.jpg')
})

test('a colour with no photograph falls back rather than blanking the panel', () => {
  assert.equal(shownImage(SHIRT, '#F5F3F0', undefined), 'main.jpg')
  assert.equal(shownImage(SHIRT, '#F5F3F0', 'detail.jpg'), 'detail.jpg')
})

test('a colour photograph outranks a picked gallery image', () => {
  assert.equal(shownImage(SHIRT, '#22304A', 'detail.jpg'), 'navy.jpg')
})

test('with nothing picked the main shot is shown', () => {
  assert.equal(shownImage(SHIRT, undefined, undefined), 'main.jpg')
})

test('an unknown colour cannot blank the image', () => {
  assert.equal(shownImage(SHIRT, '#000000', undefined), 'main.jpg')
})

test('galleryImages leads with the main shot and drops the gaps', () => {
  assert.deepEqual(galleryImages(SHIRT), ['main.jpg', 'detail.jpg'])
  assert.deepEqual(galleryImages({ id: 'x', title: 'X', category: 'office' }), [])
})

// The SEO fallback decides what a search result says, so a cleared field has to
// inherit the global default rather than publishing a blank tag.
test('page SEO wins over the global default', () => {
  assert.equal(resolve({ metaTitle: 'Page' }, { metaTitle: 'Default' }, 'metaTitle'), 'Page')
})

test('an unset page field falls back to the global default', () => {
  assert.equal(resolve({}, { metaTitle: 'Default' }, 'metaTitle'), 'Default')
})

test('a cleared page field falls back rather than blanking the tag', () => {
  assert.equal(resolve({ metaTitle: '' }, { metaTitle: 'Default' }, 'metaTitle'), 'Default')
  assert.equal(resolve({ metaTitle: '   ' }, { metaTitle: 'Default' }, 'metaTitle'), 'Default')
})

test('resolve is undefined when nothing is set, so the shipped HTML stands', () => {
  assert.equal(resolve({}, {}, 'metaTitle'), undefined)
  assert.equal(resolve(undefined, undefined, 'metaTitle'), undefined)
  assert.equal(resolve({ metaTitle: '' }, { metaTitle: '' }, 'metaTitle'), undefined)
})

// Every category card scrolls somewhere. A card whose target section is never
// rendered scrolls to nothing, which reads as a dead link rather than an error.
test('box is presented as Custom Box, so it is not also an ordinary category row', () => {
  const box = FALLBACK_CATEGORIES.find((category) => category.id === 'box')
  assert.equal(box?.anchor, 'custom-box')
  assert.equal(hasOwnSection(box!), false)
})

test('every other fallback category renders its own section', () => {
  for (const category of FALLBACK_CATEGORIES.filter((c) => c.id !== 'box')) {
    assert.ok(hasOwnSection(category), `${category.id} should render its own section`)
  }
})

// The seed feeds both the Sanity import and the credential-free dev preview, so
// a typo here shows up as a silently missing section rather than an error.
const seed = JSON.parse(readFileSync(new URL('../content/seed.json', import.meta.url), 'utf8'))
const categoryIds = new Set(seed.categories.map((category: { id: string }) => category.id))

test('the seed carries every key the site reads', () => {
  for (const key of ['settings', 'homepage', 'about', 'categories', 'products']) {
    assert.ok(key in seed, `seed is missing ${key}`)
  }
})

test('every seeded product names a category the site renders', () => {
  for (const product of seed.products) {
    assert.ok(categoryIds.has(product.category), `${product.id} has unknown category ${product.category}`)
  }
})

test('every seeded product carries the fields the grid and popup read', () => {
  for (const product of seed.products) {
    assert.equal(typeof product.id, 'string', `${product.title} needs an id for the document id`)
    assert.equal(typeof product.title, 'string')
    assert.ok(Array.isArray(product.features), `${product.id} needs features`)
    assert.ok(Array.isArray(product.specifications), `${product.id} needs specifications`)
  }
})

test('every seeded colour is a hex value Studio would accept', () => {
  for (const product of seed.products) {
    for (const colour of product.colors ?? []) {
      assert.match(colour.hex, /^#[0-9a-fA-F]{6}$/, `${product.id} has a bad colour ${colour.hex}`)
    }
  }
})

test('seeded product ids are unique, or a document would overwrite another', () => {
  const ids = seed.products.map((product: { id: string }) => product.id)
  assert.equal(new Set(ids).size, ids.length)
})

test('every seeded category has a product to represent it on its card', () => {
  const withProducts = new Set(seed.products.map((product: { category: string }) => product.category))
  for (const category of seed.categories) {
    assert.ok(withProducts.has(category.id), `${category.id} has no product, so its card has no image`)
  }
})

test('the seeded WhatsApp number is the digits-only form wa.me needs', () => {
  assert.match(seed.settings.whatsappNumber, /^[1-9][0-9]{7,14}$/)
})

test('the seeded enquiry address is a usable mailto recipient', () => {
  assert.match(seed.settings.enquiryEmail, /^[^@\s]+@[^@\s]+\.[^@\s]+$/)
})

test('every navigation link points at a section or page that exists', () => {
  const anchors = new Set([
    'products',
    'ready-made',
    'custom-gift',
    'custom-box',
    'contact',
    ...seed.categories.map((category: { anchor: string }) => category.anchor),
  ])

  for (const item of seed.settings.navigation) {
    if (item.href === '/about/' || item.href === '/') continue
    const id = item.href.replace(/^\/?#/, '')
    assert.ok(anchors.has(id), `${item.label} links to #${id}, which nothing renders`)
  }
})
