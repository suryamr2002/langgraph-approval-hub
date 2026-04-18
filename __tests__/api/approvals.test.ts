// __tests__/api/approvals.test.ts
import { GET } from '@/app/api/approvals/route'
import { NextRequest } from 'next/server'

const mockData = [
  {
    id: '1',
    agent_name: 'Finance Agent',
    action_description: 'Refund',
    agent_reasoning: null,
    status: 'pending',
    assignee: 'team-a',
    assignee_type: 'team',
    escalate_to: null,
    timeout_minutes: 60,
    decided_by: null,
    decision_note: null,
    created_at: new Date().toISOString(),
    decided_at: null,
    expires_at: new Date(Date.now() + 3600000).toISOString(),
  },
  {
    id: '2',
    agent_name: 'HR Agent',
    action_description: 'Offer letters',
    agent_reasoning: null,
    status: 'escalated',
    assignee: 'hr@acme.com',
    assignee_type: 'person',
    escalate_to: null,
    timeout_minutes: 60,
    decided_by: null,
    decision_note: null,
    created_at: new Date().toISOString(),
    decided_at: null,
    expires_at: new Date(Date.now() + 3600000).toISOString(),
  },
  {
    id: '3',
    agent_name: 'Ops Agent',
    action_description: 'Deploy',
    agent_reasoning: null,
    status: 'approved',
    assignee: 'ops@acme.com',
    assignee_type: 'person',
    escalate_to: null,
    timeout_minutes: 60,
    decided_by: 'priya@acme.com',
    decision_note: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    decided_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString(),
  },
]

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: mockData, error: null })),
      })),
    })),
  },
}))

jest.mock('@/lib/escalation', () => ({
  checkAndEscalate: jest.fn().mockResolvedValue(undefined),
}))

describe('GET /api/approvals', () => {
  it('returns all approvals when no status filter', async () => {
    const req = new NextRequest('http://localhost/api/approvals')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.approvals).toHaveLength(3)
  })

  it('returns only filtered approvals when status=escalated', async () => {
    const req = new NextRequest('http://localhost/api/approvals?status=escalated')
    const res = await GET(req)
    const body = await res.json()
    expect(body.approvals).toHaveLength(1)
    expect(body.approvals[0].status).toBe('escalated')
  })

  it('stats are always global regardless of status filter', async () => {
    const req = new NextRequest('http://localhost/api/approvals?status=escalated')
    const res = await GET(req)
    const body = await res.json()
    expect(body.stats.pending).toBe(1)
    expect(body.stats.escalated).toBe(1)
  })

  it('returns stats with approved_today count', async () => {
    const req = new NextRequest('http://localhost/api/approvals')
    const res = await GET(req)
    const body = await res.json()
    expect(body.stats.approved_today).toBe(1)
  })
})
