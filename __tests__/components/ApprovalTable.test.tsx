/**
 * @jest-environment jsdom
 */
// __tests__/components/ApprovalTable.test.tsx
import { render, screen } from '@testing-library/react'
import ApprovalTable from '@/components/ApprovalTable'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('ApprovalTable', () => {
  it('shows default empty message when no approvals and no emptyMessage prop', () => {
    render(<ApprovalTable approvals={[]} />)
    expect(screen.getByText('No pending approvals')).toBeInTheDocument()
  })

  it('shows custom empty message when provided', () => {
    render(<ApprovalTable approvals={[]} emptyMessage="No escalated approvals — all clear" />)
    expect(screen.getByText('No escalated approvals — all clear')).toBeInTheDocument()
  })

  it('renders a row for each approval', () => {
    const approvals = [
      {
        id: '1',
        agent_name: 'Finance Agent',
        action_description: 'Process refund',
        assignee: 'team-a',
        assignee_type: 'team' as const,
        status: 'pending' as const,
        escalate_to: null,
        timeout_minutes: 60,
        decided_by: null,
        decision_note: null,
        created_at: new Date().toISOString(),
        decided_at: null,
        expires_at: new Date().toISOString(),
        agent_reasoning: null,
      },
    ]
    render(<ApprovalTable approvals={approvals} />)
    expect(screen.getByText('Finance Agent')).toBeInTheDocument()
    expect(screen.getByText('Process refund')).toBeInTheDocument()
  })
})
