import { imageUrl } from '../lib/img'
import type { SiteSettings } from '../lib/sanity'

/** The wordmark that ships with the site, shown until a logo is uploaded in Studio. */
const BUILT_IN = { src: '/logo-600.png', width: 600, height: 90 }

/**
 * Tall enough to stay sharp at four times the header's logo height, which is the
 * larger of the two places the logo appears.
 */
const HEIGHT = 90

type Props = {
  settings: SiteSettings | null | undefined
  className?: string
}

/**
 * The site logo: the one uploaded under Site Settings, or the built-in wordmark.
 *
 * The stylesheet sets the rendered height. The width and height attributes carry
 * the file's own proportions, so the space is reserved before it downloads, and
 * the CDN is asked for a copy sized to that height rather than the original.
 */
export function Logo({ settings, className }: Props) {
  const alt = settings?.siteName ?? 'Maestro'

  if (!settings?.logo) return <img className={className} {...BUILT_IN} alt={alt} />

  const width = Math.round(HEIGHT * (settings.logoAspectRatio ?? BUILT_IN.width / BUILT_IN.height))
  return (
    <img
      className={className}
      src={imageUrl(settings.logo, width)}
      alt={alt}
      width={width}
      height={HEIGHT}
    />
  )
}
