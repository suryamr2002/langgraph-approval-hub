// components/Timeline.tsx
import type { NotificationLog } from '@/types'

const typeLabel: Record<string, string> = {
  slack: '💬 Slack notification sent',
  email: '📧 Email notification sent',
  escalation: '⚠️ Escalated — no response',
}

export default function Timeline({
  createdAt,
  notifications,
}: {
  createdAt: string
  notifications: NotificationLog[]
}) {
  const events = [
    { label: '🤖 Agent interrupted — approval requested', time: createdAt },
    ...notifications.map((n) => ({
      label: `${typeLabel[n.type] ?? n.type} to ${n.recipient}`,
      time: n.sent_at,
    })),
  ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

  return (
    <div className="space-y-3">
      {events.map((e, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
          <div>
            <p className="text-sm text-gray-700">{e.label}</p>
            <p className="text-xs text-gray-400">{new Date(e.time).toLocaleTimeString()}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
