import { config } from './config'

/**
 * Contact form persistence.
 *
 * One INSERT against PostgREST with plain `fetch`, rather than
 * `@supabase/supabase-js`, which would add roughly 50KB gzipped to do the same
 * POST. The anon key is public; what makes that safe is the insert-only row
 * level security policy in supabase/schema.sql, not the key being hidden.
 */

export type Lead = {
  name: string
  email: string
  phone: string
  message: string
}

export async function submitLead(lead: Lead, signal?: AbortSignal): Promise<void> {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(lead),
    signal,
  })

  if (!response.ok) {
    throw new Error(`Lead submission failed (${response.status})`)
  }
}
