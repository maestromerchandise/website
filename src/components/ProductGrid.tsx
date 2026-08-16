import { motion, useReducedMotion } from 'motion/react'
import { Fragment, useEffect, useRef, useState } from 'react'
import type { Product } from '../lib/sanity'
import { ProductDetail } from './ProductDetail'
import { Thumb } from './Thumb'

/** Which half of a row a tile belongs to, and so which panel it opens. */
export type Side = 'left' | 'right'

type Props = {
  products: Product[]
  /**
   * The visitor's state for this grid: the tile they clicked last, which decides
   * the row both panels sit on, and the sides they have closed. Everything else
   * falls back to the first product of each half, which is what makes a section
   * arrive showing two products rather than a bare row of tiles.
   */
  selected: { product?: Product; closed?: Side[] }
  onSelect: (product: Product, side: Side) => void
  onClose: (side: Side) => void
}

/**
 * Product tiles, with the detail opening inside the grid.
 *
 * The whole tile is one button rather than an image and a separate name link,
 * so the name and the image are a single 44px-plus target and a screen reader
 * announces one control instead of two that do the same thing.
 *
 * How many panels open is decided by how many products the grid holds. An even
 * count divides in two, so a row is read as two halves and each half carries its
 * own panel, the pair sitting side by side so two products can be compared at
 * once. An odd count has a true middle product and opens a single panel on it.
 *
 * Panels are placed after the last tile of their row rather than after the tile
 * that opened them. A panel is a wide grid item and cannot share a row with a
 * tile, so inserting one mid-row would push the tiles that followed below it and
 * leave the open tile standing alone.
 */
export function ProductGrid({ products, selected, onSelect, onClose }: Props) {
  const prefersReducedMotion = useReducedMotion()
  const gridRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(1)

  /**
   * The column count comes from the resolved grid rather than from the media
   * queries, so the two stay in step however the breakpoints are later changed.
   */
  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    function measure() {
      const element = gridRef.current
      if (!element) return
      setColumns(getComputedStyle(element).gridTemplateColumns.split(' ').length)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(grid)
    return () => observer.disconnect()
  }, [])

  /** The row a tile sits on, and the last tile of that row. */
  const rowOf = (index: number) => Math.floor(index / columns)
  const lastOfRow = (row: number) => Math.min(row * columns + columns - 1, products.length - 1)

  /**
   * How many panels this grid shows, decided by how many products it holds.
   *
   * An even catalogue divides cleanly into two, so it opens a pair. An odd one
   * has a true middle product and opens a single panel on it instead, rather
   * than splitting into halves where one is always a product longer.
   */
  const isPaired = products.length % 2 === 0

  const rowStart = (row: number) => row * columns

  /**
   * Where a row splits into its two halves, measured from the tiles the row
   * actually holds rather than from the column count. A part-filled last row is
   * narrower than the grid, and splitting it at half the columns would send the
   * right panel looking past the end of the list, leaving it empty.
   *
   * The left half takes the extra tile when the row's count is odd, so three
   * tiles read as two and one rather than leaving the middle one without a side.
   */
  const halfOf = (row: number) => Math.ceil((lastOfRow(row) - rowStart(row) + 1) / 2)
  const sideOf = (index: number): Side =>
    !isPaired || index - rowStart(rowOf(index)) < halfOf(rowOf(index)) ? 'left' : 'right'

  /**
   * The open panels stay on one row: the row of the tile clicked last, with any
   * second side falling back to the first product of its own half. Letting the
   * two drift onto different rows would strand a lone panel under each.
   */
  const clicked = selected.product ? products.indexOf(selected.product) : -1
  const clickedSide = clicked < 0 ? undefined : sideOf(clicked)

  /**
   * Which product each open side shows. Until the visitor picks a tile, a paired
   * grid opens the first product of each half of the row, and an unpaired one
   * opens the middle product of the whole catalogue — the centre is what an odd
   * count has that an even one does not.
   */
  const middle = Math.floor(products.length / 2)
  /** The row the panels sit under: the clicked tile's, or the opening default. */
  const openRowIndex = clicked >= 0 ? rowOf(clicked) : isPaired ? 0 : rowOf(middle)

  const openRow: Partial<Record<Side, Product>> = {}
  for (const side of isPaired ? (['left', 'right'] as const) : (['left'] as const)) {
    if (selected.closed?.includes(side)) continue
    const fallback = isPaired
      ? rowStart(openRowIndex) + (side === 'left' ? 0 : halfOf(openRowIndex))
      : clicked >= 0
        ? clicked
        : middle
    // A row with a single tile has no right half, and `fallback` runs past its end.
    const product = side === clickedSide ? products[clicked] : products[fallback]
    if (product && rowOf(products.indexOf(product)) === openRowIndex) openRow[side] = product
  }

  /**
   * The lift sits on the card rather than on the photograph, because a product
   * awaiting photography renders a placeholder tile with no img inside it and
   * would otherwise have no hover at all. Motion animates the return to rest as
   * well as the lift, which a CSS hover on a transformed child did not.
   */
  const lift = prefersReducedMotion
    ? {}
    : { whileHover: { y: -10 }, whileTap: { y: -4 } }

  return (
    <div className="product-grid" ref={gridRef}>
      {products.map((product, index) => {
        const side = sideOf(index)
        const isOpen = rowOf(index) === openRowIndex && openRow[side]?.id === product.id
        // The panels are siblings of the tiles in the same grid, so they land on
        // the row below rather than being trapped inside one cell's width.
        const panels =
          rowOf(index) === openRowIndex && index === lastOfRow(openRowIndex) ? openRow : undefined

        return (
          <Fragment key={product.id}>
            {/* The reference prints the product name above its photograph, and
                keeps the tile to a name and an image only. The tagline and the
                copy belong to the detail panel. */}
            <motion.button
              type="button"
              className="product-card"
              aria-expanded={isOpen}
              onClick={() => (isOpen ? onClose(side) : onSelect(product, side))}
              {...lift}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            >
              <span className="name">{product.title}</span>
              <Thumb source={product.image} alt={product.title} width={240} />
            </motion.button>

            {panels && (panels.left || panels.right) && (
              <div className="detail-pair">
                {(['left', 'right'] as const).map((panelSide) => {
                  const open = panels[panelSide]
                  return open ? (
                    <ProductDetail
                      key={panelSide}
                      product={open}
                      onClose={() => onClose(panelSide)}
                    />
                  ) : null
                })}
              </div>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
