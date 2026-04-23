// app/api/approvals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Never cache — SDK polls this route to detect status changes
export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Use raw fetch to bypass Next.js data cache entirely.
  // The Supabase JS client routes through Next.js's patched fetch() which
  // caches per-instance — bypassing it here ensures every poll hits Supabase live.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const res = await fetch(
    `${supabaseUrl}/rest/v1/approvals?select=*,notifications_log(*)&id=eq.${params.id}`,
    {
      cache: 'no-store',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }
  )

  if (!res.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const rows = await res.json()
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(rows[0], {
    headers: { 'Cache-Control': 'no-store' },
  })
}
