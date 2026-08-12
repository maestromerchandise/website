type Props = {
  /** Omitted on the About page, where there are no product sections to filter. */
  search?: {
    value: string
    onChange: (value: string) => void
  }
}

const NAV = [
  { href: '/about/', label: 'About Us' },
  { href: '/#ready-made', label: 'Ready-Made' },
  { href: '/#custom-gift', label: 'Custom Gift' },
  { href: '/#custom-box', label: 'Custom Box' },
]

export function Header({ search }: Props) {
  return (
    <>
      <div className="masthead">www.maestro.com</div>
      <header className="header">
        <div className="shell header-bar">
          <nav className="header-nav" aria-label="Primary">
            {NAV.map((item) => (
              <a key={item.href} className="eyebrow" href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <a className="logo" href="/">
            Maestro
          </a>

          <div className="header-tools">
            {search && (
              <input
                className="search-field"
                type="search"
                value={search.value}
                onChange={(event) => search.onChange(event.target.value)}
                placeholder="Search products"
                aria-label="Search products"
              />
            )}
          </div>
        </div>
      </header>
    </>
  )
}
