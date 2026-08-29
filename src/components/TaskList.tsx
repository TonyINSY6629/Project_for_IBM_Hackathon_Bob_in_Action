import type { Task } from '../App'

interface TaskListProps {
  tasks: Task[]
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

/**
 * Renders the full list of tasks with toggle and delete controls.
 */
export default function TaskList({ tasks, onToggle, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="task-list__empty">No tasks yet. Add one above.</p>
  }

  return (
    <ul className="task-list" aria-label="Task list">
      {tasks.map(task => (
        <li key={task.id} className={`task-item${task.done ? ' task-item--done' : ''}`}>
          <label className="task-item__label">
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => onToggle(task.id)}
              aria-label={`Mark "${task.text}" as ${task.done ? 'incomplete' : 'complete'}`}
            />
            <span className="task-item__text">{task.text}</span>
          </label>
          <button
            className="task-item__delete"
            onClick={() => onDelete(task.id)}
            aria-label={`Delete task: ${task.text}`}
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  )
}
