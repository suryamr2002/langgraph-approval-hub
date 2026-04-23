// components/ApprovalTable.tsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import StatusBadge from './StatusBadge'
import type { Approval } from '@/types'
import { relativeTime } from '@/lib/formatDate'

const PAGE_SIZE = 10
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
  const [page, setPage] = useState(0)

  // Reset to first page whenever the list changes (filter applied)
  useEffect(() => { setPage(0) }, [approvals.length])

  if (approvals.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-4xl mb-3">✅</div>
        <p className="font-medium">{emptyMessage}</p>
      </div>
    )
  }

  const totalPages = Math.ceil(approvals.length / PAGE_SIZE)
  const pageItems  = approvals.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const start      = page * PAGE_SIZE + 1
  const end        = Math.min((page + 1) * PAGE_SIZE, approvals.length)

  return (
    <div>
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
            {pageItems.map((a) => {
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

      {/* Pagination bar — only shown when there's more than one page */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-1">
          <span className="text-xs text-gray-400">
            Showing {start}–{end} of {approvals.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-7 h-7 text-xs font-medium rounded-md transition-colors ${
                  i === page
                    ? 'bg-green-600 text-white'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
