import { useEffect, useState } from 'react'
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
import { scrollToSection } from './lib/scroll'
import { applySeo } from './lib/seo'
import { useSiteContent } from './lib/useSiteContent'
import { whatsappLink } from './lib/whatsapp'

function matches(product: Product, query: string): boolean {
  const haystack = [product.title, product.tagline, product.description].join(' ').toLowerCase()
  return haystack.includes(query.toLowerCase())
}

export default function App() {
  const { content, error, isLoading } = useSiteContent()
  const [selected, setSelected] = useState<Product>()
  const [query, setQuery] = useState('')

  const settings = content?.settings
  const homepage = content?.homepage
  const all = content?.products ?? []
  const categories = content?.categories?.length ? content.categories : FALLBACK_CATEGORIES

  useEffect(() => {
    initAnalytics('Home')
  }, [])

  useEffect(() => {
    if (content) applySeo(homepage?.seo, settings, '/')
  }, [content, homepage, settings])

  const products = all.filter((product) => !query || matches(product, query))
  const readyMade = products.filter((product) => product.readyMade)
  const boxes = products.filter((product) => product.category === 'box')
  const generalWhatsapp = whatsappLink(settings)
  const isSearching = query.trim().length > 0

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

  function openProduct(product: Product, location: 'category' | 'ready_made' | 'custom_box') {
    setSelected(product)
    track(location === 'ready_made' ? EVENTS.readyMadeOpen : EVENTS.productOpen, {
      product: product.title,
      location,
    })
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header settings={settings} search={{ value: query, onChange: setQuery }} />

      <main id="main">
        <div className="tagline">
          <p className="eyebrow">{homepage?.heroTitle ?? 'Modern merchandising. Responsible impact'}</p>
          <p className="eyebrow tagline-sub">
            {homepage?.heroSubtitle ?? 'Premium corporate & sustainable branding solutions'}
          </p>
        </div>

        {isLoading && <p className="notice">Loading catalogue</p>}
        {error && <p className="notice">The catalogue could not be loaded. Please refresh the page.</p>}

        <CategoryStrip categories={categories} products={all} />

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
                  settings={settings}
                  selected={selected}
                  onSelect={(product) => openProduct(product, 'category')}
                  onClose={() => setSelected(undefined)}
                />
              </Section>
            )
          })}
        </div>

        {readyMade.length > 0 && (
          <Section id="ready-made" heading={homepage?.readyMadeSection?.heading ?? 'Ready-Made'}>
            <ProductGrid
              products={readyMade}
              settings={settings}
              selected={selected}
              onSelect={(product) => openProduct(product, 'ready_made')}
              onClose={() => setSelected(undefined)}
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
            settings={settings}
            selected={selected}
            onSelect={(product) => openProduct(product, 'custom_box')}
            onClose={() => setSelected(undefined)}
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
