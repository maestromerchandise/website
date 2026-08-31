import type { SiteSettings } from './sanity'

/**
 * The Get in touch form, as a `mailto:` handoff.
 *
 * There is no backend and no transactional mail service. The visitor sends the
 * enquiry from their own mail app, which means nothing is stored, no key ships
 * in the bundle, and the reply address is genuinely theirs. Maestro then
 * continues on WhatsApp, which is the number the body puts first.
 */

export type Enquiry = {
  name: string
  email: string
  phone: string
  message: string
}

const DEFAULT_SUBJECT = 'Website enquiry from {name}'

/**
 * Some mail clients cut a `mailto:` at a few thousand characters. The message
 * field is capped well below that, so this only guards a pathological paste.
 */
const MAX_BODY = 1800

function buildBody(enquiry: Enquiry): string {
  const lines = [
    `Name: ${enquiry.name}`,
    `E-mail: ${enquiry.email}`,
    // Put the WhatsApp number high in the body: it is how the team replies.
    `WhatsApp / phone: ${enquiry.phone || 'Not provided'}`,
    `Sent: ${new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}`,
    '',
    'Message:',
    enquiry.message,
  ]
  return lines.join('\n').slice(0, MAX_BODY)
}

/**
 * The `mailto:` URL the form opens, or null when no address is configured.
 *
 * The recipient comes from the CMS alone. Falling back to an address written
 * here would send a visitor's enquiry to whoever that address belonged to,
 * silently and without the site owner ever being able to change it, so a
 * missing setting stops the handoff instead.
 */
export function enquiryMailto(
  settings: SiteSettings | null | undefined,
  enquiry: Enquiry,
): string | null {
  const recipient = settings?.enquiryEmail
  if (!recipient) return null

  const subject = (settings?.enquirySubject ?? DEFAULT_SUBJECT).replace('{name}', enquiry.name)

  const params = new URLSearchParams({ subject, body: buildBody(enquiry) })
  // URLSearchParams encodes a space as `+`, which a mail client shows literally
  // in the subject line, so those are converted to the percent form.
  return `mailto:${recipient}?${params.toString().replace(/\+/g, '%20')}`
}
