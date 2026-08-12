import type { MouseEvent } from 'react'
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
  const countOf = (id: string) => products.filter((product) => product.category === id).length

  const visible = categories
    .filter((category) => category.showInStrip)
    .filter((category) => !hideEmpty || countOf(category.id) > 0)

  function handleClick(event: MouseEvent<HTMLAnchorElement>, href: string, label: string) {
    track(EVENTS.categoryClick, { category: label })
    if (scrollToSection(href)) event.preventDefault()
  }

  if (visible.length === 0) return null

  return (
    <nav className="category-strip" aria-label="Product categories">
      <div className="category-track">
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
