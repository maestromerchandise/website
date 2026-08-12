import type { Product } from '../lib/sanity'
import { Thumb } from './Thumb'

type Props = {
  products: Product[]
  onSelect: (product: Product) => void
}

/** Product tiles. Selecting one opens the detail dialog. */
export function ProductGrid({ products, onSelect }: Props) {
  return (
    <div className="product-grid">
      {products.map((product) => (
        <button key={product.id} type="button" className="product-card" onClick={() => onSelect(product)}>
          <Thumb source={product.image} alt={product.title} width={240} />
          <span className="name">{product.title}</span>
        </button>
      ))}
    </div>
  )
}
