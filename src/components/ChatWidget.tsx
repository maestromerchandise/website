import { useEffect, useRef, useState } from 'react'
import { EVENTS, track } from '../lib/analytics'
import type { FaqEntry } from '../lib/sanity'
import { scrollToSection } from '../lib/scroll'

/**
 * Static FAQ assistant.
 *
 * Answers are written by hand in Sanity, so there is no model, no API key and
 * nothing that can invent an answer about lead times or pricing.
 */
export function ChatWidget({ faq }: { faq: FaqEntry[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [openQuestion, setOpenQuestion] = useState<string>()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Escape closes and hands focus back, so the widget cannot trap a keyboard
  // user in a corner of the page with no way out.
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      toggleRef.current?.focus()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Move focus into the panel on open, so the questions are the next thing a
  // keyboard or screen reader user reaches rather than the rest of the page.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus()
  }, [isOpen])

  if (faq.length === 0) return null

  function handleContact() {
    setIsOpen(false)
    scrollToSection('/#contact')
  }

  return (
    <div className="chat">
      {isOpen && (
        <div
          ref={panelRef}
          className="chat-panel"
          role="dialog"
          aria-label="Frequently asked questions"
          tabIndex={-1}
        >
          <p className="eyebrow chat-title">How can we help?</p>

          {faq.map((entry) => (
            <div key={entry.question}>
              <button
                type="button"
                className="chat-question"
                aria-expanded={openQuestion === entry.question}
                onClick={() => {
                  const isOpening = openQuestion !== entry.question
                  setOpenQuestion(isOpening ? entry.question : undefined)
                  // The question text is site copy, not anything the visitor typed.
                  if (isOpening) track(EVENTS.chatQuestion, { question: entry.question })
                }}
              >
                <span>{entry.question}</span>
                <svg
                  className="chev"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {openQuestion === entry.question && <p className="chat-answer">{entry.answer}</p>}
            </div>
          ))}

          <button type="button" className="button chat-cta" onClick={handleContact}>
            Get in touch
          </button>
        </div>
      )}

      <button
        ref={toggleRef}
        type="button"
        className="chat-toggle"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close help' : 'Open help'}
        onClick={() => {
          if (!isOpen) track(EVENTS.chatOpen)
          setIsOpen(!isOpen)
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {isOpen ? (
            <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.88 18.3 9.17 12 2.88 5.71 4.3 4.29l6.29 6.3 6.3-6.3z" />
          ) : (
            <path d="M12 3c5 0 9 3.36 9 7.5S17 18 12 18a10.6 10.6 0 0 1-2.6-.32L4 20l1.2-3.6A7.9 7.9 0 0 1 3 10.5C3 6.36 7 3 12 3z" />
          )}
        </svg>
      </button>
    </div>
  )
}
