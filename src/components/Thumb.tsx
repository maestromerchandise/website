import type { CSSProperties } from 'react'
import { imageSrcSet, imageUrl } from '../lib/img'
import { monogram, placeholderHue } from '../lib/placeholder'

type Props = {
  source?: string
  alt: string
  /** Rendered width in CSS pixels, used to pick the CDN transform size. */
  width: number
  className?: string
  /**
   * For an image on the first screen. It is fetched at once and ahead of the
   * rest, because the page's largest paint waits on it; a lazy image in view is
   * held back until layout and then queued at low priority. Everything below the
   * fold stays lazy.
   */
  priority?: boolean
}

/**
 * Product image, with generated artwork standing in until one is uploaded.
 *
 * The catalogue is being built before the photography exists, so a missing
 * asset renders as a deliberate tinted tile rather than a broken image. Setting
 * the image in Studio replaces it with no cleanup, since nothing was ever
 * stored for the placeholder.
 */
export function Thumb({ source, alt, width, className, priority = false }: Props) {
  const classes = className ? `thumb ${className}` : 'thumb'

  if (!source) {
    return (
      <div
        className={`${classes} thumb-placeholder`}
        role="img"
        aria-label={`${alt}, photograph pending`}
        style={{ '--placeholder-hue': placeholderHue(alt) } as CSSProperties}
      >
        <span className="thumb-mark" aria-hidden="true">
          {monogram(alt)}
        </span>
        <span className="thumb-empty" aria-hidden="true">
          Photograph pending
        </span>
      </div>
    )
  }

  return (
    <div className={classes}>
      <img
        src={imageUrl(source, width)}
        srcSet={imageSrcSet(source, width)}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
      />
    </div>
  )
}
