/** @jest-environment jsdom */
import { render, screen, fireEvent, act } from '@testing-library/react'
import CopyButton from '@/components/CopyButton'

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
  })
})

describe('CopyButton', () => {
  it('renders with "Copy" label', () => {
    render(<CopyButton text="some code" />)
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument()
  })

  it('calls clipboard.writeText with the correct text on click', async () => {
    render(<CopyButton text="pip install langgraph-approval-hub" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'pip install langgraph-approval-hub'
    )
  })

  it('shows "✓ Copied" immediately after click', async () => {
    render(<CopyButton text="some code" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })
    expect(screen.getByRole('button')).toHaveTextContent('✓ Copied')
  })
})
