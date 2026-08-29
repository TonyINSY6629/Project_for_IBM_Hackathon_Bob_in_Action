import { useState } from 'react'

interface AddTaskFormProps {
  onAdd: (text: string) => void
}

/**
 * Controlled form for adding a new task.
 */
export default function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue('')
  }

  return (
    <form className="add-task-form" onSubmit={handleSubmit} aria-label="Add a new task">
      <label htmlFor="new-task" className="add-task-form__label">
        New task
      </label>
      <div className="add-task-form__row">
        <input
          id="new-task"
          type="text"
          className="add-task-form__input"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="What needs to be done?"
          aria-required="true"
        />
        <button type="submit" className="add-task-form__submit" disabled={!value.trim()}>
          Add
        </button>
      </div>
    </form>
  )
}
