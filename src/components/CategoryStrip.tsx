import { motion, useReducedMotion } from 'motion/react'
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
  /** The strip under the masthead is on the first screen, so its photographs load first. */
  priority?: boolean
}

/**
 * The category row under the masthead, each item scrolling to its section.
 *
 * Driven entirely by the categories in the CMS, so one added there appears here
 * without a layout change. On a narrow screen the row scrolls sideways rather
 * than shrinking its items past the point of being readable.
 */
export function CategoryStrip({ categories, products, hideEmpty = false, priority = false }: Props) {
  const prefersReducedMotion = useReducedMotion()

  /** The same lift the product tiles use, so every card on the page behaves alike. */
  const lift = prefersReducedMotion ? {} : { whileHover: { y: -10 }, whileTap: { y: -4 } }

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
      {/* The count drives the columns, so the row divides itself however many
          categories the CMS carries rather than assuming nine. */}
      <div
        className="category-track"
        style={{ '--category-count': visible.length } as CSSProperties}
      >
        {visible.map((category) => {
          const href = `/#${category.anchor}`
          return (
            <motion.a
              key={category.id}
              className="category-card"
              href={href}
              onClick={(event) => handleClick(event, href, category.label)}
              {...lift}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            >
              <Thumb
                source={coverFor(category, products)}
                alt={category.label}
                width={200}
                priority={priority}
              />
              <span className="eyebrow">{category.label}</span>
            </motion.a>
          )
        })}
      </div>
    </nav>
  )
}
