import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Fragment, useEffect, useRef, useState } from 'react'
import type { Product } from '../lib/sanity'
import { ProductDetail } from './ProductDetail'
import { Thumb } from './Thumb'

/** Which half of a row a tile belongs to, and so which panel it opens. */
type Side = 'left' | 'right'

type Props = {
  products: Product[]
  /**
   * The products the visitor has opened in this grid, oldest first. Empty until
   * a tile is clicked, so the grid arrives as tiles alone.
   */
  open: Product[]
  onOpen: (product: Product) => void
  onClose: (product: Product) => void
}

/**
 * Product tiles, with the detail opening inside the grid.
 *
 * The whole tile is one button rather than an image and a separate name link,
 * so the name and the image are a single 44px-plus target and a screen reader
 * announces one control instead of two that do the same thing.
 *
 * A row is read as two halves and each half can hold one open panel, the pair
 * sitting side by side so two products can be compared at once. Nothing opens
 * until a tile is picked; picking a tile on the other half of the same row adds
 * a second panel beside the first.
 *
 * Panels are placed after the last tile of their row rather than after the tile
 * that opened them. A panel is a wide grid item and cannot share a row with a
 * tile, so inserting one mid-row would push the tiles that followed below it and
 * leave the open tile standing alone.
 */
export function ProductGrid({ products, open, onOpen, onClose }: Props) {
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

  const rowStart = (row: number) => row * columns
  const countInRow = (row: number) => lastOfRow(row) - rowStart(row) + 1

  /**
   * Where a row splits into its two halves, measured from the tiles the row
   * actually holds rather than from the column count. A part-filled last row is
   * narrower than the grid, and splitting it at half the columns would send the
   * right panel looking past the end of the list, leaving it empty.
   *
   * The left half takes the extra tile when the row's count is odd, so three
   * tiles read as two and one rather than leaving the middle one without a side.
   */
  const halfOf = (row: number) => Math.ceil(countInRow(row) / 2)
  const sideOf = (index: number): Side =>
    index - rowStart(rowOf(index)) < halfOf(rowOf(index)) ? 'left' : 'right'

  const indexOf = (product: Product) =>
    products.findIndex((candidate) => candidate.id === product.id)

  /**
   * The open panels share one row: the row of the product opened last. An older
   * pick on another row is left out rather than stranded as a lone panel under a
   * row the visitor has moved away from, and a later pick on the same half
   * replaces the earlier one. A product filtered out of this grid is skipped.
   */
  const shown = open.filter((product) => indexOf(product) >= 0)
  const latest = shown.at(-1)
  const openRowIndex = latest ? rowOf(indexOf(latest)) : -1
  const openRow: Partial<Record<Side, Product>> = {}
  for (const product of shown) {
    const index = indexOf(product)
    if (rowOf(index) === openRowIndex) openRow[sideOf(index)] = product
  }
  const openSides = (['left', 'right'] as const).filter((side) => openRow[side])

  /**
   * The lift sits on the card rather than on the photograph, because a product
   * awaiting photography renders a placeholder tile with no img inside it and
   * would otherwise have no hover at all. Motion animates the return to rest as
   * well as the lift, which a CSS hover on a transformed child did not.
   */
  const lift = prefersReducedMotion
    ? {}
    : { whileHover: { y: -10 }, whileTap: { y: -4 } }

  /** The pair fades as one; ProductDetail fades each panel inside it. */
  const enter = prefersReducedMotion ? { duration: 0 } : { duration: 0.24, ease: 'easeOut' as const }
  const leave = prefersReducedMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeIn' as const }

  return (
    <div className="product-grid" ref={gridRef}>
      {products.map((product, index) => {
        const side = sideOf(index)
        const row = rowOf(index)
        const isOpen = row === openRowIndex && openRow[side]?.id === product.id

        return (
          <Fragment key={product.id}>
            {/* The reference prints the product name above its photograph, and
                keeps the tile to a name and an image only. The tagline and the
                copy belong to the detail panel. */}
            <motion.button
              type="button"
              className="product-card"
              data-product={product.id}
              aria-expanded={isOpen}
              onClick={() => (isOpen ? onClose(product) : onOpen(product))}
              {...lift}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            >
              <span className="name">{product.title}</span>
              <Thumb source={product.image} alt={product.title} width={240} />
            </motion.button>

            {/* One presence at the end of every row, and mounted from the start,
                so a pair leaving this row stays in place until its fade has
                finished. React would otherwise remove it the moment it closed. */}
            {index === lastOfRow(row) && (
              <AnimatePresence initial={false}>
                {row === openRowIndex && openSides.length > 0 && (
                  <motion.div
                    key="pair"
                    className="detail-pair"
                    data-count={openSides.length}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: enter }}
                    exit={{ opacity: 0, transition: leave }}
                  >
                    {/* popLayout takes a closing panel out of the flow while it
                        fades, so the panel beside it does not jump into its slot
                        before the fade has ended. */}
                    <AnimatePresence initial={false} mode="popLayout">
                      {openSides.map((panelSide) => {
                        const panel = openRow[panelSide] as Product
                        return (
                          <ProductDetail
                            key={panel.id}
                            product={panel}
                            onClose={() => onClose(panel)}
                          />
                        )
                      })}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
