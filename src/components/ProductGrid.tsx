import { Fragment } from 'react'
import type { Product, SiteSettings } from '../lib/sanity'
import { ProductDetail } from './ProductDetail'
import { Thumb } from './Thumb'

type Props = {
  products: Product[]
  settings: SiteSettings | null | undefined
  /** The product whose detail is open, when it belongs to this grid. */
  selected?: Product
  onSelect: (product: Product) => void
  onClose: () => void
}

/**
 * Product tiles, with the detail opening inside the grid.
 *
 * The whole tile is one button rather than an image and a separate name link,
 * so the name and the image are a single 44px-plus target and a screen reader
 * announces one control instead of two that do the same thing.
 *
 * The detail panel is a grid item spanning every column, placed straight after
 * the selected tile. That keeps it in the flow of the page, so opening one
 * pushes the rest of the catalogue down rather than covering it.
 */
export function ProductGrid({ products, settings, selected, onSelect, onClose }: Props) {
  return (
    <div className="product-grid">
      {products.map((product) => {
        const isOpen = selected?.id === product.id
        // The tile and its detail are siblings in the same grid: the detail is
        // its own item spanning every column, so it lands on the row below the
        // tile rather than being trapped inside one cell's width.
        return (
          <Fragment key={product.id}>
            {/* The reference prints the product name above its photograph, and
                keeps the tile to a name and an image only. The tagline and the
                copy belong to the detail panel. */}
            <button
              type="button"
              className="product-card"
              aria-expanded={isOpen}
              onClick={() => (isOpen ? onClose() : onSelect(product))}
            >
              <span className="name">{product.title}</span>
              <Thumb source={product.image} alt={product.title} width={240} />
            </button>

            {isOpen && <ProductDetail product={product} settings={settings} onClose={onClose} />}
          </Fragment>
        )
      })}
    </div>
  )
}
