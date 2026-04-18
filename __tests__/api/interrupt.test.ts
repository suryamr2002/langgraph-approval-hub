// __tests__/api/interrupt.test.ts
// __tests__/api/interrupt.test.ts
import { POST } from '@/app/api/interrupt/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 'test-uuid',
              agent_name: 'Finance Agent',
              action_description: 'Process refund',
              assignee: 'finance-team',
              assignee_type: 'team',
              status: 'pending',
              expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            },
            error: null,
          })),
        })),
      })),
    })),
  },
}))

jest.mock('@/lib/notifications', () => ({
  sendNotifications: jest.fn(() => Promise.resolve()),
}))

describe('POST /api/interrupt', () => {
  beforeEach(() => {
    process.env.API_SECRET_TOKEN = 'test-token'
  })

  it('returns 401 when Authorization header is missing', async () => {
    const req = new NextRequest('http://localhost/api/interrupt', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when required fields are missing', async () => {
    const req = new NextRequest('http://localhost/api/interrupt', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token' },
      body: JSON.stringify({ agent_name: 'Finance Agent' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('creates approval and returns 201 with approval_id', async () => {
    const req = new NextRequest('http://localhost/api/interrupt', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_name: 'Finance Agent',
        action_description: 'Process $4,200 refund',
        assignee: 'finance-team',
        assignee_type: 'team',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.approval_id).toBe('test-uuid')
  })
})
