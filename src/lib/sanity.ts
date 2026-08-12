import { config } from './config'

/**
 * Read access to the Sanity Content Lake.
 *
 * Plain `fetch` against the CDN endpoint rather than `@sanity/client`, because
 * the site only ever runs one read query and the client package would be the
 * largest dependency in the bundle. GROQ dereferences asset URLs directly, so
 * `@sanity/image-url` is not needed either.
 */

export type Category =
  | 'eco-essentials'
  | 'travel-essentials'
  | 'sports'
  | 'smart-tech'
  | 'office'
  | 'home-living'
  | 'automotive'
  | 'apparel-wearables'
  | 'box'

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'eco-essentials', label: 'Eco Essentials' },
  { id: 'travel-essentials', label: 'Travel Essentials' },
  { id: 'sports', label: 'Sports' },
  { id: 'smart-tech', label: 'Smart & Tech' },
  { id: 'office', label: 'Office' },
  { id: 'home-living', label: 'Home & Living' },
  { id: 'automotive', label: 'Automotive' },
  { id: 'apparel-wearables', label: 'Apparel & Wearables' },
  { id: 'box', label: 'Box' },
]

export type Product = {
  id: string
  title: string
  category: Category
  tagline?: string
  description?: string
  features?: string[]
  specifications?: string[]
  colors?: { name: string; hex: string }[]
  readyMade?: boolean
  image?: string
  gallery?: string[]
}

export type ClientLogo = {
  name: string
  image?: string
}

export type TitledEntry = {
  title: string
  body: string
}

export type FaqEntry = {
  question: string
  answer: string
}

export type Contact = {
  whatsapp?: string
  instagram?: string
  tiktok?: string
  mapsUrl?: string
  address?: string
  email?: string
}

export type Homepage = {
  heroTitle?: string
  heroSubtitle?: string
  about?: string
  aboutImage?: string
  whyChooseUs?: TitledEntry[]
  services?: TitledEntry[]
  faq?: FaqEntry[]
  clientLogos?: ClientLogo[]
  contact?: Contact
}

export type SiteContent = {
  homepage: Homepage | null
  products: Product[]
}

const PRODUCT_FIELDS = `
  "id": _id,
  title,
  category,
  tagline,
  description,
  features,
  specifications,
  colors[]{name, hex},
  readyMade,
  "image": image.asset->url,
  "gallery": gallery[].asset->url
`

const QUERY = `{
  "homepage": *[_type == "homepage"][0]{
    heroTitle,
    heroSubtitle,
    about,
    "aboutImage": aboutImage.asset->url,
    whyChooseUs[]{title, body},
    services[]{title, body},
    faq[]{question, answer},
    clientLogos[]{name, "image": image.asset->url},
    contact
  },
  "products": *[_type == "product"] | order(order asc, title asc){${PRODUCT_FIELDS}}
}`

export async function fetchSiteContent(signal?: AbortSignal): Promise<SiteContent> {
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

  const { result } = (await response.json()) as { result: SiteContent | null }
  return { homepage: result?.homepage ?? null, products: result?.products ?? [] }
}
