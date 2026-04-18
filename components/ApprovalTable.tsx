// components/ApprovalTable.tsx
'use client'
import Link from 'next/link'
import StatusBadge from './StatusBadge'
import type { Approval } from '@/types'

function minutesAgo(isoString: string): string {
  const mins = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export default function ApprovalTable({
  approvals,
  emptyMessage = 'No pending approvals',
}: {
  approvals: Approval[]
  emptyMessage?: string
}) {
  if (approvals.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-4xl mb-3">✅</div>
        <p className="font-medium">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-[2fr_1.2fr_0.8fr_0.8fr_1fr] gap-4 px-4 py-2 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
        <div>Agent / Action</div>
        <div>Assignee</div>
        <div>Waiting</div>
        <div>Status</div>
        <div>Action</div>
      </div>
      {approvals.map((a) => (
        <div
          key={a.id}
          className="grid grid-cols-[2fr_1.2fr_0.8fr_0.8fr_1fr] gap-4 px-4 py-3 border-b border-gray-50 items-center hover:bg-gray-50 transition-colors"
        >
          <div>
            <div className="font-semibold text-sm text-gray-900">{a.agent_name}</div>
            <div className="text-xs text-gray-500 truncate max-w-xs">{a.action_description}</div>
          </div>
          <div className="text-sm text-gray-600">{a.assignee}</div>
          <div className="text-sm text-gray-600">{minutesAgo(a.created_at)}</div>
          <div><StatusBadge status={a.status} /></div>
          <div>
            <Link
              href={`/approval/${a.id}`}
              className="rounded px-3 py-1 text-xs font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors"
            >
              Review
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
