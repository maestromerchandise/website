/**
 * Anchor navigation shared by the header, the category strip and every CTA.
 *
 * The home page is one long document, so every in-page link is a hash. On the
 * About page the same link has to leave the route, which is why the target is
 * written as a full `/#id` path and only intercepted when the document already
 * holds that section.
 */

/** Matches `/#ready-made`, `#ready-made` and `#contact`, capturing the id. */
const HASH_LINK = /^\/?#(.+)$/

/**
 * Scroll to a section, or fall back to normal navigation.
 *
 * Returns true when the scroll was handled here, so a caller can suppress its
 * own click default. Returns false when the section is not on this page, which
 * leaves the browser to follow the href to the home route.
 */
export function scrollToSection(href: string): boolean {
  const id = HASH_LINK.exec(href)?.[1]
  if (!id) return false

  const target = document.getElementById(id)
  if (!target) return false

  // `scroll-margin-top` on the section handles the sticky header offset, so the
  // browser's own smooth behaviour is enough and no offset maths is needed here.
  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })

  // Keep the hash in the URL so the section is linkable and the back button
  // still steps through the page, per the vault's refresh rules.
  history.replaceState(null, '', `#${id}`)
  return true
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
