// components/StatsBar.tsx
import type { DashboardStats } from '@/types'

export default function StatsBar({ stats }: { stats: DashboardStats }) {
  const items = [
    { label: 'Awaiting approval', value: stats.pending, color: 'text-yellow-600' },
    { label: 'Escalated', value: stats.escalated, color: 'text-red-600' },
    { label: 'Approved today', value: stats.approved_today, color: 'text-green-600' },
    { label: 'Avg response', value: `${stats.avg_response_minutes}m`, color: 'text-gray-700' },
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
