// components/DashboardClient.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ApprovalTable from './ApprovalTable'
import type { Approval } from '@/types'
import { useRealtimeRefresh } from '@/lib/useRealtimeRefresh'

const TABS = [
  { label: 'All', status: null, href: '/' },
  { label: 'Pending', status: 'pending', href: '/?status=pending' },
  { label: 'Escalated', status: 'escalated', href: '/?status=escalated' },
]

type PeriodFilter = 'all' | 'today' | '24h' | '7d'

const PERIOD_OPTS: { label: string; value: PeriodFilter }[] = [
  { label: 'All time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Last 24 h', value: '24h' },
  { label: 'Last 7 d', value: '7d' },
]

function passesPeriod(a: Approval, filter: PeriodFilter): boolean {
  if (filter === 'all') return true
  const t = new Date(a.created_at).getTime()
  const now = Date.now()
  if (filter === '24h') return now - t <= 86_400_000
  if (filter === '7d') return now - t <= 7 * 86_400_000
  if (filter === 'today') {
    const d = new Date(a.created_at)
    const today = new Date()
    return d.getFullYear() === today.getFullYear() &&
           d.getMonth() === today.getMonth() &&
           d.getDate() === today.getDate()
  }
  return true
}

function getEmptyMessage(activeStatus: string | null, filters: boolean): string {
  if (filters) return 'No results match the current filters'
  if (activeStatus === 'escalated') return 'No escalated approvals — all clear'
  return 'No pending approvals — all clear'
}

export default function DashboardClient({
  approvals,
  activeStatus,
  demoMode,
}: {
  approvals: Approval[]
  activeStatus: string | null
  demoMode: boolean
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')
  const [resetting, setResetting] = useState(false)

  // Realtime: re-render instantly when any approval changes in Supabase
  useRealtimeRefresh()

  const filtered = approvals.filter((a) => {
    if (search.trim()) {
      const q = search.toLowerCase()
      if (
        !a.agent_name.toLowerCase().includes(q) &&
        !a.action_description.toLowerCase().includes(q)
      ) return false
    }
    if (assigneeFilter.trim()) {
      if (!a.assignee.toLowerCase().includes(assigneeFilter.trim().toLowerCase())) return false
    }
    if (!passesPeriod(a, periodFilter)) return false
    return true
  })

  const hasFilters = !!(search.trim() || assigneeFilter.trim() || periodFilter !== 'all')

  async function handleReset() {
    setResetting(true)
    await fetch('/api/demo/seed', { method: 'POST' })
    router.refresh()
    setResetting(false)
  }

  return (
    <div>
      {/* ── Tab bar ── */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => {
            const isActive = activeStatus === tab.status
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>

        {/* Agent / action search */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search agents or actions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 w-52 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {demoMode && (
            <button
              onClick={handleReset}
              disabled={resetting}
              title="Reset demo data"
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {resetting ? '…' : '↺'}
            </button>
          )}
        </div>
      </div>

      {/* ── Column filters ── */}
      <div className="flex flex-wrap items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
        {/* Assignee / email filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Assignee</span>
          <input
            type="text"
            placeholder="Filter by email…"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-2.5 py-1 text-sm text-gray-900 placeholder:text-gray-400 w-44 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          />
        </div>

        <div className="w-px h-5 bg-gray-200 hidden sm:block" />

        {/* Timeline / period filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide mr-1">Submitted</span>
          {PERIOD_OPTS.map((o) => (
            <button
              key={o.value}
              onClick={() => setPeriodFilter(o.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                periodFilter === o.value
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {hasFilters && (
          <>
            <div className="w-px h-5 bg-gray-200 hidden sm:block" />
            <button
              onClick={() => { setSearch(''); setAssigneeFilter(''); setPeriodFilter('all') }}
              className="text-xs text-red-400 hover:text-red-600 font-medium"
            >
              ✕ Clear filters
            </button>
          </>
        )}

        <span className="ml-auto text-xs text-gray-400">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <ApprovalTable
        approvals={filtered}
        emptyMessage={getEmptyMessage(activeStatus, hasFilters)}
      />
    </div>
  )
}
