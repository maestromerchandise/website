import { useEffect, useState } from 'react'
import { fetchSiteContent, type SiteContent } from './sanity'

type State = {
  content?: SiteContent
  error?: string
  isLoading: boolean
}

/**
 * Where the last content this browser received is kept. Bump the version when
 * the shape of SiteContent changes in a way older code could not read.
 */
const CACHE_KEY = 'maestro:content:v1'

/**
 * The content from the visitor's previous visit, if any.
 *
 * Storage can be missing, full or blocked outright, as in a private window, so
 * every failure just means there is nothing cached.
 */
function readCache(): SiteContent | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as SiteContent) : undefined
  } catch {
    return undefined
  }
}

function writeCache(content: SiteContent) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(content))
  } catch {
    // Nothing to do: the next visit simply waits for the network again.
  }
}

/**
 * Loads the whole site in one request. Both pages use it, so both pay for one round trip.
 *
 * A returning visitor is shown the content from their last visit at once, and
 * the fresh copy replaces it when it arrives. The request is the slowest step
 * in front of the page's largest paint, and Sanity lets a browser keep its
 * answer for only a minute, so without this every later visit waited on the
 * network again. An edit made in Studio still shows on the same visit, a moment
 * later. A failed request keeps the last content on screen rather than an error.
 */
export function useSiteContent(): State {
  const [state, setState] = useState<State>(() => {
    const content = readCache()
    return { content, isLoading: !content }
  })

  useEffect(() => {
    const controller = new AbortController()

    fetchSiteContent(controller.signal).then(
      (content) => {
        setState({ content, isLoading: false })
        writeCache(content)
      },
      (error: unknown) => {
        if (controller.signal.aborted) return
        setState((current) =>
          current.content
            ? current
            : { error: error instanceof Error ? error.message : String(error), isLoading: false },
        )
      },
    )

    return () => controller.abort()
  }, [])

  return state
}
