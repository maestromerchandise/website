import { useState } from 'react'
import { CategoryStrip } from './components/CategoryStrip'
import { ChatWidget } from './components/ChatWidget'
import { ContactForm } from './components/ContactForm'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { LogoMarquee } from './components/LogoMarquee'
import { ProductGrid } from './components/ProductGrid'
import { ProductModal } from './components/ProductModal'
import { CATEGORIES, type Product } from './lib/sanity'
import { useSiteContent } from './lib/useSiteContent'

const CUSTOM_COPY =
  'Elevate your brand through bespoke merchandise and refined gifting solutions. ' +
  'Contact us to discuss your requirements and explore limitless customisation possibilities.'

function matches(product: Product, query: string): boolean {
  const haystack = [product.title, product.tagline, product.description].join(' ').toLowerCase()
  return haystack.includes(query.toLowerCase())
}

export default function App() {
  const { content, error, isLoading } = useSiteContent()
  const [selected, setSelected] = useState<Product>()
  const [query, setQuery] = useState('')

  const homepage = content?.homepage
  const products = (content?.products ?? []).filter((product) => !query || matches(product, query))
  const readyMade = products.filter((product) => product.readyMade)
  const whatsapp = homepage?.contact?.whatsapp

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header search={{ value: query, onChange: setQuery }} />

      <main id="main">
        <div className="tagline">
          <p className="eyebrow">{homepage?.heroTitle ?? 'Modern merchandising. Responsible impact'}</p>
          <p className="eyebrow">
            {homepage?.heroSubtitle ?? 'Premium corporate & sustainable branding solutions'}
          </p>
        </div>

        {isLoading && <p className="notice">Loading catalogue</p>}
        {error && <p className="notice">The catalogue could not be loaded. Please refresh the page.</p>}

        <CategoryStrip products={content?.products ?? []} />

        {homepage?.clientLogos && homepage.clientLogos.length > 0 && (
          <section className="section">
            <div className="shell section-heading">
              <h2 className="eyebrow">Our satisfied clients</h2>
            </div>
            <div className="shell">
              <LogoMarquee logos={homepage.clientLogos} />
            </div>
          </section>
        )}

        {CATEGORIES.map((category) => {
          const inCategory = products.filter((product) => product.category === category.id)
          if (inCategory.length === 0) return null
          return (
            <section key={category.id} id={category.id} className="section shell">
              <div className="section-heading">
                <h2 className="eyebrow">{category.label}</h2>
              </div>
              <ProductGrid products={inCategory} onSelect={setSelected} />
            </section>
          )
        })}

        {readyMade.length > 0 && (
          <section id="ready-made" className="section shell">
            <div className="section-heading">
              <h2 className="eyebrow">Ready-Made</h2>
            </div>
            <ProductGrid products={readyMade} onSelect={setSelected} />
          </section>
        )}

        <section id="custom-gift" className="section">
          <div className="shell section-heading">
            <h2 className="eyebrow">Custom Gift</h2>
          </div>
          <CategoryStrip products={content?.products ?? []} />
          <div className="shell section-heading">
            <p>{CUSTOM_COPY}</p>
            {whatsapp && (
              <a className="button" href={whatsapp} target="_blank" rel="noreferrer">
                Discuss on WhatsApp
              </a>
            )}
          </div>
        </section>

        <section id="custom-box" className="section shell">
          <div className="section-heading">
            <h2 className="eyebrow">Custom Box</h2>
          </div>
          <ProductGrid
            products={products.filter((product) => product.category === 'box')}
            onSelect={setSelected}
          />
          <div className="section-heading" style={{ marginTop: '2.5rem' }}>
            <p>{CUSTOM_COPY}</p>
            {whatsapp && (
              <a className="button" href={whatsapp} target="_blank" rel="noreferrer">
                Discuss on WhatsApp
              </a>
            )}
          </div>
        </section>

        <section id="contact" className="section shell">
          <div className="section-heading">
            <h2 className="eyebrow">Get in touch</h2>
          </div>
          <div className="contact">
            <ContactForm />
            <div>
              {homepage?.contact?.address && <p>{homepage.contact.address}</p>}
              {homepage?.contact?.email && (
                <p>
                  <a href={`mailto:${homepage.contact.email}`}>{homepage.contact.email}</a>
                </p>
              )}
              {whatsapp && (
                <a className="button button-ghost" href={whatsapp} target="_blank" rel="noreferrer">
                  Message us on WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer contact={homepage?.contact} />
      <ChatWidget faq={homepage?.faq ?? []} />

      {selected && <ProductModal product={selected} onClose={() => setSelected(undefined)} />}
    </>
  )
}
