import type { SiteSettings } from './sanity'

/**
 * WhatsApp links, built from the number and templates set in Sanity.
 *
 * WhatsApp is the primary conversion channel, so every CTA on the site routes
 * through here rather than hardcoding a wa.me address in a component.
 */

const DEFAULT_MESSAGE = 'Hello Maestro, I would like to ask about your merchandise.'
const DEFAULT_PRODUCT_MESSAGE = 'Hello Maestro, I would like to ask about {product}.'

/**
 * `wa.me` needs digits only: no plus, no spaces, no leading zero. A number
 * typed as `+62 812-3456` still works because everything else is stripped here,
 * but a local `0812` form cannot be repaired without knowing the country.
 */
function normaliseNumber(raw: string | undefined): string | undefined {
  const digits = raw?.replace(/\D/g, '')
  if (!digits) return undefined
  return digits.replace(/^0+/, '') || undefined
}

/**
 * Build a wa.me link, or undefined when no number is configured, so a caller
 * can drop the button entirely rather than render one that goes nowhere.
 */
export function whatsappLink(settings: SiteSettings | null | undefined, message?: string): string | undefined {
  const number = normaliseNumber(settings?.whatsappNumber)
  if (!number) return undefined

  const text = message ?? settings?.whatsappDefaultMessage ?? DEFAULT_MESSAGE
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}

/** The same link, with the product name filled into the configured template. */
export function whatsappProductLink(
  settings: SiteSettings | null | undefined,
  productTitle: string,
): string | undefined {
  const template = settings?.whatsappProductMessage ?? DEFAULT_PRODUCT_MESSAGE
  return whatsappLink(settings, template.replace('{product}', productTitle))
}
