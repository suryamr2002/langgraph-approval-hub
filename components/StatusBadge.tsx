// components/StatusBadge.tsx
import type { ApprovalStatus } from '@/types'

const styles: Record<ApprovalStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  escalated: 'bg-red-100 text-red-700',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-600',
}

const labels: Record<ApprovalStatus, string> = {
  pending: 'Pending',
  escalated: 'Escalated',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
}

export default function StatusBadge({ status }: { status: ApprovalStatus }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
