import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { CategoryStrip } from './components/CategoryStrip'
import { ChatWidget } from './components/ChatWidget'
import { ContactForm } from './components/ContactForm'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { LogoMarquee } from './components/LogoMarquee'
import { ProductGrid } from './components/ProductGrid'
import { Section } from './components/Section'
import { WhatsAppButton } from './components/WhatsAppButton'
import { EVENTS, initAnalytics, track } from './lib/analytics'
import { FALLBACK_CATEGORIES, hasOwnSection } from './lib/categories'
import type { Product } from './lib/sanity'
import { prefersReducedMotion, scrollToSection } from './lib/scroll'
import { applySeo } from './lib/seo'
import { useSiteContent } from './lib/useSiteContent'
import { whatsappLink } from './lib/whatsapp'

function matches(product: Product, query: string): boolean {
  const haystack = [product.title, product.tagline, product.description].join(' ').toLowerCase()
  return haystack.includes(query.toLowerCase())
}

export default function App() {
  const { content, error, isLoading } = useSiteContent()
  /**
   * The products open in each grid, oldest first.
   *
   * Every grid starts empty, so a visitor arrives to the catalogue itself and a
   * detail appears only once they pick a tile. Held per grid rather than once for
   * the page, so a product listed in both its category and Ready-Made opens only
   * where it was clicked. Two at most, one for each half of a row; the grid works
   * out which of them share the row that is open.
   */
  const [openByGrid, setOpenByGrid] = useState<Record<string, Product[]>>({})
  const [query, setQuery] = useState('')

  const settings = content?.settings
  const homepage = content?.homepage
  const all = content?.products ?? []
  const categories = content?.categories?.length ? content.categories : FALLBACK_CATEGORIES

  useEffect(() => {
    initAnalytics(settings?.gaMeasurementId, 'Home')
  }, [settings?.gaMeasurementId])

  useEffect(() => {
    if (content) applySeo(homepage?.seo, settings, '/')
  }, [content, homepage, settings])

  const products = all.filter((product) => !query || matches(product, query))
  const readyMade = products.filter((product) => product.readyMade)
  const boxes = products.filter((product) => product.category === 'box')

  const generalWhatsapp = whatsappLink(settings)
  const isSearching = query.trim().length > 0

  /**
   * Products whose name matches the query, for the list under the search field.
   * A name that starts with the query ranks above one that only contains it, so
   * typing "pad" puts "Padel Racket" first.
   */
  const needle = query.trim().toLowerCase()
  const suggestions = needle
    ? all
        .filter((product) => product.title.toLowerCase().includes(needle))
        .sort(
          (a, b) =>
            Number(b.title.toLowerCase().startsWith(needle)) -
            Number(a.title.toLowerCase().startsWith(needle)),
        )
        .slice(0, 6)
    : []

  /** Shared by Custom Gift and Custom Box, which offer the same two actions. */
  const customCta = (event: typeof EVENTS.customGiftCta | typeof EVENTS.customBoxCta) => (
    <div className="custom-cta">
      <button
        type="button"
        className="button"
        onClick={() => {
          track(event, { action: 'contact' })
          scrollToSection('/#contact')
        }}
      >
        Discuss your project
      </button>
      {generalWhatsapp && (
        <a
          className="button button-ghost"
          href={generalWhatsapp}
          target="_blank"
          rel="noreferrer"
          onClick={() => track(EVENTS.whatsappClick, { location: event })}
        >
          Message us on WhatsApp
        </a>
      )}
    </div>
  )

  function closeProduct(gridId: string, product: Product) {
    setOpenByGrid((current) => ({
      ...current,
      [gridId]: (current[gridId] ?? []).filter((open) => open.id !== product.id),
    }))
  }

  function openProduct(
    product: Product,
    location: 'category' | 'ready_made' | 'custom_box',
    gridId: string,
  ) {
    // Newest last, and a product already open moves to the end rather than
    // appearing twice.
    setOpenByGrid((current) => ({
      ...current,
      [gridId]: [...(current[gridId] ?? []).filter((open) => open.id !== product.id), product].slice(-2),
    }))
    track(location === 'ready_made' ? EVENTS.readyMadeOpen : EVENTS.productOpen, {
      product: product.title,
      location,
    })
  }

  /**
   * Take the visitor from a suggestion to the product itself: clear the search
   * so the whole catalogue is back, open the product in the grid it lives in,
   * then bring its tile into view.
   *
   * flushSync commits both updates before the tile is looked up, so the scroll
   * lands where the tile finally sits, with its panel already inserted beneath
   * it, rather than where it was in the filtered page a frame earlier.
   */
  function jumpToProduct(product: Product) {
    const category = categories.find((candidate) => candidate.id === product.category)
    // Boxes have no section of their own; their category points at Custom Box.
    const gridId = category && !hasOwnSection(category) ? category.anchor : product.category
    flushSync(() => {
      setQuery('')
      openProduct(product, gridId === 'custom-box' ? 'custom_box' : 'category', gridId)
    })
    const tile = document.querySelector<HTMLElement>(
      `#${CSS.escape(gridId)} [data-product="${CSS.escape(product.id)}"]`,
    )
    tile?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
    tile?.focus({ preventScroll: true })
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header
        settings={settings}
        search={{ value: query, onChange: setQuery, suggestions, onPick: jumpToProduct }}
      />

      {/* Busy until the content request returns. The stylesheet holds back
          everything that depends on it meanwhile, so the page does not lay out a
          first version and then shove it down the screen when the catalogue lands. */}
      <main id="main" aria-busy={isLoading}>
        <div className="tagline">
          <p className="eyebrow">{homepage?.heroTitle ?? 'Modern merchandising. Responsible impact'}</p>
          <p className="eyebrow tagline-sub">
            {homepage?.heroSubtitle ?? 'Premium corporate & sustainable branding solutions'}
          </p>
        </div>

        {isLoading && <p className="notice">Loading catalogue</p>}
        {error && <p className="notice">The catalogue could not be loaded. Please refresh the page.</p>}

        <CategoryStrip categories={categories} products={all} priority />

        {homepage?.clientLogos && homepage.clientLogos.length > 0 && (
          <Section heading={homepage.clientsSection?.heading ?? 'Our satisfied clients'} bleed>
            <LogoMarquee logos={homepage.clientLogos} />
          </Section>
        )}

        {isSearching && products.length === 0 && <p className="notice">No products match that search.</p>}

        <div id="products">
          {categories.filter(hasOwnSection).map((category) => {
            const inCategory = products.filter((product) => product.category === category.id)
            if (inCategory.length === 0) return null
            return (
              <Section key={category.id} id={category.id} heading={category.label}>
                <ProductGrid
                  products={inCategory}
                  open={openByGrid[category.id] ?? []}
                  onOpen={(product) => openProduct(product, 'category', category.id)}
                  onClose={(product) => closeProduct(category.id, product)}
                />
              </Section>
            )
          })}
        </div>

        {readyMade.length > 0 && (
          <Section id="ready-made" heading={homepage?.readyMadeSection?.heading ?? 'Ready-Made'}>
            <ProductGrid
              products={readyMade}
              open={openByGrid['ready-made'] ?? []}
              onOpen={(product) => openProduct(product, 'ready_made', 'ready-made')}
              onClose={(product) => closeProduct('ready-made', product)}
            />
          </Section>
        )}

        <Section
          id="custom-gift"
          heading={homepage?.customGiftSection?.heading ?? 'Custom Gift'}
          intro={homepage?.customGiftSection?.intro}
          bleed
        >
          <CategoryStrip categories={categories} products={all} hideEmpty />
          <div className="shell">{customCta(EVENTS.customGiftCta)}</div>
        </Section>

        <Section
          id="custom-box"
          heading={homepage?.customBoxSection?.heading ?? 'Custom Box'}
          intro={homepage?.customBoxSection?.intro}
        >
          <ProductGrid
            products={boxes}
            open={openByGrid['custom-box'] ?? []}
            onOpen={(product) => openProduct(product, 'custom_box', 'custom-box')}
            onClose={(product) => closeProduct('custom-box', product)}
          />
          {customCta(EVENTS.customBoxCta)}
        </Section>

        <Section id="contact" heading={homepage?.contactSection?.heading ?? 'Get in touch'}>
          <div className="contact">
            <div className="contact-lead">
              <p className="display">
                {homepage?.contactLead?.title ?? 'We do more than create merchandise'}
              </p>
              <p className="eyebrow">{homepage?.contactLead?.subtitle ?? 'End to end service'}</p>
            </div>

            <ContactForm settings={settings} />
          </div>
        </Section>
      </main>

      <Footer settings={settings} />
      <div className="floating-stack">
        <WhatsAppButton settings={settings} />
        <ChatWidget faq={homepage?.faq ?? []} />
      </div>

    </>
  )
}
