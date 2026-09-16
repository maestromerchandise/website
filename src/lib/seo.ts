import type { Seo, SiteSettings } from './sanity'

/**
 * Apply CMS metadata to the document head.
 *
 * The HTML entry points ship a complete, correct set of tags, so a crawler that
 * does not run JavaScript still sees a titled, described page. This layer
 * overwrites those with the CMS values once content arrives, which is what lets
 * an administrator change a title without a deploy.
 */

/** A usable value, or undefined for anything blank. */
function text(value: Seo[keyof Seo]): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

/**
 * Fill from the page, then the global default, then whatever the HTML shipped.
 *
 * Each level is emptied before falling through, so a field an editor has
 * cleared inherits the default rather than blanking the tag. Testing the raw
 * values with `??` would stop at the empty string, which is the opposite of
 * what clearing a field is meant to do.
 */
export function resolve(
  page: Seo | undefined,
  defaults: Seo | undefined,
  key: keyof Seo,
): string | undefined {
  return text(page?.[key]) ?? text(defaults?.[key])
}

function setMeta(selector: string, attribute: 'name' | 'property', key: string, content: string): void {
  let tag = document.head.querySelector<HTMLMetaElement>(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attribute, key)
    document.head.appendChild(tag)
  }
  tag.content = content
}

function setLink(rel: string, href: string): HTMLLinkElement {
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!tag) {
    tag = document.createElement('link')
    tag.rel = rel
    document.head.appendChild(tag)
  }
  tag.href = href
  return tag
}

/**
 * Point the tab icon and the home screen icon at the favicon uploaded in Studio.
 *
 * Asked for as a PNG at a fixed size whatever was uploaded, because not every
 * browser shows a WebP or AVIF favicon. A crawler reads the icon from the HTML
 * without running this, so search results keep showing the built-in favicon.svg.
 */
function applyFavicon(source: string): void {
  const png = (size: number) => `${source}?w=${size}&h=${size}&fit=max&fm=png`
  setLink('icon', png(64)).type = 'image/png'
  setLink('apple-touch-icon', png(180))
}

/** Join the configured site address with this page's path. */
function canonicalFor(settings: SiteSettings | null | undefined, path: string): string | undefined {
  const base = settings?.siteUrl?.replace(/\/+$/, '')
  if (!base) return undefined
  return `${base}${path}`
}

export function applySeo(
  page: Seo | undefined,
  settings: SiteSettings | null | undefined,
  path: string,
): void {
  const defaults = settings?.defaultSeo

  const title = resolve(page, defaults, 'metaTitle')
  if (title) document.title = title

  const description = resolve(page, defaults, 'metaDescription')
  if (description) setMeta('meta[name="description"]', 'name', 'description', description)

  const ogTitle = resolve(page, defaults, 'ogTitle') ?? title
  if (ogTitle) setMeta('meta[property="og:title"]', 'property', 'og:title', ogTitle)

  const ogDescription = resolve(page, defaults, 'ogDescription') ?? description
  if (ogDescription) {
    setMeta('meta[property="og:description"]', 'property', 'og:description', ogDescription)
  }

  const ogImage = resolve(page, defaults, 'ogImage')
  if (ogImage) setMeta('meta[property="og:image"]', 'property', 'og:image', ogImage)

  const canonical = resolve(page, defaults, 'canonicalUrl') ?? canonicalFor(settings, path)
  if (canonical) {
    setLink('canonical', canonical)
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonical)
  }

  if (settings?.favicon) applyFavicon(settings.favicon)

  // Only ever added, never removed: a page marked noindex in the CMS must be
  // able to turn indexing off, but an absent flag means "leave the default".
  if (page?.noIndex ?? defaults?.noIndex) {
    setMeta('meta[name="robots"]', 'name', 'robots', 'noindex, nofollow')
  }
}
