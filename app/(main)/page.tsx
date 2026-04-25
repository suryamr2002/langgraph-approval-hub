// app/(main)/page.tsx
// Never serve a stale cached render — always re-fetch from Supabase
export const dynamic = 'force-dynamic'

import StatsBar from '@/components/StatsBar'
import DashboardClient from '@/components/DashboardClient'
import type { Approval, DashboardStats } from '@/types'

async function getData(status?: string): Promise<{ approvals: Approval[]; stats: DashboardStats }> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const url = status ? `${base}/api/approvals?status=${status}` : `${base}/api/approvals`
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed')
    return res.json()
  } catch {
    return {
      approvals: [],
      stats: { pending: 0, escalated: 0, approved_today: 0, avg_response_minutes: 0 },
    }
  }
}

const TAB_TITLES: Record<string, string> = {
  pending:   'Pending Approvals',
  escalated: 'Escalated Approvals',
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const activeStatus = searchParams.status ?? null
  const { approvals, stats } = await getData(activeStatus ?? undefined)
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== 'true'
  const title = activeStatus ? (TAB_TITLES[activeStatus] ?? 'Approvals') : 'All Approvals'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {/* Realtime indicator */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Live
        </div>
      </div>
      <StatsBar stats={stats} />
      <div className="mt-6">
        <DashboardClient
          approvals={approvals}
          activeStatus={activeStatus}
          demoMode={demoMode}
        />
      </div>
    </div>
  )
}
