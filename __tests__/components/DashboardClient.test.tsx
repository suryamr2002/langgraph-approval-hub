/**
 * @jest-environment jsdom
 */
// __tests__/components/DashboardClient.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DashboardClient from '@/components/DashboardClient'
import type { Approval } from '@/types'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

const makeApproval = (overrides: Partial<Approval> = {}): Approval => ({
  id: '1',
  agent_name: 'Finance Agent',
  action_description: 'Process refund',
  agent_reasoning: null,
  assignee: 'finance-team',
  assignee_type: 'team',
  escalate_to: null,
  timeout_minutes: 60,
  status: 'pending',
  decided_by: null,
  decision_note: null,
  created_at: new Date().toISOString(),
  decided_at: null,
  expires_at: new Date(Date.now() + 3600000).toISOString(),
  ...overrides,
})

describe('DashboardClient', () => {
  beforeEach(() => {
    mockRefresh.mockClear()
  })

  it('renders all approvals by default', () => {
    const approvals = [makeApproval({ agent_name: 'Finance Agent' }), makeApproval({ id: '2', agent_name: 'HR Agent' })]
    render(<DashboardClient approvals={approvals} activeStatus={null} demoMode={false} />)
    expect(screen.getByText('Finance Agent')).toBeInTheDocument()
    expect(screen.getByText('HR Agent')).toBeInTheDocument()
  })

  it('filters by search query against agent_name', () => {
    const approvals = [makeApproval({ agent_name: 'Finance Agent' }), makeApproval({ id: '2', agent_name: 'HR Agent' })]
    render(<DashboardClient approvals={approvals} activeStatus={null} demoMode={false} />)
    fireEvent.change(screen.getByPlaceholderText('Search agents or actions…'), { target: { value: 'finance' } })
    expect(screen.getByText('Finance Agent')).toBeInTheDocument()
    expect(screen.queryByText('HR Agent')).not.toBeInTheDocument()
  })

  it('filters by search query against action_description', () => {
    const approvals = [
      makeApproval({ agent_name: 'Finance Agent', action_description: 'Process refund' }),
      makeApproval({ id: '2', agent_name: 'HR Agent', action_description: 'Send offer letters' }),
    ]
    render(<DashboardClient approvals={approvals} activeStatus={null} demoMode={false} />)
    fireEvent.change(screen.getByPlaceholderText('Search agents or actions…'), { target: { value: 'offer' } })
    expect(screen.getByText('HR Agent')).toBeInTheDocument()
    expect(screen.queryByText('Finance Agent')).not.toBeInTheDocument()
  })

  it('shows filter-aware empty message for escalated tab', () => {
    render(<DashboardClient approvals={[]} activeStatus="escalated" demoMode={false} />)
    expect(screen.getByText('No escalated approvals — all clear')).toBeInTheDocument()
  })

  it('shows search empty message when search returns nothing', () => {
    const approvals = [makeApproval()]
    render(<DashboardClient approvals={approvals} activeStatus={null} demoMode={false} />)
    fireEvent.change(screen.getByPlaceholderText('Search agents or actions…'), { target: { value: 'zzz' } })
    expect(screen.getByText('No results for "zzz"')).toBeInTheDocument()
  })

  it('does not show reset button when demoMode is false', () => {
    render(<DashboardClient approvals={[]} activeStatus={null} demoMode={false} />)
    expect(screen.queryByTitle('Reset demo data')).not.toBeInTheDocument()
  })

  it('shows reset button when demoMode is true', () => {
    render(<DashboardClient approvals={[]} activeStatus={null} demoMode={true} />)
    expect(screen.getByTitle('Reset demo data')).toBeInTheDocument()
  })

  it('calls /api/demo/seed on reset click and refreshes', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true })
    render(<DashboardClient approvals={[]} activeStatus={null} demoMode={true} />)
    fireEvent.click(screen.getByTitle('Reset demo data'))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/demo/seed', { method: 'POST' })
      expect(mockRefresh).toHaveBeenCalled()
    })
  })
})
