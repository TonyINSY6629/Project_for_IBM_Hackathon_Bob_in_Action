import { render, screen } from '@testing-library/react'
import Header from './Header'

describe('Header', () => {
  it('renders the app title', () => {
    render(<Header taskCount={3} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Task Board')
  })

  it('displays the correct task count', () => {
    render(<Header taskCount={5} />)
    expect(screen.getByText(/5 remaining/i)).toBeInTheDocument()
  })

  it('updates the badge aria-label with the current count', () => {
    render(<Header taskCount={2} />)
    expect(screen.getByLabelText('2 tasks remaining')).toBeInTheDocument()
  })

  it('shows zero remaining when all tasks are done', () => {
    render(<Header taskCount={0} />)
    expect(screen.getByText(/0 remaining/i)).toBeInTheDocument()
    expect(screen.getByLabelText('0 tasks remaining')).toBeInTheDocument()
  })
})
