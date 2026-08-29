import { useState } from 'react'
import Header from './components/Header'
import TaskList from './components/TaskList'
import AddTaskForm from './components/AddTaskForm'
import './styles/app.css'

export interface Task {
  id: number
  text: string
  done: boolean
}

const INITIAL_TASKS: Task[] = [
  { id: 1, text: 'Review pull request #42', done: false },
  { id: 2, text: 'Write unit tests for auth module', done: false },
  { id: 3, text: 'Update project README', done: true },
]

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)

  function addTask(text: string) {
    setTasks(prev => [
      ...prev,
      { id: Date.now(), text, done: false },
    ])
  }

  function toggleTask(id: number) {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)),
    )
  }

  function deleteTask(id: number) {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="app">
      <Header taskCount={tasks.filter(t => !t.done).length} />
      <main className="app__main">
        <AddTaskForm onAdd={addTask} />
        <TaskList tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} />
      </main>
    </div>
  )
}
