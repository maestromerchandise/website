import { useEffect } from 'react'
import { ChatWidget } from './components/ChatWidget'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Thumb } from './components/Thumb'
import { WhatsAppButton } from './components/WhatsAppButton'
import { initAnalytics } from './lib/analytics'
import type { TitledEntry } from './lib/sanity'
import { applySeo } from './lib/seo'
import { useSiteContent } from './lib/useSiteContent'

function EntryList({ heading, entries }: { heading: string; entries: TitledEntry[] }) {
  if (entries.length === 0) return null
  return (
    <section className="about-block">
      <h2 className="eyebrow">{heading}</h2>
      <div className="about-list">
        {entries.map((entry) => (
          <div key={entry.title}>
            <h3>{entry.title}</h3>
            <p>{entry.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function About() {
  const { content, error, isLoading } = useSiteContent()
  const settings = content?.settings
  const about = content?.about

  useEffect(() => {
    initAnalytics('About')
  }, [])

  useEffect(() => {
    if (content) applySeo(about?.seo, settings, '/about/')
  }, [content, about, settings])

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header settings={settings} />

      <main id="main" className="shell section">
        {isLoading && <p className="notice">Loading</p>}
        {error && <p className="notice">This page could not be loaded. Please refresh.</p>}

        <section className="about-block">
          <h1 className="eyebrow">{about?.heading ?? 'About Us'}</h1>
          <div>
            {about?.body?.split('\n\n').map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {about?.image && <Thumb source={about.image} alt="Maestro" width={640} />}
          </div>
        </section>

        <EntryList heading="Why Choose Us" entries={about?.whyChooseUs ?? []} />
        <EntryList heading="Our Service" entries={about?.services ?? []} />
      </main>

      <Footer settings={settings} />
      <div className="floating-stack">
        <WhatsAppButton settings={settings} />
        <ChatWidget faq={content?.homepage?.faq ?? []} />
      </div>
    </>
  )
}
