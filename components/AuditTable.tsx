// components/AuditTable.tsx
import StatusBadge from './StatusBadge'
import type { ApprovalStatus } from '@/types'

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

export default function AuditTable({ records }: { records: AuditRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        No resolved approvals yet.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-[1.2fr_1.5fr_0.8fr_1fr_1.2fr] gap-4 px-4 py-2 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
        <div>Timestamp</div>
        <div>Agent / Action</div>
        <div>Decision</div>
        <div>Decided by</div>
        <div>Note</div>
      </div>
      {records.map((r) => (
        <div
          key={r.id}
          className="grid grid-cols-[1.2fr_1.5fr_0.8fr_1fr_1.2fr] gap-4 px-4 py-3 border-b border-gray-50 items-center hover:bg-gray-50 transition-colors"
        >
          <div className="text-xs text-gray-400">
            {r.decided_at ? new Date(r.decided_at).toLocaleString() : '—'}
          </div>
          <div>
            <div className="font-medium text-sm text-gray-900">{r.agent_name}</div>
            <div className="text-xs text-gray-500 truncate">{r.action_description}</div>
          </div>
          <div><StatusBadge status={r.status} /></div>
          <div className="text-sm text-gray-700">{r.decided_by ?? '—'}</div>
          <div className="text-xs text-gray-400">{r.decision_note ?? '—'}</div>
        </div>
      ))}
    </div>
  )
}
