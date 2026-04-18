// __tests__/api/audit.test.ts
import { GET } from '@/app/api/audit/route'
import { NextRequest } from 'next/server'

const mockAuditData = [
  {
    id: '1',
    agent_name: 'Finance Agent',
    action_description: 'Process refund',
    status: 'approved',
    decided_by: 'priya@acme.com',
    decided_at: new Date().toISOString(),
    decision_note: null,
    created_at: new Date().toISOString(),
  },
]

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        in: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({
              data: mockAuditData,
              error: null,
              count: 1,
            })),
          })),
        })),
      })),
    })),
  },
}))

describe('GET /api/audit', () => {
  it('returns resolved approvals', async () => {
    const req = new NextRequest('http://localhost/api/audit')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.records).toHaveLength(1)
    expect(body.records[0].status).toBe('approved')
  })

  it('returns total count', async () => {
    const req = new NextRequest('http://localhost/api/audit')
    const res = await GET(req)
    const body = await res.json()
    expect(body.total).toBe(1)
  })
})
