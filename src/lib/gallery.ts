import type { Product } from './sanity'

/**
 * Which photograph the detail panel shows.
 *
 * A colour with its own photograph wins, so picking a colour changes the
 * picture. Otherwise an explicitly chosen gallery image stands, and failing
 * both the main shot is used. A colour with no photograph of its own therefore
 * leaves the current image alone rather than blanking the panel, which is what
 * lets an editor add colour photographs gradually.
 */
export function shownImage(
  product: Product,
  activeColor: string | undefined,
  pickedImage: string | undefined,
): string | undefined {
  const colorImage = product.colors?.find((color) => color.hex === activeColor)?.image
  return colorImage ?? pickedImage ?? product.image
}

/** The main shot followed by every gallery image, with the gaps removed. */
export function galleryImages(product: Product): string[] {
  return [product.image, ...(product.gallery ?? [])].filter(Boolean) as string[]
}
