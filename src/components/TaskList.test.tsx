import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskList from './TaskList'
import type { Task } from '../App'

const TASKS: Task[] = [
  { id: 1, text: 'Review pull request', done: false },
  { id: 2, text: 'Write unit tests', done: true },
]

describe('TaskList', () => {
  it('renders all tasks', () => {
    render(<TaskList tasks={TASKS} onToggle={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Review pull request')).toBeInTheDocument()
    expect(screen.getByText('Write unit tests')).toBeInTheDocument()
  })

  it('shows the empty state message when there are no tasks', () => {
    render(<TaskList tasks={[]} onToggle={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument()
  })

  it('calls onToggle with the correct id when a checkbox is clicked', async () => {
    const onToggle = vi.fn()
    render(<TaskList tasks={TASKS} onToggle={onToggle} onDelete={vi.fn()} />)
    const checkbox = screen.getByLabelText(/mark "review pull request"/i)
    await userEvent.click(checkbox)
    expect(onToggle).toHaveBeenCalledOnce()
    expect(onToggle).toHaveBeenCalledWith(1)
  })

  it('calls onDelete with the correct id when Remove is clicked', async () => {
    const onDelete = vi.fn()
    render(<TaskList tasks={TASKS} onToggle={vi.fn()} onDelete={onDelete} />)
    const deleteButton = screen.getByLabelText(/delete task: review pull request/i)
    await userEvent.click(deleteButton)
    expect(onDelete).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledWith(1)
  })

  it('renders a done task with the correct aria-label', () => {
    render(<TaskList tasks={TASKS} onToggle={vi.fn()} onDelete={vi.fn()} />)
    // task with done:true shows "as incomplete" (toggling it would make it incomplete)
    expect(
      screen.getByLabelText(/mark "write unit tests" as incomplete/i)
    ).toBeInTheDocument()
  })
})
