// app/api/approvals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAndEscalate } from '@/lib/escalation'
import type { DashboardStats } from '@/types'

export async function GET(req: NextRequest) {
  await checkAndEscalate()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabaseAdmin
    .from('approvals')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const all = data ?? []

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const pending = all.filter((a) => a.status === 'pending').length
  const escalated = all.filter((a) => a.status === 'escalated').length
  const approvedToday = all.filter(
    (a) => a.status === 'approved' && a.decided_at && new Date(a.decided_at) >= todayStart
  ).length

  const decidedItems = all.filter((a) => a.decided_at)
  const avgMs =
    decidedItems.length > 0
      ? decidedItems.reduce((sum, a) => {
          return sum + (new Date(a.decided_at!).getTime() - new Date(a.created_at).getTime())
        }, 0) / decidedItems.length
      : 0

  const stats: DashboardStats = {
    pending,
    escalated,
    approved_today: approvedToday,
    avg_response_minutes: Math.round(avgMs / 60000),
  }

  return NextResponse.json({ approvals: all, stats })
}
