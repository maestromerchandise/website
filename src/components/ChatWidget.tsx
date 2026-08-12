import { useState } from 'react'
import type { FaqEntry } from '../lib/sanity'

/**
 * Static FAQ assistant.
 *
 * Answers are written by hand in Sanity, so there is no model, no API key and
 * nothing that can invent an answer about lead times or pricing.
 */
export function ChatWidget({ faq }: { faq: FaqEntry[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [openQuestion, setOpenQuestion] = useState<string>()

  if (faq.length === 0) return null

  return (
    <div className="chat">
      {isOpen && (
        <div className="chat-panel">
          <p className="eyebrow">How can we help?</p>
          {faq.map((entry) => (
            <div key={entry.question}>
              <button
                type="button"
                className="chat-question"
                aria-expanded={openQuestion === entry.question}
                onClick={() =>
                  setOpenQuestion(openQuestion === entry.question ? undefined : entry.question)
                }
              >
                {entry.question}
              </button>
              {openQuestion === entry.question && <p className="chat-answer">{entry.answer}</p>}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="chat-toggle"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close help' : 'Open help'}
        onClick={() => setIsOpen(!isOpen)}
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
