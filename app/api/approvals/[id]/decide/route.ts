// app/api/approvals/[id]/decide/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { DecidePayload } from '@/types'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const { error } = await supabaseAdmin
    .from('approvals')
    .update({
      status: body.decision,
      decided_by: body.decided_by,
      decision_note: body.note ?? null,
      decided_at: new Date().toISOString(),
    })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ status: body.decision })
}
