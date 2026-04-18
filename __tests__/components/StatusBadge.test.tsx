/**
 * @jest-environment jsdom
 */
// __tests__/components/StatusBadge.test.tsx
import { render, screen } from '@testing-library/react'
import StatusBadge from '@/components/StatusBadge'

describe('StatusBadge', () => {
  it('renders Pending', () => {
    render(<StatusBadge status="pending" />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('renders Approved', () => {
    render(<StatusBadge status="approved" />)
    expect(screen.getByText('Approved')).toBeInTheDocument()
  })

  it('renders Escalated', () => {
    render(<StatusBadge status="escalated" />)
    expect(screen.getByText('Escalated')).toBeInTheDocument()
  })

  it('renders Rejected', () => {
    render(<StatusBadge status="rejected" />)
    expect(screen.getByText('Rejected')).toBeInTheDocument()
  })

  it('renders Expired', () => {
    render(<StatusBadge status="expired" />)
    expect(screen.getByText('Expired')).toBeInTheDocument()
  })
})
