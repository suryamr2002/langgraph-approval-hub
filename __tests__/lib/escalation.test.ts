// __tests__/lib/escalation.test.ts
import { checkAndEscalate } from '@/lib/escalation'

const mockOverdue = {
  id: 'overdue-id',
  agent_name: 'Finance Agent',
  action_description: 'Process refund',
  agent_reasoning: null,
  assignee: 'finance-team',
  assignee_type: 'team' as const,
  escalate_to: 'cfo@acme.com',
  timeout_minutes: 60,
  status: 'pending' as const,
  decided_by: null,
  decision_note: null,
  created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  decided_at: null,
  expires_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
}

// Mocks are hoisted — define them inside the factory using jest.fn()
jest.mock('@/lib/supabase', () => {
  const mockUpdateEq = jest.fn(() => Promise.resolve({ error: null }))
  const mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }))
  const mockLt = jest.fn(() => Promise.resolve({ data: [], error: null }))
  const mockIn = jest.fn(() => ({ lt: mockLt }))
  const mockSelect = jest.fn(() => ({ in: mockIn }))
  const mockFrom = jest.fn(() => ({ select: mockSelect, update: mockUpdate }))
  return {
    supabaseAdmin: { from: mockFrom },
    __mocks: { mockFrom, mockSelect, mockIn, mockLt, mockUpdate, mockUpdateEq },
  }
})

jest.mock('@/lib/notifications', () => ({
  sendEscalationNotification: jest.fn(() => Promise.resolve()),
}))

function getSupabaseMocks() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/lib/supabase').__mocks as {
    mockFrom: jest.Mock
    mockSelect: jest.Mock
    mockIn: jest.Mock
    mockLt: jest.Mock
    mockUpdate: jest.Mock
    mockUpdateEq: jest.Mock
  }
}

describe('checkAndEscalate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { mockLt, mockUpdateEq } = getSupabaseMocks()
    mockLt.mockResolvedValue({ data: [mockOverdue], error: null })
    mockUpdateEq.mockResolvedValue({ error: null })
  })

  it('queries for pending approvals past their expires_at', async () => {
    await checkAndEscalate()
    const { mockFrom, mockSelect, mockIn, mockLt } = getSupabaseMocks()
    expect(mockFrom).toHaveBeenCalledWith('approvals')
    expect(mockSelect).toHaveBeenCalled()
    expect(mockIn).toHaveBeenCalledWith('status', ['pending'])
    expect(mockLt).toHaveBeenCalledWith('expires_at', expect.any(String))
  })

  it('marks overdue approvals as escalated', async () => {
    await checkAndEscalate()
    const { mockUpdate, mockUpdateEq } = getSupabaseMocks()
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'escalated' })
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'overdue-id')
  })

  it('calls sendEscalationNotification for each overdue approval', async () => {
    const { sendEscalationNotification } = require('@/lib/notifications')
    await checkAndEscalate()
    expect(sendEscalationNotification).toHaveBeenCalledWith(mockOverdue)
  })

  it('does nothing when no overdue approvals exist', async () => {
    const { mockLt } = getSupabaseMocks()
    mockLt.mockResolvedValue({ data: [], error: null })
    const { sendEscalationNotification } = require('@/lib/notifications')
    await checkAndEscalate()
    expect(sendEscalationNotification).not.toHaveBeenCalled()
  })
})
