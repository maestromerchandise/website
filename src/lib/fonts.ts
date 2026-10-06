/**
 * Put the font stylesheet into play.
 *
 * The HTML marks it `media="print"`, so it blocks neither the first paint nor the
 * scripts that follow it, and switching the media here is what applies it. This
 * runs from module code rather than an `onload` attribute on the link, because
 * the content security policy allows no inline script of any kind, an event
 * handler attribute included.
 */
export function applyFontStylesheet(): void {
  for (const link of document.querySelectorAll<HTMLLinkElement>('link[data-font]')) {
    link.media = 'all'
  }
}
