# Architecture — Task Board (Sample Application)

This document describes the structure of the sample React application that IBM Bob will modify.
Read this before acting on any task.

---

## Component tree

```
App
├── Header          — page title and remaining-task count badge
├── AddTaskForm     — controlled input + submit button for creating tasks
└── TaskList
    └── TaskItem    — checkbox (toggle done), task text, remove button
                      (TaskItem is rendered inline inside TaskList, not a separate file)
```

---

## File layout

```
index.html                  entry HTML — mounts <div id="root">
src/
  main.tsx                  React entry point — renders <App /> into #root
  App.tsx                   root component — owns Task[] state; passes handlers down
  components/
    Header.tsx              props: { taskCount: number }
    TaskList.tsx            props: { tasks, onToggle, onDelete }
    AddTaskForm.tsx         props: { onAdd }
  styles/
    global.css              CSS custom properties (design tokens) + body reset
    app.css                 all component class styles
  test/
    setup.ts                @testing-library/jest-dom import (runs before every test)
  vite-env.d.ts             CSS module type declaration
vite.config.ts              Vite + Vitest configuration
tsconfig.app.json           TypeScript config for src/
```

---

## CSS variable convention

All colours, spacing tokens, and typography values are defined as CSS custom properties
on `:root` in `src/styles/global.css`. Every component uses only these variables — no
hardcoded colour values anywhere.

**Current tokens (light mode defaults):**

| Variable            | Purpose                        |
| ------------------- | ------------------------------ |
| `--color-bg`        | Page background                |
| `--color-surface`   | Card / panel background        |
| `--color-border`    | Border and divider colour      |
| `--color-text`      | Primary text                   |
| `--color-text-muted`| Secondary / placeholder text   |
| `--color-accent`    | Primary interactive colour     |
| `--color-accent-hover` | Hover state of accent       |
| `--color-danger`    | Destructive action colour      |
| `--color-done`      | Struck-through completed text  |

**Dark mode hook (already present, not yet wired up):**

`global.css` already contains a `body.dark { … }` block that overrides every token
for dark mode. To activate dark mode, add the class `dark` to `<body>`.

**Rule:** do not add new colour values outside these variables. If a new token is
needed, add it to both `:root` and `body.dark` in `global.css`.

---

## State model

`App.tsx` owns all state. The `Task` interface is:

```ts
interface Task {
  id: number      // Date.now() for new tasks; seeded integers for initial data
  text: string
  done: boolean
}
```

State is managed with `useState`. There is no external store, context, or backend.

---

## Testing setup

- Framework: **Vitest 3** with `jsdom` environment
- Setup file: `src/test/setup.ts` — imports `@testing-library/jest-dom`
- Test utilities: `@testing-library/react`, `@testing-library/user-event`
- Globals enabled (`describe`, `it`, `expect` available without imports)
- Test files follow the pattern: `src/**/*.test.tsx`
- Run with: `npm test`
