import { useEffect, useRef, useState } from 'react'
import { EVENTS, track } from '../lib/analytics'
import { galleryImages, shownImage } from '../lib/gallery'
import type { Product, SiteSettings } from '../lib/sanity'
import { whatsappProductLink } from '../lib/whatsapp'
import { Thumb } from './Thumb'

type Props = {
  product: Product
  settings: SiteSettings | null | undefined
  onClose: () => void
}

/**
 * Product detail, opened inside the page rather than over it.
 *
 * The panel expands in the flow of the grid it was opened from, so the page
 * keeps scrolling as one document and nothing is hidden behind an overlay.
 *
 * Picking a colour swaps the photograph when the CMS carries one for that
 * colour, which is what makes the swatches a way of seeing the product rather
 * than a legend printed beside it.
 */
export function ProductDetail({ product, settings, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [activeColor, setActiveColor] = useState<string>()
  const [pickedImage, setPickedImage] = useState<string>()

  const colors = product.colors ?? []
  const gallery = galleryImages(product)
  const shown = shownImage(product, activeColor, pickedImage)

  const whatsapp = whatsappProductLink(settings, product.title)

  // The panel opens where the product is, and the page stays put. Scrolling to
  // it would move the catalogue out from under the tile that was just clicked,
  // which is the one thing an in-page detail is meant to avoid.
  //
  // Focus still moves to the heading, because a keyboard or screen reader user
  // has to be told the panel appeared. `preventScroll` is what keeps that from
  // scrolling the page as a side effect.
  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>('h3')?.focus({ preventScroll: true })
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
    <div className="product-detail" ref={panelRef}>
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
              <button
                key={image}
                type="button"
                className="gallery-pick"
                aria-current={image === shown}
                onClick={() => {
                  setPickedImage(image)
                  // A gallery choice overrides the colour photograph, or the two
                  // controls would fight over the same picture.
                  setActiveColor(undefined)
                }}
                aria-label={`Show image ${index + 1} of ${product.title}`}
              >
                <Thumb source={image} alt="" width={120} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="detail-body">
        <h3 className="display" tabIndex={-1}>
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
            <h4 className="eyebrow">
              Colour
              {activeColor && (
                <span className="colour-name">
                  {colors.find((color) => color.hex === activeColor)?.name}
                </span>
              )}
            </h4>
            <ul className="swatches">
              {colors.map((color) => (
                <li key={color.hex}>
                  <button
                    type="button"
                    className="swatch"
                    style={{ background: color.hex }}
                    aria-pressed={color.hex === activeColor}
                    onClick={() => {
                      setActiveColor(color.hex === activeColor ? undefined : color.hex)
                      setPickedImage(undefined)
                    }}
                  >
                    {/* The name carries the meaning; the fill alone would not
                        survive greyscale or colour blindness. */}
                    <span className="skip-link">{color.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {whatsapp && (
          <div className="detail-actions">
            <a
              className="button"
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                track(EVENTS.whatsappClick, { location: 'product_detail', product: product.title })
              }
            >
              Ask about this on WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
