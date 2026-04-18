// app/page.tsx
import StatsBar from '@/components/StatsBar'
import ApprovalTable from '@/components/ApprovalTable'
import type { Approval, DashboardStats } from '@/types'

async function getData(): Promise<{ approvals: Approval[]; stats: DashboardStats }> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  try {
    const res = await fetch(`${base}/api/approvals`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed')
    return res.json()
  } catch {
    return {
      approvals: [],
      stats: { pending: 0, escalated: 0, approved_today: 0, avg_response_minutes: 0 },
    }
  }
}

export default async function DashboardPage() {
  const { approvals, stats } = await getData()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Pending Approvals</h1>
        <span className="text-xs text-gray-400">Updates on refresh</span>
      </div>
      <StatsBar stats={stats} />
      <ApprovalTable approvals={approvals} />
    </div>
  )
}
