// lib/demo-seed.ts
import { supabaseAdmin } from '@/lib/supabase'

export async function seedDemoData() {
  const now = new Date()

  const mockApprovals = [
    {
      agent_name: 'Finance Agent',
      action_description: 'Process $4,200 refund batch for 12 customers who reported billing error on invoice #INV-2024-0441',
      agent_reasoning: '1. Detected 12 duplicate charges in billing system\n2. Cross-referenced with support tickets #4821–#4833\n3. Verified original payment receipts\n4. Calculated refund amounts per customer',
      assignee: 'finance-team',
      assignee_type: 'team',
      escalate_to: 'cfo@example.com',
      timeout_minutes: 60,
      status: 'escalated',
      expires_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    },
    {
      agent_name: 'HR Agent',
      action_description: 'Send offer letters to 3 candidates: Backend Engineer, Product Designer, DevOps Lead',
      agent_reasoning: 'All 3 candidates cleared final round interviews. Compensation within approved bands.',
      assignee: 'priya@example.com',
      assignee_type: 'person',
      escalate_to: null,
      timeout_minutes: 120,
      status: 'pending',
      expires_at: new Date(now.getTime() + 110 * 60 * 1000).toISOString(),
    },
    {
      agent_name: 'Security Agent',
      action_description: 'Revoke access for 2 offboarded users: james.smith@example.com, rachel.chen@example.com',
      agent_reasoning: 'HR system flagged both users as offboarded on 2026-04-17. Standard access revocation protocol.',
      assignee: 'it-team',
      assignee_type: 'team',
      escalate_to: null,
      timeout_minutes: 30,
      status: 'pending',
      expires_at: new Date(now.getTime() + 25 * 60 * 1000).toISOString(),
    },
    {
      agent_name: 'Outreach Agent',
      action_description: 'Send re-engagement email campaign to 1,400 inactive customers (last active 90+ days)',
      agent_reasoning: 'Segment identified by CRM churn model. Template approved by marketing. Unsubscribe link included.',
      assignee: 'marketing@example.com',
      assignee_type: 'person',
      escalate_to: null,
      timeout_minutes: 60,
      status: 'pending',
      expires_at: new Date(now.getTime() + 58 * 60 * 1000).toISOString(),
    },
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
      decided_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      expires_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    },
  ]

  await supabaseAdmin.from('approvals').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabaseAdmin.from('approvals').insert(mockApprovals)
}
