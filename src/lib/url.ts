/**
 * Scheme checks for addresses that arrive from the CMS.
 *
 * Everything the site renders into an `href` or a `src` is written by an editor
 * in Studio, which makes it data from outside this codebase rather than a
 * literal. A link saved as `javascript:...` runs as script the moment a visitor
 * clicks it, so the scheme is checked here instead of trusting the field type in
 * the schema, which only guards what the Studio form writes.
 *
 * Both return undefined for anything they do not recognise, so a caller drops
 * the link rather than rendering one that cannot be trusted.
 *
 * The lib modules the test suite loads import this one with its `.ts` extension.
 * Node runs those tests by stripping the types, which erases a type-only import
 * but leaves a value import to resolve, and it does not resolve an extensionless
 * path the way Vite does.
 */

/** An address somewhere else: a social profile, a map, an image on a CDN. */
export function externalUrl(value: string | undefined): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined
  } catch {
    return undefined
  }
}

/**
 * A place on this site: `/`, `/about/`, `/#ready-made`.
 *
 * A leading `//` is rejected along with every scheme, because `//evil.test` is a
 * protocol-relative address to another host rather than a path on this one.
 */
export function siteHref(value: string | undefined): string | undefined {
  if (!value) return undefined
  return value.startsWith('/') && !value.startsWith('//') ? value : undefined
}
