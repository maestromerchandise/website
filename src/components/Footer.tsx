import { EVENTS, track } from '../lib/analytics'
import type { SiteSettings } from '../lib/sanity'
import { whatsappLink } from '../lib/whatsapp'
import { Logo } from './Logo'

/** Icon paths are inline so the footer costs no extra request. */
const ICONS = {
  instagram:
    'M12 2.2c3.2 0 3.6 0 4.8.07 1.2.05 1.8.25 2.2.42.6.22 1 .48 1.4.9.4.4.68.8.9 1.4.17.4.37 1 .42 2.2.06 1.2.07 1.6.07 4.8s0 3.6-.07 4.8c-.05 1.2-.25 1.8-.42 2.2-.22.6-.5 1-.9 1.4-.4.4-.8.68-1.4.9-.4.17-1 .37-2.2.42-1.2.06-1.6.07-4.8.07s-3.6 0-4.8-.07c-1.2-.05-1.8-.25-2.2-.42-.6-.22-1-.5-1.4-.9-.4-.4-.68-.8-.9-1.4-.17-.4-.37-1-.42-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.8c.05-1.2.25-1.8.42-2.2.22-.6.5-1 .9-1.4.4-.42.8-.68 1.4-.9.4-.17 1-.37 2.2-.42C8.4 2.2 8.8 2.2 12 2.2zm0 3.05A6.75 6.75 0 1 0 18.75 12 6.75 6.75 0 0 0 12 5.25zm0 11.13A4.38 4.38 0 1 1 16.38 12 4.38 4.38 0 0 1 12 16.38zm6.98-11.4a1.58 1.58 0 1 1-1.58-1.57 1.58 1.58 0 0 1 1.58 1.57z',
  tiktok:
    'M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.1v12.4a2.59 2.59 0 1 1-2.6-2.6c.27 0 .52.05.76.13v-3.16a5.71 5.71 0 0 0-.76-.05 5.7 5.7 0 1 0 5.7 5.7V9.4a7.35 7.35 0 0 0 4.3 1.38V7.68a4.28 4.28 0 0 1-3.24-1.86z',
  whatsapp:
    'M12.04 2a9.9 9.9 0 0 0-8.5 14.94L2 22l5.2-1.5A9.9 9.9 0 1 0 12.04 2zm0 1.8a8.1 8.1 0 1 1-4.1 15.1l-.3-.18-3.1.9.9-3-.2-.3A8.1 8.1 0 0 1 12.04 3.8zm4.65 10.2c-.25-.13-1.47-.72-1.7-.8-.23-.09-.4-.13-.56.12s-.64.8-.79.97c-.14.16-.29.19-.54.06a6.63 6.63 0 0 1-3.32-2.9c-.25-.43.25-.4.71-1.33.08-.16.04-.3-.02-.42-.06-.13-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.42.06-.64.3-.22.25-.85.83-.85 2.02s.87 2.34 1 2.5c.12.17 1.71 2.61 4.15 3.66 1.55.67 2.15.73 2.92.61.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.15-1.18-.07-.1-.23-.17-.48-.29z',
  maps: 'M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z',
}

export function Footer({ settings }: { settings: SiteSettings | null | undefined }) {
  const contact = settings?.contact
  const siteName = settings?.siteName ?? 'Maestro'

  const links = [
    { key: 'instagram', label: 'Instagram', href: contact?.instagram },
    { key: 'tiktok', label: 'TikTok', href: contact?.tiktok },
    { key: 'whatsapp', label: 'WhatsApp', href: whatsappLink(settings) },
    { key: 'maps', label: 'Find us', href: contact?.mapsUrl },
  ] as const

  return (
    <footer className="footer">
      <div className="shell">
        <div className="social">
          {links
            .filter((link) => link.href)
            .map((link) => (
              <a
                key={link.key}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={link.label}
                onClick={() => {
                  if (link.key === 'whatsapp') track(EVENTS.whatsappClick, { location: 'footer' })
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={ICONS[link.key]} />
                </svg>
              </a>
            ))}
        </div>
        <Logo settings={settings} className="footer-logo" />
        <p className="eyebrow copyright">
          {/* Read at render, so the year is right without anyone remembering it. */}
          <span>{`© ${new Date().getFullYear()} ${siteName}`}</span>
          <span aria-hidden="true">|</span>
          <span>All rights reserved</span>
        </p>
      </div>
    </footer>
  )
}
