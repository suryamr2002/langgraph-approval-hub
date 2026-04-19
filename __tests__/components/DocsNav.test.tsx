/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import DocsNav from '@/components/DocsNav'

// IntersectionObserver is not available in jsdom — stub it
beforeAll(() => {
  global.IntersectionObserver = class {
    observe() {}
    disconnect() {}
    unobserve() {}
  } as unknown as typeof IntersectionObserver
})

describe('DocsNav', () => {
  it('renders all top-level group labels', () => {
    render(<DocsNav />)
    expect(screen.getByText('THE PROBLEM')).toBeInTheDocument()
    expect(screen.getByText('GET RUNNING')).toBeInTheDocument()
    expect(screen.getByText('CODE PATTERNS')).toBeInTheDocument()
    expect(screen.getByText('ENTERPRISE')).toBeInTheDocument()
    expect(screen.getByText('REFERENCE')).toBeInTheDocument()
  })

  it('renders section links', () => {
    render(<DocsNav />)
    expect(screen.getByRole('link', { name: 'Why this exists' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '1. Deploy your hub' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'SDK parameters' })).toBeInTheDocument()
  })

  it('first section link is active by default', () => {
    render(<DocsNav />)
    const firstLink = screen.getByRole('link', { name: 'Why this exists' })
    expect(firstLink).toHaveClass('text-green-700')
  })
})
