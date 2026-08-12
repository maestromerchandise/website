import { useEffect, useRef, useState } from 'react'
import type { Product } from '../lib/sanity'
import { Thumb } from './Thumb'

type Props = {
  product: Product
  onClose: () => void
}

/**
 * Product detail dialog.
 *
 * Native `<dialog>` with `showModal()`, which brings the focus trap, Escape to
 * close, inertness of the page behind, focus restoration on close and the
 * backdrop with it. A library would re-implement all of that in JavaScript.
 */
export function ProductModal({ product, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const images = [product.image, ...(product.gallery ?? [])].filter(Boolean) as string[]
  const [activeImage, setActiveImage] = useState(images[0])

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label={product.title}
      // The dialog element itself is the backdrop hit area; content sits in a child.
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close()
      }}
    >
      <button
        type="button"
        className="dialog-close"
        onClick={() => dialogRef.current?.close()}
        aria-label="Close"
      >
        &times;
      </button>

      <div className="dialog-body">
        <div className="dialog-gallery">
          <Thumb source={activeImage} alt={product.title} width={520} />
          {images.length > 1 && (
            <div className="dialog-gallery-strip">
              {images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(image)}
                  aria-label={`Show image ${index + 1} of ${product.title}`}
                >
                  <Thumb source={image} alt="" width={120} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="display">{product.title}</h2>
          {product.tagline && <p className="eyebrow">{product.tagline}</p>}
          {product.description && <p>{product.description}</p>}

          {product.features && product.features.length > 0 && (
            <>
              <h3 className="eyebrow">Features</h3>
              <ul className="spec-list">
                {product.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </>
          )}

          {product.specifications && product.specifications.length > 0 && (
            <>
              <h3 className="eyebrow">Specifications</h3>
              <ul className="spec-list">
                {product.specifications.map((specification) => (
                  <li key={specification}>{specification}</li>
                ))}
              </ul>
            </>
          )}

          {product.colors && product.colors.length > 0 && (
            <>
              <h3 className="eyebrow">Colour</h3>
              <ul className="swatches">
                {product.colors.map((color) => (
                  <li
                    key={color.hex}
                    className="swatch"
                    style={{ background: color.hex }}
                    title={color.name}
                  >
                    <span className="skip-link">{color.name}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </dialog>
  )
}
