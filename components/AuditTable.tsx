// components/AuditTable.tsx
'use client'
import { useState, useEffect } from 'react'
import StatusBadge from './StatusBadge'
import { formatDateTime } from '@/lib/formatDate'
import type { ApprovalStatus } from '@/types'
import { useRealtimeRefresh } from '@/lib/useRealtimeRefresh'

interface AuditRecord {
  id: string
  agent_name: string
  action_description: string
  status: ApprovalStatus
  decided_by: string | null
  decided_at: string | null
  decision_note: string | null
  created_at: string
}

type TimeFilter = 'all' | 'today' | '24h' | '7d'
type DecisionFilter = 'all' | 'approved' | 'rejected' | 'expired'

const TIME_OPTS: { label: string; value: TimeFilter }[] = [
  { label: 'All time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Last 24 h', value: '24h' },
  { label: 'Last 7 d', value: '7d' },
]

const DECISION_OPTS: { label: string; value: DecisionFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Expired', value: 'expired' },
]

function passesTimeFilter(record: AuditRecord, filter: TimeFilter): boolean {
  if (filter === 'all') return true
  const at = record.decided_at ? new Date(record.decided_at) : new Date(record.created_at)
  const now = Date.now()
  if (filter === '24h') return now - at.getTime() <= 86_400_000
  if (filter === '7d') return now - at.getTime() <= 7 * 86_400_000
  if (filter === 'today') {
    const today = new Date()
    return (
      at.getFullYear() === today.getFullYear() &&
      at.getMonth() === today.getMonth() &&
      at.getDate() === today.getDate()
    )
  }
  return true
}

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        active
          ? 'bg-green-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  )
}

export default function AuditTable({ records: initial }: { records: AuditRecord[] }) {
  const [records, setRecords] = useState(initial)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>('all')
  const [decidedBySearch, setDecidedBySearch] = useState('')

  // Keep records in sync when server re-renders via router.refresh()
  useEffect(() => { setRecords(initial) }, [initial])

  // Realtime: re-render instantly when any approval is decided
  useRealtimeRefresh()

  const filtered = records.filter((r) => {
    if (!passesTimeFilter(r, timeFilter)) return false
    if (decisionFilter !== 'all' && r.status !== decisionFilter) return false
    if (decidedBySearch.trim()) {
      const q = decidedBySearch.trim().toLowerCase()
      if (!(r.decided_by ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  function exportFiltered() {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide w-12">Period</span>
          {TIME_OPTS.map((o) => (
            <FilterBtn key={o.value} active={timeFilter === o.value} onClick={() => setTimeFilter(o.value)}>
              {o.label}
            </FilterBtn>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200 hidden sm:block" />

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide w-16">Decision</span>
          {DECISION_OPTS.map((o) => (
            <FilterBtn key={o.value} active={decisionFilter === o.value} onClick={() => setDecisionFilter(o.value)}>
              {o.label}
            </FilterBtn>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-200 hidden sm:block" />

        <input
          type="text"
          placeholder="Filter by email…"
          value={decidedBySearch}
          onChange={(e) => setDecidedBySearch(e.target.value)}
          className="border border-gray-200 rounded-md px-3 py-1 text-sm text-gray-900 placeholder:text-gray-400 w-44 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        />

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-gray-400">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
          <button
            onClick={exportFiltered}
            className="text-sm text-green-600 hover:underline font-medium"
          >
            ↓ Export JSON
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No records match the current filters.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          {/* Fixed-width columns — no more wobbly layout */}
          <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '148px' }} />
              <col style={{ width: '30%' }} />
              <col style={{ width: '96px' }} />
              <col style={{ width: '20%' }} />
              <col />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="px-4 py-2 text-left">Timestamp</th>
                <th className="px-4 py-2 text-left">Agent / Action</th>
                <th className="px-4 py-2 text-left">Decision</th>
                <th className="px-4 py-2 text-left">Decided by</th>
                <th className="px-4 py-2 text-left">Note</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400 align-top whitespace-nowrap">
                    {r.decided_at ? formatDateTime(r.decided_at) : '—'}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-gray-900 truncate">{r.agent_name}</div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">{r.action_description}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 align-top truncate">
                    {r.decided_by ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 align-top truncate">
                    {r.decision_note ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
