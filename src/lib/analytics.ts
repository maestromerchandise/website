/**
 * Google Analytics 4.
 *
 * One module so no component ever touches `gtag` directly, and one place to
 * check what leaves the browser. The measurement id is a public value by
 * design; it identifies the property, it does not authorise anything.
 *
 * Nothing here ever receives a name, e-mail address, phone number or message
 * body. Conversion events carry a product title or a section id at most, which
 * are already public page content.
 */

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

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
  // A missing id is the normal state in development and in a preview build, so
  // it is a silent no-op rather than a warning nobody can act on.
  return Boolean(MEASUREMENT_ID) && typeof window !== 'undefined'
}

/**
 * Load gtag and record the first page view.
 *
 * Called once per entry point. The script is appended rather than written into
 * the HTML so a build with no measurement id ships no third-party request at
 * all, which also keeps the preview and dev server free of it.
 */
export function initAnalytics(pageTitle: string): void {
  if (!isEnabled() || document.getElementById('ga4')) return

  window.dataLayer = window.dataLayer ?? []
  window.gtag = function gtag(...args: GtagArguments) {
    window.dataLayer?.push(args)
  }

  const script = document.createElement('script')
  script.id = 'ga4'
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.gtag('js', new Date())
  window.gtag('config', MEASUREMENT_ID, {
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
