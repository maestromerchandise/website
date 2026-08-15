import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { EVENTS, track } from '../lib/analytics'
import { coverFor } from '../lib/categories'
import type { Category, Product } from '../lib/sanity'
import { scrollToSection } from '../lib/scroll'
import { Thumb } from './Thumb'

type Props = {
  categories: Category[]
  /** Used to pick a representative image when a category sets none. */
  products: Product[]
  /** Categories with no product are hidden on the Custom Gift strip, shown under the masthead. */
  hideEmpty?: boolean
}

/**
 * The category row under the masthead, each item scrolling to its section.
 *
 * Driven entirely by the categories in the CMS, so one added there appears here
 * without a layout change. On a narrow screen the row scrolls sideways rather
 * than shrinking its items past the point of being readable.
 */
export function CategoryStrip({ categories, products, hideEmpty = false }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [columnWidth, setColumnWidth] = useState<number>()

  const countOf = (id: string) => products.filter((product) => product.category === id).length

  const visible = categories
    .filter((category) => category.showInStrip)
    .filter((category) => !hideEmpty || countOf(category.id) > 0)

  /**
   * Size every column from the longest label.
   *
   * Left to itself the grid sizes each column to its own content, which made
   * the card holding the longest label wider than the rest and enlarged its
   * photograph with it. The labels come from the CMS, so the widest is measured
   * rather than written down, and re-measured once the webfont has loaded,
   * since Montserrat is wider than the fallback it swaps out.
   */
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    function measure() {
      const element = trackRef.current
      if (!element) return
      const labels = element.querySelectorAll<HTMLElement>('.category-card .eyebrow')
      if (labels.length === 0) return
      // scrollWidth, not the box width: the label never wraps, so this stays the
      // natural width even once the column has been narrowed around it.
      setColumnWidth(Math.max(...[...labels].map((label) => Math.ceil(label.scrollWidth))))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    document.fonts?.ready.then(measure)
    return () => observer.disconnect()
  }, [visible.length])

  function handleClick(event: MouseEvent<HTMLAnchorElement>, href: string, label: string) {
    track(EVENTS.categoryClick, { category: label })
    if (scrollToSection(href)) event.preventDefault()
  }

  if (visible.length === 0) return null

  return (
    <nav className="category-strip" aria-label="Product categories">
      <div
        ref={trackRef}
        className="category-track"
        style={columnWidth ? ({ '--category-column': `${columnWidth}px` } as CSSProperties) : undefined}
      >
        {visible.map((category) => {
          const href = `/#${category.anchor}`
          return (
            <a
              key={category.id}
              className="category-card"
              href={href}
              onClick={(event) => handleClick(event, href, category.label)}
            >
              <Thumb source={coverFor(category, products)} alt={category.label} width={200} />
              <span className="eyebrow">{category.label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
