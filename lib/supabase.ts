// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Next.js 14 caches fetch() calls by default — including those made internally
// by the Supabase JS client. Override to always read fresh data from Supabase.
const noStoreFetch = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, { ...init, cache: 'no-store' })

// Browser client — used in React components
export const supabase = createClient(url, anon)

// Server client — used in API routes (bypasses RLS + Next.js fetch cache)
export const supabaseAdmin = createClient(url, service, {
  global: { fetch: noStoreFetch },
})
