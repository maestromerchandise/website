import { externalUrl } from './url.ts'

/**
 * Sanity image URL helpers.
 *
 * Sanity's asset CDN resizes and re-encodes on request, free and unlimited on
 * every plan, so originals are uploaded untouched and shrunk at delivery. An
 * 800px WebP of a product shot on white lands around 30-60KB, which is what
 * keeps the page light without a second CDN in front.
 *
 * Every address here arrives from the CMS, so it is scheme checked before it
 * reaches an `src`. An unusable one returns empty, and the caller shows its
 * placeholder rather than a link a browser would follow.
 */

/** Quality 75 is the point where WebP artefacts stop being visible on product photography. */
const QUALITY = 75

/**
 * Build a transformed URL for a Sanity asset.
 *
 * `auto=format` lets the CDN pick AVIF or WebP from the browser's Accept header,
 * which beats pinning `fm=webp` for browsers that support something better.
 */
export function imageUrl(source: string | undefined, width: number): string {
  const safe = externalUrl(source)
  if (!safe) return ''
  const params = new URLSearchParams({
    w: String(Math.round(width)),
    q: String(QUALITY),
    fit: 'max',
    auto: 'format',
  })
  return `${safe}?${params}`
}

/** Matching 1x and 2x candidates, so the image stays sharp on a retina screen. */
export function imageSrcSet(source: string | undefined, width: number): string | undefined {
  if (!imageUrl(source, width)) return undefined
  return `${imageUrl(source, width)} 1x, ${imageUrl(source, width * 2)} 2x`
}
