// components/StatsBar.tsx
import type { DashboardStats } from '@/types'

function formatAvgResponse(minutes: number): string {
  if (minutes <= 0) return '—'           // no decided items yet
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export default function StatsBar({ stats }: { stats: DashboardStats }) {
  const items = [
    { label: 'Awaiting approval',    value: String(stats.pending),        color: 'text-yellow-600' },
    { label: 'Escalated',            value: String(stats.escalated),       color: 'text-red-600'    },
    { label: 'Approved today',       value: String(stats.approved_today),  color: 'text-green-600'  },
    {
      label: 'Avg decision time',
      value: formatAvgResponse(stats.avg_response_minutes),
      color: 'text-gray-700',
    },
  ]
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {items.map((item) => (
        <div key={item.label} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
          <div className="text-xs text-gray-500 mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  )
}
