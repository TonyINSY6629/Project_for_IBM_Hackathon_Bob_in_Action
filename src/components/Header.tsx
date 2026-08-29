interface HeaderProps {
  taskCount: number
}

/**
 * Site header — displays the app title and the count of remaining tasks.
 */
export default function Header({ taskCount }: HeaderProps) {
  return (
    <header className="header">
      <h1 className="header__title">Task Board</h1>
      <span className="header__badge" aria-label={`${taskCount} tasks remaining`}>
        {taskCount} remaining
      </span>
    </header>
  )
}
