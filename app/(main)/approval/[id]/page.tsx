// app/(main)/approval/[id]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/StatusBadge'
import Timeline from '@/components/Timeline'
import type { Approval, NotificationLog } from '@/types'

type ApprovalWithLogs = Approval & { notifications_log: NotificationLog[] }

export default function ApprovalDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
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
    setSubmitting(true)
    setError('')
    const res = await fetch(`/api/approvals/${params.id}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        decided_by: 'approver@example.com',
        note,
      }),
    })
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Something went wrong')
      setSubmitting(false)
      return
    }
    router.push('/')
  }

  if (!approval) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        Loading...
      </div>
    )
  }

  const isResolved = !['pending', 'escalated'].includes(approval.status)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/')}
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
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Your decision</h3>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note (saved to audit log)..."
                className="w-full border border-gray-200 rounded-md p-3 text-sm resize-none h-20 mb-3 focus:outline-none focus:ring-2 focus:ring-green-200"
              />
              {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => decide('approved')}
                  disabled={submitting}
                  className="flex-1 bg-green-500 text-white rounded-md py-2.5 font-semibold text-sm hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => decide('rejected')}
                  disabled={submitting}
                  className="flex-1 border border-red-300 text-red-600 rounded-md py-2.5 font-semibold text-sm hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  ✗ Reject
                </button>
              </div>
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
                <dd className="text-gray-800">{new Date(approval.expires_at).toLocaleTimeString()}</dd>
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
