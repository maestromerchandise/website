import { ChatWidget } from './components/ChatWidget'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Thumb } from './components/Thumb'
import type { TitledEntry } from './lib/sanity'
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
  const homepage = content?.homepage

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />

      <main id="main" className="shell section">
        {isLoading && <p className="notice">Loading</p>}
        {error && <p className="notice">This page could not be loaded. Please refresh.</p>}

        <section className="about-block">
          <h1 className="eyebrow">About Us</h1>
          <div>
            {homepage?.about?.split('\n\n').map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {homepage?.aboutImage && <Thumb source={homepage.aboutImage} alt="Maestro" width={640} />}
          </div>
        </section>

        <EntryList heading="Why Choose Us" entries={homepage?.whyChooseUs ?? []} />
        <EntryList heading="Our Service" entries={homepage?.services ?? []} />
      </main>

      <Footer contact={homepage?.contact} />
      <ChatWidget faq={homepage?.faq ?? []} />
    </>
  )
}
