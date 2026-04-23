// components/StatsBar.tsx
import type { DashboardStats } from '@/types'

function formatAvgResponse(minutes: number | null | undefined): string {
  if (minutes == null || minutes <= 0) return '—'
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export default function StatsBar({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      <StatCard
        label="Awaiting approval"
        value={stats.pending}
        valueClass="text-yellow-600"
        icon="⏳"
      />
      <StatCard
        label="Escalated"
        value={stats.escalated}
        valueClass="text-red-500"
        icon="🔺"
      />
      <StatCard
        label="Approved today"
        value={stats.approved_today}
        valueClass="text-green-600"
        icon="✅"
      />
      <StatCard
        label="Avg decision time"
        value={formatAvgResponse(stats.avg_response_minutes)}
        valueClass="text-gray-800"
        icon="⚡"
        hint={stats.avg_response_minutes > 0 ? 'across all decisions' : 'no decisions yet'}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  valueClass,
  icon,
  hint,
}: {
  label: string
  value: string | number
  valueClass: string
  icon: string
  hint?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
      <span className="text-xl mt-0.5">{icon}</span>
      <div>
        <div className={`text-2xl font-black leading-none ${valueClass}`}>{value}</div>
        <div className="text-xs text-gray-500 mt-1 font-medium">{label}</div>
        {hint && <div className="text-[10px] text-gray-400 mt-0.5">{hint}</div>}
      </div>
    </div>
  )
}
