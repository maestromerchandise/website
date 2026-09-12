import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { Ref } from 'react'
import { galleryImages, shownImage } from '../lib/gallery'
import type { Product } from '../lib/sanity'
import { Thumb } from './Thumb'

type Props = {
  product: Product
  onClose: () => void
  /**
   * Passed by the grid's AnimatePresence, which has to measure a closing panel
   * to lift it out of the layout while it fades.
   */
  ref?: Ref<HTMLDivElement>
}

/**
 * Product detail, opened inside the page rather than over it.
 *
 * The panel expands in the flow of the grid it was opened from, so the page
 * keeps scrolling as one document and nothing is hidden behind an overlay.
 *
 * The swatches list the colours a product is made in and are not a control; the
 * gallery thumbnails are the one way to change the photograph.
 */
export function ProductDetail({ product, onClose, ref }: Props) {
  const prefersReducedMotion = useReducedMotion()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [pickedImage, setPickedImage] = useState<string>()

  const colors = product.colors ?? []
  const gallery = galleryImages(product)
  // No colour is ever picked now, so the photograph is the chosen thumbnail or
  // the main shot.
  const shown = shownImage(product, undefined, pickedImage)

  /** The same float the product tiles have, scaled to a thumbnail's size. */
  const lift = prefersReducedMotion ? {} : { whileHover: { y: -6 }, whileTap: { y: -2 } }

  // The panel opens where the product is, and the page stays put. Scrolling to
  // it would move the catalogue out from under the tile that was just clicked,
  // which is the one thing an in-page detail is meant to avoid.
  //
  // Focus still moves to the heading, because a keyboard or screen reader user
  // has to be told the panel appeared. `preventScroll` is what keeps that from
  // scrolling the page as a side effect.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [product.id])

  // Escape closes, matching what the dialog used to do.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    // Fades in on opening and out on closing. The exit only gets to run because
    // the grid keeps a closing panel mounted until it has finished.
    <motion.div
      ref={ref}
      className="product-detail"
      initial={{ opacity: 0, y: -6 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.24, ease: 'easeOut' },
      }}
      exit={{
        opacity: 0,
        y: -6,
        transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeIn' },
      }}
    >
      <button type="button" className="detail-close" onClick={onClose} aria-label="Close details">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M5 5l14 14M19 5L5 19" strokeLinecap="round" />
        </svg>
      </button>

      <div className="detail-gallery">
        <Thumb source={shown} alt={product.title} width={560} />
        {gallery.length > 1 && (
          <div className="detail-strip">
            {gallery.map((image, index) => (
              <motion.button
                key={image}
                type="button"
                className="gallery-pick"
                aria-current={image === shown}
                onClick={() => setPickedImage(image)}
                aria-label={`Show image ${index + 1} of ${product.title}`}
                {...lift}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              >
                <Thumb source={image} alt="" width={120} />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <div className="detail-body">
        <h3 className="display" tabIndex={-1} ref={headingRef}>
          {product.title}
        </h3>
        {product.tagline && <p className="detail-tagline">{product.tagline}</p>}
        {product.description && <p className="detail-description">{product.description}</p>}

        {product.features && product.features.length > 0 && (
          <>
            <h4 className="eyebrow">Features</h4>
            <ul className="spec-list">
              {product.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </>
        )}

        {product.specifications && product.specifications.length > 0 && (
          <>
            <h4 className="eyebrow">Specifications</h4>
            <ul className="spec-list">
              {product.specifications.map((specification) => (
                <li key={specification}>{specification}</li>
              ))}
            </ul>
          </>
        )}

        {colors.length > 0 && (
          <>
            <h4 className="eyebrow">Colour</h4>
            {/* For reference only: the colours the product comes in, not a
                control. Each dot still names its colour, for a screen reader
                and as a tooltip, since the fill alone would not survive
                greyscale or colour blindness. */}
            <ul className="swatches" aria-label={`Colours available for ${product.title}`}>
              {colors.map((color) => (
                <li key={color.hex} className="swatch" style={{ background: color.hex }} title={color.name}>
                  <span className="skip-link">{color.name}</span>
                </li>
              ))}
            </ul>
          </>
        )}

      </div>
    </motion.div>
  )
}
