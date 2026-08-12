import { EVENTS, track } from '../lib/analytics'
import type { SiteSettings } from '../lib/sanity'
import { whatsappLink } from '../lib/whatsapp'

/**
 * Floating WhatsApp button, the site's primary conversion channel.
 *
 * Sits in the same fixed stack as the FAQ widget rather than its own corner, so
 * the two can never overlap at any width. Rendered only when a number is
 * configured in Sanity.
 */
export function WhatsAppButton({ settings }: { settings: SiteSettings | null | undefined }) {
  const href = whatsappLink(settings)
  if (!href) return null

  return (
    <a
      className="whatsapp-fab"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Message us on WhatsApp"
      onClick={() => track(EVENTS.whatsappClick, { location: 'floating_button' })}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.94L2 22l5.2-1.5A9.9 9.9 0 1 0 12.04 2zm0 1.8a8.1 8.1 0 1 1-4.1 15.1l-.3-.18-3.1.9.9-3-.2-.3A8.1 8.1 0 0 1 12.04 3.8zm4.65 10.2c-.25-.13-1.47-.72-1.7-.8-.23-.09-.4-.13-.56.12s-.64.8-.79.97c-.14.16-.29.19-.54.06a6.63 6.63 0 0 1-3.32-2.9c-.25-.43.25-.4.71-1.33.08-.16.04-.3-.02-.42-.06-.13-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.42.06-.64.3-.22.25-.85.83-.85 2.02s.87 2.34 1 2.5c.12.17 1.71 2.61 4.15 3.66 1.55.67 2.15.73 2.92.61.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.15-1.18-.07-.1-.23-.17-.48-.29z" />
      </svg>
    </a>
  )
}
