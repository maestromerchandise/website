/**
 * Google Analytics 4.
 *
 * One module so no component ever touches `gtag` directly, and one place to
 * check what leaves the browser. The measurement id is a public value by
 * design; it identifies the property, it does not authorise anything.
 *
 * The id comes from the CMS rather than the build, so the site owner can set it
 * themselves without a redeploy, and a project handed to a new owner carries no
 * trace of the previous property.
 *
 * Nothing here ever receives a name, e-mail address, phone number or message
 * body. Conversion events carry a product title or a section id at most, which
 * are already public page content.
 */

/** Set by initAnalytics once the settings arrive; until then nothing is sent. */
let measurementId: string | undefined

type GtagArguments =
  | ['js', Date]
  | ['config', string, Record<string, unknown>?]
  | ['event', string, Record<string, unknown>?]

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: GtagArguments) => void
  }
}

function isEnabled(): boolean {
  // A missing id is the normal state before the settings load, in development
  // and wherever the owner has not filled one in, so it is a silent no-op
  // rather than a warning nobody can act on.
  return Boolean(measurementId) && typeof window !== 'undefined'
}

/**
 * Load gtag and record the first page view.
 *
 * Called from each entry point once the settings have loaded, and safe to call
 * again: an id that is missing, or a script already on the page, both return
 * early. The script is appended rather than written into the HTML, so a site
 * with no measurement id makes no third-party request at all.
 */
export function initAnalytics(id: string | undefined, pageTitle: string): void {
  if (!id || typeof window === 'undefined' || document.getElementById('ga4')) return
  measurementId = id

  window.dataLayer = window.dataLayer ?? []
  window.gtag = function gtag(...args: GtagArguments) {
    window.dataLayer?.push(args)
  }

  const script = document.createElement('script')
  script.id = 'ga4'
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
  document.head.appendChild(script)

  window.gtag('js', new Date())
  window.gtag('config', id, {
    page_title: pageTitle,
    page_path: window.location.pathname,
  })
}

/** Every conversion the site reports, named in one place. */
export const EVENTS = {
  productOpen: 'product_open',
  categoryClick: 'category_click',
  readyMadeOpen: 'ready_made_open',
  customGiftCta: 'custom_gift_cta',
  customBoxCta: 'custom_box_cta',
  enquirySubmit: 'enquiry_submit',
  whatsappClick: 'whatsapp_click',
  chatOpen: 'chat_open',
  chatQuestion: 'chat_question',
  aboutNavigate: 'about_navigate',
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]

/**
 * Report a conversion.
 *
 * `params` carries page content only. Never pass a form field through here.
 */
export function track(event: EventName, params?: Record<string, string | number | boolean>): void {
  if (!isEnabled()) return
  window.gtag?.('event', event, params)
}
