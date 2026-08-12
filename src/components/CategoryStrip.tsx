import { CATEGORIES, type Category, type Product } from '../lib/sanity'
import { Thumb } from './Thumb'

type Props = {
  /** Used to pick a representative image per category. */
  products: Product[]
}

/** The nine-category row under the masthead, each linking to its section. */
export function CategoryStrip({ products }: Props) {
  const coverFor = (category: Category) => products.find((product) => product.category === category)?.image

  return (
    <nav className="shell category-strip" aria-label="Product categories">
      {CATEGORIES.map((category) => (
        <a key={category.id} className="category-card" href={`#${category.id}`}>
          <Thumb source={coverFor(category.id)} alt={category.label} width={200} />
          <span className="eyebrow">{category.label}</span>
        </a>
      ))}
    </nav>
  )
}
