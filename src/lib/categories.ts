import type { Category, Product } from './sanity'

/**
 * Fallback categories, used only when the CMS has none.
 *
 * Categories are `productCategory` documents in Sanity so they can be added and
 * reordered without a deploy. This list keeps the site rendering against an
 * empty or unreachable dataset, and matches the nine in the original design.
 */
export const FALLBACK_CATEGORIES: Category[] = [
  { id: 'eco-essentials', label: 'Eco Essentials', anchor: 'eco-essentials', showInStrip: true },
  { id: 'travel-essentials', label: 'Travel Essentials', anchor: 'travel-essentials', showInStrip: true },
  { id: 'sports', label: 'Sports', anchor: 'sports', showInStrip: true },
  { id: 'smart-tech', label: 'Smart & Tech', anchor: 'smart-tech', showInStrip: true },
  { id: 'office', label: 'Office', anchor: 'office', showInStrip: true },
  { id: 'home-living', label: 'Home & Living', anchor: 'home-living', showInStrip: true },
  { id: 'automotive', label: 'Automotive', anchor: 'automotive', showInStrip: true },
  { id: 'apparel-wearables', label: 'Apparel & Wearables', anchor: 'apparel-wearables', showInStrip: true },
  // Boxes are presented as Custom Box rather than an ordinary category row, so
  // the card scrolls there instead of rendering the same products twice.
  { id: 'box', label: 'Box', anchor: 'custom-box', showInStrip: true },
]

/**
 * A category renders its own section only when it scrolls to itself. Box points
 * at `custom-box`, which is rendered separately further down the page.
 */
export function hasOwnSection(category: Category): boolean {
  return category.anchor === category.id
}

/** The image on a category card: the one set in the CMS, else the first product. */
export function coverFor(category: Category, products: Product[]): string | undefined {
  return category.image ?? products.find((product) => product.category === category.id)?.image
}
