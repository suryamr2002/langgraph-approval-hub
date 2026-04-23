// app/api/audit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Never cache — audit log must reflect latest decisions
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '0')
  const pageSize = 50

  const { data, error, count } = await supabaseAdmin
    .from('approvals')
    .select(
      'id, agent_name, action_description, status, decided_by, decided_at, decision_note, created_at',
      { count: 'exact' }
    )
    .in('status', ['approved', 'rejected', 'expired'])
    .order('decided_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ records: data, total: count, page, pageSize })
}
