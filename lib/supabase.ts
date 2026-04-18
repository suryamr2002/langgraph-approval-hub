// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Browser client — used in React components
export const supabase = createClient(url, anon)

// Server client — used in API routes (bypasses RLS)
export const supabaseAdmin = createClient(url, service)
