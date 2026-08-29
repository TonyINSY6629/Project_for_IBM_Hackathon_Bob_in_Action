import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddTaskForm from './AddTaskForm'

describe('AddTaskForm', () => {
  it('renders the text input and submit button', () => {
    render(<AddTaskForm onAdd={vi.fn()} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument()
  })

  it('calls onAdd with the trimmed value when submitted', async () => {
    const onAdd = vi.fn()
    render(<AddTaskForm onAdd={onAdd} />)
    await userEvent.type(screen.getByRole('textbox'), '  Buy milk  ')
    await userEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(onAdd).toHaveBeenCalledOnce()
    expect(onAdd).toHaveBeenCalledWith('Buy milk')
  })

  it('does not call onAdd when the input is empty', async () => {
    const onAdd = vi.fn()
    render(<AddTaskForm onAdd={onAdd} />)
    await userEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('does not call onAdd when the input is only whitespace', async () => {
    const onAdd = vi.fn()
    render(<AddTaskForm onAdd={onAdd} />)
    await userEvent.type(screen.getByRole('textbox'), '   ')
    await userEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('clears the input after a successful submit', async () => {
    render(<AddTaskForm onAdd={vi.fn()} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'Walk the dog')
    await userEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(input).toHaveValue('')
  })
})
