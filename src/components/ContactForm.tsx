import { useState } from 'react'
import type { FormEvent } from 'react'
import { submitLead } from '../lib/supabase'

type Status = 'idle' | 'sending' | 'sent' | 'failed'

/**
 * Get in touch form.
 *
 * Validation is the browser's own: `required`, `type="email"` and `maxLength`
 * mirror the CHECK constraints in supabase/schema.sql, which are the ones that
 * actually hold, since anyone can POST past this form.
 */
export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const fields = new FormData(form)

    // A bot that fills every field trips this. Report success either way, so it
    // gets no signal about why nothing arrived.
    if (fields.get('company')) {
      setStatus('sent')
      form.reset()
      return
    }

    setStatus('sending')
    try {
      await submitLead({
        name: String(fields.get('name')),
        email: String(fields.get('email')),
        phone: String(fields.get('phone') ?? ''),
        message: String(fields.get('message')),
      })
      setStatus('sent')
      form.reset()
    } catch {
      setStatus('failed')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="display">We do more than create merchandise</p>
      <p className="eyebrow">End to end service</p>

      <div className="honeypot" aria-hidden="true">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="field">
        <span className="eyebrow">Name</span>
        <input type="text" name="name" required maxLength={100} autoComplete="name" />
      </label>

      <label className="field">
        <span className="eyebrow">Phone number</span>
        <input type="tel" name="phone" maxLength={30} autoComplete="tel" />
      </label>

      <label className="field">
        <span className="eyebrow">E-mail</span>
        <input type="email" name="email" required maxLength={150} autoComplete="email" />
      </label>

      <label className="field">
        <span className="eyebrow">Message</span>
        <textarea name="message" required maxLength={2000} />
      </label>

      <button type="submit" className="button" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending' : 'Send message'}
      </button>

      <p className="form-status" role="status">
        {status === 'sent' && 'Thank you. We will be in touch shortly.'}
        {status === 'failed' && 'That did not send. Please try again, or reach us on WhatsApp.'}
      </p>
    </form>
  )
}
