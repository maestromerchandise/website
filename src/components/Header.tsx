import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { EVENTS, track } from '../lib/analytics'
import type { SiteSettings } from '../lib/sanity'
import { scrollToSection } from '../lib/scroll'

type Props = {
  settings: SiteSettings | null | undefined
  /** Omitted on the About page, where there are no product sections to filter. */
  search?: {
    value: string
    onChange: (value: string) => void
  }
}

/**
 * Every nav target is an absolute path with a hash, so the same markup works on
 * both entry points: on the home page the click is intercepted and scrolled,
 * and on About the browser follows it back to `/` at that anchor.
 */
const FALLBACK_NAV = [
  { href: '/about/', label: 'About Us' },
  { href: '/#ready-made', label: 'Ready-Made' },
  { href: '/#custom-gift', label: 'Custom Gift' },
  { href: '/#custom-box', label: 'Custom Box' },
]

export function Header({ settings, search }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const nav = settings?.navigation?.length ? settings.navigation : FALLBACK_NAV

  // Escape closes the drawer and returns focus to the control that opened it,
  // which is the one keyboard path a hand-built menu usually drops.
  useEffect(() => {
    if (!isMenuOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setIsMenuOpen(false)
      toggleRef.current?.focus()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isMenuOpen])

  function handleNavClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (href.startsWith('/about')) track(EVENTS.aboutNavigate)
    if (scrollToSection(href)) {
      event.preventDefault()
      setIsMenuOpen(false)
    }
  }

  const links = nav.map((item) => (
    <a
      key={item.href}
      className="eyebrow nav-link"
      href={item.href}
      onClick={(event) => handleNavClick(event, item.href)}
    >
      {item.label}
    </a>
  ))

  return (
    <>
      <div className="masthead">{settings?.mastheadText ?? 'www.maestro.com'}</div>
      <header className="header">
        <div className="shell header-bar">
          <button
            ref={toggleRef}
            type="button"
            className="menu-toggle"
            aria-expanded={isMenuOpen}
            aria-controls="primary-nav"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              {isMenuOpen ? (
                <path
                  d="M5 5l14 14M19 5L5 19"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : (
                <path
                  d="M3 7h18M3 12h18M3 17h18"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  fill="none"
                />
              )}
            </svg>
          </button>

          <nav className="header-nav" aria-label="Primary">
            {links}
          </nav>

          <a className="logo" href="/" aria-label={`${settings?.siteName ?? 'Maestro'}, back to top`}>
            <img src="/logo.png" alt={settings?.siteName ?? 'Maestro'} width={2000} height={300} />
          </a>

          <div className="header-tools">
            {search && (
              <label className="search">
                <span className="skip-link">Search products</span>
                <svg
                  className="search-icon"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M16.5 16.5 21 21" strokeLinecap="round" />
                </svg>
                <input
                  className="search-field"
                  type="search"
                  value={search.value}
                  onChange={(event) => search.onChange(event.target.value)}
                  placeholder="Search"
                />
              </label>
            )}
          </div>
        </div>

        {/* Rendered at every width but only revealed under the mobile breakpoint,
            so the open state survives a resize rather than stranding the drawer. */}
        <div id="primary-nav" className="menu-drawer" data-open={isMenuOpen} hidden={!isMenuOpen}>
          <nav className="shell menu-drawer-nav" aria-label="Primary, mobile">
            {links}
          </nav>
        </div>
      </header>
    </>
  )
}
