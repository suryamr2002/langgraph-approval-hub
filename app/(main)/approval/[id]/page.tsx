// app/(main)/approval/[id]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import StatusBadge from '@/components/StatusBadge'
import Timeline from '@/components/Timeline'
import type { Approval, NotificationLog } from '@/types'
import { formatDateTime } from '@/lib/formatDate'

type ApprovalWithLogs = Approval & { notifications_log: NotificationLog[] }

export default function ApprovalDetailPage({ params }: { params: { id: string } }) {
  const [approval, setApproval] = useState<ApprovalWithLogs | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/approvals/${params.id}`)
      .then((r) => r.json())
      .then(setApproval)
  }, [params.id])

  async function decide(decision: 'approved' | 'rejected') {
    if (!approval) return
    setSubmitting(true)
    setError('')
    const res = await fetch(`/api/approvals/${params.id}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        decided_by: approval.assignee,
        note,
      }),
    })
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Something went wrong')
      setSubmitting(false)
      return
    }
    // Hard navigation — bypasses Next.js router cache entirely, always loads fresh data
    window.location.href = '/'
  }

  if (!approval) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        Loading...
      </div>
    )
  }

  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== 'true'
  const isResolved = !['pending', 'escalated'].includes(approval.status)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => { window.location.href = '/' }}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back
        </button>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">{approval.agent_name}</h1>
        <StatusBadge status={approval.status} />
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">What the agent wants to do</h3>
            <p className="text-sm text-gray-800 bg-gray-50 rounded-md p-3 leading-relaxed">
              {approval.action_description}
            </p>
          </div>

          {approval.agent_reasoning && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Agent reasoning</h3>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-md p-3 whitespace-pre-wrap font-mono leading-relaxed">
                {approval.agent_reasoning}
              </p>
            </div>
          )}

          {!isResolved && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-gray-700">Your decision</h3>
                {demoMode && (
                  <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                    🔒 Read-only demo
                  </span>
                )}
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={demoMode}
                placeholder={demoMode ? 'Read-only demo — deploy your own to add notes' : 'Optional note (saved to audit log)...'}
                className={`w-full border border-gray-200 rounded-md p-3 text-sm text-gray-900 placeholder:text-gray-400 resize-none h-20 mb-3 focus:outline-none focus:ring-2 focus:ring-green-200 ${demoMode ? 'bg-gray-50 cursor-not-allowed opacity-60' : ''}`}
              />
              {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => decide('approved')}
                  disabled={submitting || demoMode}
                  title={demoMode ? 'Read-only demo — deploy your own to approve' : undefined}
                  className={`flex-1 bg-green-500 text-white rounded-md py-2.5 font-semibold text-sm transition-colors ${demoMode ? 'opacity-40 cursor-not-allowed' : 'hover:bg-green-600 disabled:opacity-50'}`}
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => decide('rejected')}
                  disabled={submitting || demoMode}
                  title={demoMode ? 'Read-only demo — deploy your own to reject' : undefined}
                  className={`flex-1 border border-red-300 text-red-600 rounded-md py-2.5 font-semibold text-sm transition-colors ${demoMode ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-50 disabled:opacity-50'}`}
                >
                  ✗ Reject
                </button>
              </div>
              {demoMode && (
                <p className="text-xs text-center text-gray-400 mt-3">
                  <a href="https://github.com/suryamr2002/langgraph-approval-hub" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
                    Deploy your own instance →
                  </a>
                </p>
              )}
            </div>
          )}

          {isResolved && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-sm text-gray-600">
                Decision: <StatusBadge status={approval.status} />
                {approval.decided_by && (
                  <span> by <strong>{approval.decided_by}</strong></span>
                )}
                {approval.decision_note && (
                  <span className="text-gray-400"> — &ldquo;{approval.decision_note}&rdquo;</span>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">Details</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400 mb-0.5">Assigned to</dt>
                <dd className="text-gray-800">{approval.assignee}</dd>
              </div>
              {approval.escalate_to && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400 mb-0.5">Escalates to</dt>
                  <dd className="text-gray-800">{approval.escalate_to}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400 mb-0.5">Expires at</dt>
                <dd className="text-gray-800">{formatDateTime(approval.expires_at)}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">Timeline</h3>
            <Timeline
              createdAt={approval.created_at}
              notifications={approval.notifications_log ?? []}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
