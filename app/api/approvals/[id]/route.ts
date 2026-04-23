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
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

  const res = await fetch(
    `${supabaseUrl}/rest/v1/approvals?select=*,notifications_log(*)&id=eq.${params.id}`,
    {
      cache: 'no-store',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    }
  )

  const text = await res.text()
  console.log(`[GET /api/approvals/${params.id}] status=${res.status} body=${text.slice(0, 200)}`)

  if (!res.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let rows: unknown[]
  try { rows = JSON.parse(text) } catch { return NextResponse.json({ error: 'Parse error' }, { status: 500 }) }

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(rows[0], {
    headers: { 'Cache-Control': 'no-store' },
  })
}
