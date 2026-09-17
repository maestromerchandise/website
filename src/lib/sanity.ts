import { config, isPreview } from './config'

/**
 * Read access to the Sanity Content Lake.
 *
 * Plain `fetch` against the CDN endpoint rather than `@sanity/client`, because
 * the site only ever runs one read query and the client package would be the
 * largest dependency in the bundle. GROQ dereferences asset URLs directly, so
 * `@sanity/image-url` is not needed either.
 */

export type Category = {
  id: string
  label: string
  /** The section this category scrolls to, which is its own id unless overridden. */
  anchor: string
  image?: string
  showInStrip: boolean
}

export type Product = {
  id: string
  title: string
  category: string
  tagline?: string
  description?: string
  features?: string[]
  specifications?: string[]
  /** A colour may carry its own photograph, which replaces the main image when picked. */
  colors?: { name: string; hex: string; image?: string }[]
  readyMade?: boolean
  image?: string
  gallery?: string[]
}

export type ClientLogo = {
  name: string
  image?: string
  /** Width over height of the uploaded logo, so its space is reserved before it loads. */
  aspectRatio?: number
}

export type TitledEntry = {
  title: string
  body: string
}

export type FaqEntry = {
  question: string
  answer: string
}

export type Seo = {
  metaTitle?: string
  metaDescription?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  canonicalUrl?: string
  noIndex?: boolean
}

export type SectionCopy = {
  heading?: string
  intro?: string
}

export type Contact = {
  address?: string
  email?: string
  phone?: string
  instagram?: string
  tiktok?: string
  mapsUrl?: string
}

export type SiteSettings = {
  siteUrl?: string
  siteName?: string
  /** Uploaded in Studio. While empty, the built-in wordmark is shown. */
  logo?: string
  /** Width over height of the logo, so its space is reserved before it loads. */
  logoAspectRatio?: number
  /** Uploaded in Studio. While empty, the icon files the HTML names stay in place. */
  favicon?: string
  mastheadText?: string
  whatsappNumber?: string
  whatsappDefaultMessage?: string
  whatsappProductMessage?: string
  enquiryEmail?: string
  gaMeasurementId?: string
  enquirySubject?: string
  contact?: Contact
  navigation?: { label: string; href: string }[]
  footerNote?: string
  defaultSeo?: Seo
}

export type Homepage = {
  heroTitle?: string
  heroSubtitle?: string
  clientsSection?: SectionCopy
  readyMadeSection?: SectionCopy
  customGiftSection?: SectionCopy
  customBoxSection?: SectionCopy
  contactSection?: SectionCopy
  contactLead?: { title?: string; subtitle?: string }
  clientLogos?: ClientLogo[]
  faq?: FaqEntry[]
  seo?: Seo
}

export type AboutPage = {
  heading?: string
  body?: string
  image?: string
  whyChooseUs?: TitledEntry[]
  whyChooseUsImage?: string
  services?: TitledEntry[]
  servicesImage?: string
  seo?: Seo
}

export type SiteContent = {
  settings: SiteSettings | null
  homepage: Homepage | null
  about: AboutPage | null
  categories: Category[]
  products: Product[]
}

const SEO_FIELDS = `
  metaTitle,
  metaDescription,
  ogTitle,
  ogDescription,
  "ogImage": ogImage.asset->url,
  canonicalUrl,
  noIndex
`

const PRODUCT_FIELDS = `
  "id": coalesce(slug.current, _id),
  title,
  "category": category->slug.current,
  tagline,
  description,
  features,
  specifications,
  colors[]{name, hex, "image": image.asset->url},
  readyMade,
  "image": image.asset->url,
  "gallery": gallery[].asset->url
`

const QUERY = `{
  "settings": *[_type == "siteSettings"][0]{
    siteUrl,
    siteName,
    "logo": logo.asset->url,
    "logoAspectRatio": logo.asset->metadata.dimensions.aspectRatio,
    "favicon": favicon.asset->url,
    mastheadText,
    whatsappNumber,
    whatsappDefaultMessage,
    whatsappProductMessage,
    enquiryEmail,
    gaMeasurementId,
    enquirySubject,
    contact,
    navigation[]{label, href},
    footerNote,
    "defaultSeo": defaultSeo{${SEO_FIELDS}}
  },
  "homepage": *[_type == "homepage"][0]{
    heroTitle,
    heroSubtitle,
    clientsSection,
    readyMadeSection,
    customGiftSection,
    customBoxSection,
    contactSection,
    contactLead,
    clientLogos[]{
      name,
      "image": image.asset->url,
      "aspectRatio": image.asset->metadata.dimensions.aspectRatio
    },
    faq[]{question, answer},
    "seo": seo{${SEO_FIELDS}}
  },
  "about": *[_type == "aboutPage"][0]{
    heading,
    body,
    "image": image.asset->url,
    whyChooseUs[]{title, body},
    "whyChooseUsImage": whyChooseUsImage.asset->url,
    services[]{title, body},
    "servicesImage": servicesImage.asset->url,
    "seo": seo{${SEO_FIELDS}}
  },
  "categories": *[_type == "productCategory"] | order(order asc, title asc){
    "id": slug.current,
    "label": title,
    "anchor": coalesce(anchorOverride, slug.current),
    "image": coverImage.asset->url,
    "showInStrip": coalesce(showInStrip, true)
  },
  "products": *[_type == "product"] | order(order asc, title asc){${PRODUCT_FIELDS}}
}`

/** An empty result is still a valid shape, so every consumer can read it safely. */
function normalise(result: Partial<SiteContent> | null): SiteContent {
  return {
    settings: result?.settings ?? null,
    homepage: result?.homepage ?? null,
    about: result?.about ?? null,
    categories: result?.categories ?? [],
    products: result?.products ?? [],
  }
}

export async function fetchSiteContent(signal?: AbortSignal): Promise<SiteContent> {
  if (isPreview) {
    // Fetched over the dev server rather than imported, so the seed never joins
    // the module graph. A dynamic `import()` would make Rollup emit it as an
    // orphan chunk in `dist/`, dead but still uploaded to the host.
    const response = await fetch('/content/seed.json', { signal })
    return normalise((await response.json()) as Partial<SiteContent>)
  }

  // apicdn is the cached read endpoint. The uncached `api` host is only needed
  // for writes and for reads that must never be a few seconds stale.
  const endpoint =
    `https://${config.sanityProjectId}.apicdn.sanity.io` +
    `/v2024-01-01/data/query/${config.sanityDataset}` +
    `?query=${encodeURIComponent(QUERY)}`

  const response = await fetch(endpoint, { signal })
  if (!response.ok) {
    throw new Error(`Sanity request failed (${response.status})`)
  }

  const { result } = (await response.json()) as { result: Partial<SiteContent> | null }
  return normalise(result)
}
