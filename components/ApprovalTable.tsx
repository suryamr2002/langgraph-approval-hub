// components/ApprovalTable.tsx
'use client'
import Link from 'next/link'
import StatusBadge from './StatusBadge'
import type { Approval } from '@/types'
import { relativeTime } from '@/lib/formatDate'

const NEW_THRESHOLD_MS = 5 * 60_000 // items created within 5 min are "new"

function isNew(isoString: string) {
  return Date.now() - new Date(isoString).getTime() < NEW_THRESHOLD_MS
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
    <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
      <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '35%' }} />
          <col style={{ width: '22%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '12%' }} />
        </colgroup>
        <thead>
          <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <th className="px-4 py-2 text-left">Agent / Action</th>
            <th className="px-4 py-2 text-left">Assignee</th>
            <th className="px-4 py-2 text-left">Waiting</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {approvals.map((a) => {
            const fresh = isNew(a.created_at)
            return (
              <tr
                key={a.id}
                className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  fresh ? 'bg-green-50 border-l-2 border-l-green-400' : ''
                }`}
              >
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 truncate">{a.agent_name}</span>
                    {fresh && (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide bg-green-500 text-white rounded-full px-1.5 py-0.5">
                        New
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">{a.action_description}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 align-top truncate">{a.assignee}</td>
                <td className="px-4 py-3 text-sm text-gray-600 align-top whitespace-nowrap">{relativeTime(a.created_at)}</td>
                <td className="px-4 py-3 align-top"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3 align-top">
                  <Link
                    href={`/approval/${a.id}`}
                    className="rounded px-3 py-1 text-xs font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors inline-block"
                  >
                    Review
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
