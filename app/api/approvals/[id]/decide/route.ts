// app/api/approvals/[id]/decide/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { DecidePayload } from '@/types'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Block ALL writes in demo mode — even direct API calls from DevTools
  // Demo mode is active when NEXT_PUBLIC_DEMO_MODE is NOT 'true' (default = read-only)
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
    return NextResponse.json({ error: 'Read-only demo — decisions are disabled' }, { status: 403 })
  }

  const body: DecidePayload = await req.json()

  if (!['approved', 'rejected'].includes(body.decision)) {
    return NextResponse.json({ error: 'decision must be "approved" or "rejected"' }, { status: 400 })
  }
  if (!body.decided_by) {
    return NextResponse.json({ error: 'decided_by is required' }, { status: 400 })
  }

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('approvals')
    .select('*')
    .eq('id', params.id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
  }
  if (!['pending', 'escalated'].includes(existing.status)) {
    return NextResponse.json({ error: 'Approval is already resolved' }, { status: 409 })
  }

  const { data: updated, error } = await supabaseAdmin
    .from('approvals')
    .update({
      status: body.decision,
      decided_by: body.decided_by,
      decision_note: body.note ?? null,
      decided_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .in('status', ['pending', 'escalated'])  // atomic guard — only updates if still unresolved
    .select('id, status')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // If another request decided first, updated will be null — treat as already resolved
  if (!updated) return NextResponse.json({ error: 'Approval is already resolved' }, { status: 409 })

  return NextResponse.json({ status: updated.status })
}
