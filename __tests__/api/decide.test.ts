// __tests__/api/decide.test.ts
import { POST } from '@/app/api/approvals/[id]/decide/route'
import { NextRequest } from 'next/server'

const mockApproval = {
  id: 'test-id',
  status: 'pending',
  agent_name: 'Finance Agent',
  action_description: 'Process refund',
  agent_reasoning: null,
  assignee: 'finance-team',
  assignee_type: 'team',
  escalate_to: null,
  timeout_minutes: 60,
  decided_by: null,
  decision_note: null,
  created_at: new Date().toISOString(),
  decided_at: null,
  expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
}

const mockUpdateEq = jest.fn(() => Promise.resolve({ error: null }))
const mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }))
const mockSingle = jest.fn(() => Promise.resolve({ data: mockApproval, error: null }))
const mockSelectEq = jest.fn(() => ({ single: mockSingle }))
const mockSelect = jest.fn(() => ({ eq: mockSelectEq }))

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: mockSelect,
      update: mockUpdate,
    })),
  },
}))

describe('POST /api/approvals/[id]/decide', () => {
  it('returns 400 for invalid decision value', async () => {
    const req = new NextRequest('http://localhost/api/approvals/test-id/decide', {
      method: 'POST',
      body: JSON.stringify({ decision: 'maybe', decided_by: 'priya@acme.com' }),
    })
    const res = await POST(req, { params: { id: 'test-id' } })
    expect(res.status).toBe(400)
  })

  it('returns 400 when decided_by is missing', async () => {
    const req = new NextRequest('http://localhost/api/approvals/test-id/decide', {
      method: 'POST',
      body: JSON.stringify({ decision: 'approved' }),
    })
    const res = await POST(req, { params: { id: 'test-id' } })
    expect(res.status).toBe(400)
  })

  it('returns 200 and updates status on valid approval decision', async () => {
    const req = new NextRequest('http://localhost/api/approvals/test-id/decide', {
      method: 'POST',
      body: JSON.stringify({ decision: 'approved', decided_by: 'priya@acme.com' }),
    })
    const res = await POST(req, { params: { id: 'test-id' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('approved')
  })

  it('returns 200 on valid rejection decision', async () => {
    const req = new NextRequest('http://localhost/api/approvals/test-id/decide', {
      method: 'POST',
      body: JSON.stringify({ decision: 'rejected', decided_by: 'priya@acme.com', note: 'Wrong amount' }),
    })
    const res = await POST(req, { params: { id: 'test-id' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('rejected')
  })
})
