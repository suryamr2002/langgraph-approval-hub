// lib/useRealtimeRefresh.ts
// Subscribes to Supabase Realtime on the approvals table and calls
// router.refresh() the moment any row changes — gives millisecond UI updates.
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export function useRealtimeRefresh() {
  const router = useRouter()

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) return  // env vars not available on client → skip

    const supabase = createClient(url, anon)

    const channel = supabase
      .channel('approvals-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'approvals' },
        () => {
          // Any INSERT / UPDATE / DELETE → re-fetch server component data
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])
}
