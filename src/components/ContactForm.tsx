import { useState } from 'react'
import type { FormEvent } from 'react'
import { EVENTS, track } from '../lib/analytics'
import { enquiryMailto } from '../lib/enquiry'
import type { SiteSettings } from '../lib/sanity'

type Status = 'idle' | 'opened'

/**
 * Get in touch form.
 *
 * Submitting opens the visitor's own mail app with the enquiry already written,
 * so there is no backend, no stored data and no key in the bundle. Validation
 * is the browser's own, which is all that is needed when the visitor is the one
 * sending the message.
 */
export function ContactForm({ settings }: { settings: SiteSettings | null | undefined }) {
  const [status, setStatus] = useState<Status>('idle')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const fields = new FormData(form)

    // A bot that fills every field trips this. Report success either way, so it
    // gets no signal about why nothing happened.
    if (fields.get('company')) {
      setStatus('opened')
      form.reset()
      return
    }

    const mailto = enquiryMailto(settings, {
      name: String(fields.get('name') ?? ''),
      email: String(fields.get('email') ?? ''),
      phone: String(fields.get('phone') ?? ''),
      message: String(fields.get('message') ?? ''),
    })

    // The event records that an enquiry was started. No field value is sent.
    track(EVENTS.enquirySubmit)

    // A mail client that is not configured leaves the page untouched, which is
    // indistinguishable from success here, so the status text tells the visitor
    // what should have happened and offers WhatsApp as the alternative.
    window.location.href = mailto
    setStatus('opened')
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="honeypot" aria-hidden="true">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {/* Name and phone share a row on desktop, as in the reference, and stack
          below it. Email and message always run the full width. */}
      <div className="field-row">
        <label className="field">
          <span className="eyebrow">Name</span>
          <input type="text" name="name" required maxLength={100} autoComplete="name" />
        </label>

        <label className="field">
          <span className="eyebrow">WhatsApp number</span>
          <input
            type="tel"
            name="phone"
            required
            maxLength={30}
            autoComplete="tel"
            inputMode="tel"
            pattern="[0-9+()\-.\s]{6,30}"
            title="Digits, spaces and + ( ) - . only"
          />
        </label>
      </div>

      <label className="field">
        <span className="eyebrow">E-mail</span>
        <input type="email" name="email" required maxLength={150} autoComplete="email" />
      </label>

      <label className="field">
        <span className="eyebrow">Message</span>
        <textarea name="message" required maxLength={2000} rows={6} />
      </label>

      <button type="submit" className="button">
        Send enquiry
      </button>

      <p className="form-status" role="status">
        {status === 'opened' &&
          'Your e-mail app should now be open with the enquiry ready to send. If nothing happened, message us on WhatsApp instead.'}
      </p>
    </form>
  )
}
