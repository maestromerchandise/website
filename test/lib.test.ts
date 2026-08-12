import assert from 'node:assert/strict'
import { test } from 'node:test'
import { imageSrcSet, imageUrl } from '../src/lib/img.ts'
import { wrapScroll } from '../src/lib/marquee.ts'

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

test('wrapScroll keeps an offset inside one lap', () => {
  assert.equal(wrapScroll(30, 100), 30)
  assert.equal(wrapScroll(100, 100), 0)
  assert.equal(wrapScroll(130, 100), 30)
})

test('wrapScroll wraps a backwards drag forward, not to a negative offset', () => {
  assert.equal(wrapScroll(-10, 100), 90)
  assert.equal(wrapScroll(-210, 100), 90)
})

test('wrapScroll survives an unmeasured track', () => {
  assert.equal(wrapScroll(50, 0), 0)
})
