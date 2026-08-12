import { imageSrcSet, imageUrl } from '../lib/img'

type Props = {
  source?: string
  alt: string
  /** Rendered width in CSS pixels, used to pick the CDN transform size. */
  width: number
  className?: string
}

/**
 * Product image with a neutral placeholder.
 *
 * The catalogue is being built before the photography exists, so a missing
 * asset has to render as a deliberate empty tile rather than a broken image.
 */
export function Thumb({ source, alt, width, className }: Props) {
  const classes = className ? `thumb ${className}` : 'thumb'

  if (!source) {
    return (
      <div className={classes} role="img" aria-label={`${alt} (image pending)`}>
        <span className="thumb-empty" aria-hidden="true">
          Image pending
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
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}
