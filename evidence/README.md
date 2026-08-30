# Evidence — IBM Bob 2.0 Task Session

Screenshots from the Bob Agent mode session that executed the
[`docs/bob-implementation-plan.md`](../docs/bob-implementation-plan.md)
against the Task Board sample application.

---

## Screenshots

| File | What it shows |
| --- | --- |
| [`Part-1_Sub-task_4_Screenshot1.jpg`](Part-1_Sub-task_4_Screenshot1.jpg) | **Document understanding** — Bob reads all three project docs (`docs/product-requirements.md`, `docs/architecture.md`, `docs/accessibility.md`) and confirms understanding of the component tree, CSS variable convention, and WCAG AA checklist before writing any code |
| [`Part-1_Sub-task_4_Screenshot2.1.jpg`](Part-1_Sub-task_4_Screenshot2.1.jpg) | **Implementation plan — diff-analyst** — Bob's plan for the dark mode toggle subagent: adds `isDark` boolean state to `Header.tsx`, wires toggle button with `aria-label` and `aria-pressed`, adds `.header__theme-toggle` styles using only CSS variables, creates `CHANGELOG.md` |
| [`Part-1_Sub-task_4_Screenshot2.2.jpg`](Part-1_Sub-task_4_Screenshot2.2.jpg) | **Implementation plan — deps-scanner** — Bob's accessibility audit plan: identifies `--color-text-muted` contrast failure (3.8:1 on surface), plans focus-ring fix for buttons, confirms all ARIA labels and semantic HTML pass, verifies dark mode toggle a11y |
| [`Part-1_Sub-task_4_Screenshot2.3.jpg`](Part-1_Sub-task_4_Screenshot2.3.jpg) | **Implementation plan — test-runner** — Bob's Vitest test plan: three test files covering `Header.test.tsx`, `AddTaskForm.test.tsx`, and `TaskList.test.tsx`, using `@testing-library/react` and `@testing-library/user-event` |
| [`Part-1_Sub-task_4_Screenshot2.4.jpg`](Part-1_Sub-task_4_Screenshot2.4.jpg) | **Implementation plan — doc-writer + custom rules** — Bob's JSDoc and README update plan, plus confirmation that all five custom rules are enforced throughout the session (CSS variables only, conventional commits, no scope creep, decision before destructive action, one subagent per concern) |

---

## IBM Bob 2.0 capabilities demonstrated

| Capability | Evidence |
| --- | --- |
| **Document understanding** | Screenshot 1 — Bob reads and summarises all three project docs before acting |
| **Agent mode** | All screenshots — Bob operates autonomously across the full task |
| **Subagents** | Screenshots 2.1–2.4 — four isolated subagents: `diff-analyst`, `deps-scanner`, `test-runner`, `doc-writer` |
| **Parallel tasks** | Screenshots 2.1–2.4 — all four subagents planned and executed concurrently |
| **Custom rules** | Screenshot 2.4 — five custom rules explicitly acknowledged and enforced |
