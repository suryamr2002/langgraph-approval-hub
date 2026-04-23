// components/DashboardClient.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ApprovalTable from './ApprovalTable'
import type { Approval } from '@/types'

const TABS = [
  { label: 'All', status: null, href: '/' },
  { label: 'Pending', status: 'pending', href: '/?status=pending' },
  { label: 'Escalated', status: 'escalated', href: '/?status=escalated' },
]

function getEmptyMessage(activeStatus: string | null, search: string): string {
  if (search.trim()) return `No results for "${search.trim()}"`
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
  const [resetting, setResetting] = useState(false)

  // Auto-refresh every 15 s so the list stays live after approvals/rejections
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 15_000)
    return () => clearInterval(id)
  }, [router])

  const filtered = search.trim()
    ? approvals.filter(
        (a) =>
          a.agent_name.toLowerCase().includes(search.toLowerCase()) ||
          a.action_description.toLowerCase().includes(search.toLowerCase())
      )
    : approvals

  async function handleReset() {
    setResetting(true)
    await fetch('/api/demo/seed', { method: 'POST' })
    router.refresh()
    setResetting(false)
  }

  return (
    <div>
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
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search agents or actions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 w-56 focus:outline-none focus:ring-2 focus:ring-green-500"
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
      <ApprovalTable
        approvals={filtered}
        emptyMessage={getEmptyMessage(activeStatus, search)}
      />
    </div>
  )
}
