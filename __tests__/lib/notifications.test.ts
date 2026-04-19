// __tests__/lib/notifications.test.ts
import { sendNotifications, sendEscalationNotification } from '@/lib/notifications'
import type { Approval } from '@/types'

jest.mock('resend', () => ({
  Resend: jest.fn(() => ({
    emails: {
      send: jest.fn(() => Promise.resolve({ id: 'email-id', from: '', to: '', created_at: '' })),
    },
  })),
}))

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

global.fetch = jest.fn()

const mockApproval: Approval = {
  id: 'test-uuid',
  agent_name: 'Finance Agent',
  action_description: 'Process $4,200 refund',
  agent_reasoning: 'Verified 12 duplicate charges',
  assignee: 'finance-team',
  assignee_type: 'team',
  escalate_to: 'cfo@acme.com',
  timeout_minutes: 60,
  status: 'pending',
  decided_by: null,
  decision_note: null,
  created_at: new Date().toISOString(),
  decided_at: null,
  expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
}

describe('sendNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test'
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
    mockSingle.mockResolvedValue({
      data: { members: ['finance@acme.com'] },
      error: null,
    })
  })

  it('calls Slack webhook with approval details', async () => {
    await sendNotifications(mockApproval)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://hooks.slack.com/test',
      expect.objectContaining({ method: 'POST' })
    )
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
    expect(body.text).toContain('Finance Agent')
    expect(body.text).toContain('Process $4,200 refund')
  })

  it('does not throw if Slack webhook URL is not configured', async () => {
    delete process.env.SLACK_WEBHOOK_URL
    await expect(sendNotifications(mockApproval)).resolves.not.toThrow()
  })
})

describe('sendEscalationNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test'
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
  })

  it('sends escalation message mentioning escalate_to', async () => {
    await sendEscalationNotification(mockApproval)
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
    expect(body.text).toContain('Escalated')
    expect(body.text).toContain('cfo@acme.com')
  })

  it('does nothing if escalate_to is null', async () => {
    const noEscalation = { ...mockApproval, escalate_to: null }
    await sendEscalationNotification(noEscalation)
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
