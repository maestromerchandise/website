/**
 * Stand-in artwork for a product with no photograph yet.
 *
 * Deliberately generated rather than uploaded into Sanity. A seeded placeholder
 * asset would have to be found and deleted one by one once the real photography
 * arrives; a fallback disappears on its own the moment an image is set, because
 * the CMS value simply wins.
 */

/**
 * A hue in [0, 360) derived from the name.
 *
 * Distinct per product so a grid of pending items reads as a catalogue rather
 * than as one repeated grey box, and stable across reloads so the page does not
 * reshuffle its colours while being reviewed.
 */
export function placeholderHue(text: string): number {
  let hash = 0
  for (const character of text) {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) % 360
  }
  return hash
}

/** One or two letters standing in for the product, as a gallery label would. */
export function monogram(text: string): string {
  const words = text.trim().split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word))
  if (words.length === 0) return '?'
  const first = words[0]
  if (words.length === 1) return first.slice(0, 2).toUpperCase()
  return (first[0] + words[words.length - 1][0]).toUpperCase()
}
