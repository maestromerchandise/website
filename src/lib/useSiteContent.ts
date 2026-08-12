import { useEffect, useState } from 'react'
import { fetchSiteContent, type SiteContent } from './sanity'

type State = {
  content?: SiteContent
  error?: string
  isLoading: boolean
}

/** Loads the whole site in one request. Both pages use it, so both pay for one round trip. */
export function useSiteContent(): State {
  const [state, setState] = useState<State>({ isLoading: true })

  useEffect(() => {
    const controller = new AbortController()

    fetchSiteContent(controller.signal).then(
      (content) => setState({ content, isLoading: false }),
      (error: unknown) => {
        if (controller.signal.aborted) return
        setState({ error: error instanceof Error ? error.message : String(error), isLoading: false })
      },
    )

    return () => controller.abort()
  }, [])

  return state
}
