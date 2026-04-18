// types/index.ts
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'escalated'
export type AssigneeType = 'person' | 'team'
export type NotificationType = 'slack' | 'email' | 'escalation'

export interface Approval {
  id: string
  agent_name: string
  action_description: string
  agent_reasoning: string | null
  assignee: string
  assignee_type: AssigneeType
  escalate_to: string | null
  timeout_minutes: number
  status: ApprovalStatus
  decided_by: string | null
  decision_note: string | null
  created_at: string
  decided_at?: string | null
  expires_at: string
}

export interface Team {
  id: string
  name: string
  members: string[]
}

export interface NotificationLog {
  id: string
  approval_id: string
  type: NotificationType
  sent_at: string
  recipient: string
}

export interface InterruptPayload {
  agent_name: string
  action_description: string
  agent_reasoning?: string
  assignee: string
  assignee_type: AssigneeType
  escalate_to?: string
  timeout_minutes?: number
}

export interface DecidePayload {
  decision: 'approved' | 'rejected'
  decided_by: string
  note?: string
}

export interface DashboardStats {
  pending: number
  escalated: number
  approved_today: number
  avg_response_minutes: number
}
