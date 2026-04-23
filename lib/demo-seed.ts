// lib/demo-seed.ts
import { supabaseAdmin } from '@/lib/supabase'

const mins = (n: number) => n * 60 * 1000
const hrs  = (n: number) => n * 60 * mins(1)
const days = (n: number) => n * 24 * hrs(1)

export async function seedDemoData() {
  const now = Date.now()

  const mockApprovals = [
    // Escalated — arrived yesterday, already past its timeout
    {
      agent_name: 'Finance Agent',
      action_description: 'Process $4,200 refund batch for 12 customers who reported billing error on invoice #INV-2024-0441',
      agent_reasoning: '1. Detected 12 duplicate charges in billing system\n2. Cross-referenced with support tickets #4821–#4833\n3. Verified original payment receipts\n4. Calculated refund amounts per customer',
      assignee: 'finance-team',
      assignee_type: 'team',
      escalate_to: 'cfo@example.com',
      timeout_minutes: 60,
      status: 'escalated',
      created_at: new Date(now - days(1) - hrs(2)).toISOString(),
      expires_at: new Date(now - days(1) - hrs(1)).toISOString(),
    },
    // Pending — submitted 3 hours ago, expires in 2 days
    {
      agent_name: 'HR Agent',
      action_description: 'Send offer letters to 3 candidates: Backend Engineer, Product Designer, DevOps Lead',
      agent_reasoning: 'All 3 candidates cleared final round interviews. Compensation within approved bands.',
      assignee: 'priya@example.com',
      assignee_type: 'person',
      escalate_to: null,
      timeout_minutes: 2880,   // 2 days
      status: 'pending',
      created_at: new Date(now - hrs(3)).toISOString(),
      expires_at: new Date(now - hrs(3) + days(2)).toISOString(),
    },
    // Pending — submitted 45 minutes ago, short timeout
    {
      agent_name: 'Security Agent',
      action_description: 'Revoke access for 2 offboarded users: james.smith@example.com, rachel.chen@example.com',
      agent_reasoning: 'HR system flagged both users as offboarded on 2026-04-17. Standard access revocation protocol.',
      assignee: 'it-team',
      assignee_type: 'team',
      escalate_to: null,
      timeout_minutes: 30,
      status: 'pending',
      created_at: new Date(now - mins(45)).toISOString(),
      expires_at: new Date(now - mins(45) + mins(30)).toISOString(),
    },
    // Pending — submitted 2 hours ago
    {
      agent_name: 'Outreach Agent',
      action_description: 'Send re-engagement email campaign to 1,400 inactive customers (last active 90+ days)',
      agent_reasoning: 'Segment identified by CRM churn model. Template approved by marketing. Unsubscribe link included.',
      assignee: 'marketing@example.com',
      assignee_type: 'person',
      escalate_to: null,
      timeout_minutes: 60,
      status: 'pending',
      created_at: new Date(now - hrs(2)).toISOString(),
      expires_at: new Date(now - hrs(2) + mins(60)).toISOString(),
    },
    // Approved — created 4h ago, decided after 22 minutes (realistic response time)
    {
      agent_name: 'Finance Agent',
      action_description: 'Process $1,800 refund batch for 5 customers',
      agent_reasoning: 'Verified billing discrepancy from last quarter.',
      assignee: 'finance-team',
      assignee_type: 'team',
      escalate_to: null,
      timeout_minutes: 60,
      status: 'approved',
      decided_by: 'cfo@example.com',
      decision_note: 'Confirmed with billing team',
      created_at: new Date(now - hrs(4)).toISOString(),
      decided_at: new Date(now - hrs(4) + mins(22)).toISOString(),
      expires_at: new Date(now - hrs(4) + mins(60)).toISOString(),
    },
  ]

  await supabaseAdmin.from('approvals').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('approvals').insert(mockApprovals)
}
