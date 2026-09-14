import { motion, useReducedMotion } from 'motion/react'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { ChatWidget } from './components/ChatWidget'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Thumb } from './components/Thumb'
import { WhatsAppButton } from './components/WhatsAppButton'
import { initAnalytics } from './lib/analytics'
import type { TitledEntry } from './lib/sanity'
import { applySeo } from './lib/seo'
import { useSiteContent } from './lib/useSiteContent'

type BlockProps = {
  heading: string
  image?: string
  /** Even blocks put the picture on the left, odd ones on the right. */
  index: number
  children: ReactNode
}

/**
 * One About section: a picture beside its copy.
 *
 * The sides alternate down the page, so the eye is handed from one block to the
 * next instead of running down a single straight column.
 */
function AboutBlock({ heading, image, index, children }: BlockProps) {
  const prefersReducedMotion = useReducedMotion()
  const isFlipped = index % 2 === 1

  return (
    <motion.section
      className="about-block"
      data-flip={isFlipped || undefined}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="about-media">
        {/* The opening picture is on the first screen, and is the page's largest paint. */}
        <Thumb source={image} alt={heading} width={640} priority={index === 0} />
      </div>
      <div className="about-body">
        {/* The page needs exactly one h1, and it belongs to the opening block. */}
        {index === 0 ? (
          <h1 className="eyebrow">{heading}</h1>
        ) : (
          <h2 className="eyebrow">{heading}</h2>
        )}
        {children}
      </div>
    </motion.section>
  )
}

function EntryList({ entries }: { entries: TitledEntry[] }) {
  return (
    <div className="about-list">
      {entries.map((entry) => (
        <div key={entry.title}>
          <h3>{entry.title}</h3>
          <p>{entry.body}</p>
        </div>
      ))}
    </div>
  )
}

export default function About() {
  const { content, error, isLoading } = useSiteContent()
  const settings = content?.settings
  const about = content?.about

  useEffect(() => {
    initAnalytics(settings?.gaMeasurementId, 'About')
  }, [settings?.gaMeasurementId])

  useEffect(() => {
    if (content) applySeo(about?.seo, settings, '/about/')
  }, [content, about, settings])

  // Built as a list so the alternating side comes from the position rather than
  // being hardcoded per section, and a fourth block would follow the pattern.
  const blocks = [
    {
      heading: about?.heading ?? 'About Us',
      image: about?.image,
      body: (
        <>
          {about?.body?.split('\n\n').map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </>
      ),
      isEmpty: !about?.body,
    },
    {
      heading: 'Why Choose Us',
      image: about?.whyChooseUsImage,
      body: <EntryList entries={about?.whyChooseUs ?? []} />,
      isEmpty: (about?.whyChooseUs ?? []).length === 0,
    },
    {
      heading: 'Our Service',
      image: about?.servicesImage,
      body: <EntryList entries={about?.services ?? []} />,
      isEmpty: (about?.services ?? []).length === 0,
    },
  ].filter((block) => !block.isEmpty)

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header settings={settings} />

      {/* Busy until the content request returns, so the stylesheet can keep the
          footer below the fold instead of on screen waiting to be pushed down. */}
      <main id="main" className="shell section" aria-busy={isLoading}>
        {isLoading && <p className="notice">Loading</p>}
        {error && <p className="notice">This page could not be loaded. Please refresh.</p>}

        {blocks.map((block, index) => (
          <AboutBlock key={block.heading} heading={block.heading} image={block.image} index={index}>
            {block.body}
          </AboutBlock>
        ))}
      </main>

      <Footer settings={settings} />
      <div className="floating-stack">
        <WhatsAppButton settings={settings} />
        <ChatWidget faq={content?.homepage?.faq ?? []} />
      </div>
    </>
  )
}
