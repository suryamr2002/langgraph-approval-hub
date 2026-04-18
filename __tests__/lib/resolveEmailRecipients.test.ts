import { resolveEmailRecipients } from '@/lib/notifications'
import type { Approval } from '@/types'

const mockSingle = jest.fn()
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mockSingle,
        }),
      }),
    }),
  },
}))

const baseApproval: Approval = {
  id: 'test-id',
  agent_name: 'Test Agent',
  action_description: 'Do something',
  agent_reasoning: null,
  assignee: 'alice@example.com',
  assignee_type: 'person',
  escalate_to: null,
  timeout_minutes: 60,
  status: 'pending',
  decided_by: null,
  decision_note: null,
  created_at: new Date().toISOString(),
  expires_at: new Date().toISOString(),
}

describe('resolveEmailRecipients', () => {
  it('returns [assignee] for person type', async () => {
    const result = await resolveEmailRecipients({
      ...baseApproval,
      assignee_type: 'person',
      assignee: 'alice@example.com',
    })
    expect(result).toEqual(['alice@example.com'])
  })

  it('returns team member emails for team type', async () => {
    mockSingle.mockResolvedValue({
      data: { members: ['alice@example.com', 'bob@example.com'] },
      error: null,
    })
    const result = await resolveEmailRecipients({
      ...baseApproval,
      assignee_type: 'team',
      assignee: 'finance-team',
    })
    expect(result).toEqual(['alice@example.com', 'bob@example.com'])
  })

  it('returns [] when team is not found in Supabase', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } })
    const result = await resolveEmailRecipients({
      ...baseApproval,
      assignee_type: 'team',
      assignee: 'unknown-team',
    })
    expect(result).toEqual([])
  })
})
