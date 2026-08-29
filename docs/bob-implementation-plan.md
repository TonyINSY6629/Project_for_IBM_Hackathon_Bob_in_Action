# Bob Implementation Plan — Task Board

This document describes exactly what IBM Bob 2.0 is asked to do, how it divides the
work into subagents, and what evidence to capture. It is both a deliverable and the
script used during the hackathon demo.

---

## Top-level request

Ask Bob Agent mode the following:

> "I have a React + TypeScript task-board application. I need you to:
> 1. Add a dark mode toggle using the CSS variable system already in place.
> 2. Review and fix any WCAG 2.1 AA accessibility issues.
> 3. Write Vitest unit tests for all three components.
> 4. Update the README and add JSDoc comments to all components.
>
> Before starting, please read `docs/product-requirements.md`,
> `docs/architecture.md`, and `docs/accessibility.md` so your work
> follows the project's conventions."

---

## Step 1 — Document understanding

Before any code is written, Bob reads:

| Document | Purpose |
| --- | --- |
| `docs/product-requirements.md` | Understand the project goal, agent roles, and success criteria |
| `docs/architecture.md` | Learn the component tree, file layout, and CSS variable convention |
| `docs/accessibility.md` | Learn the WCAG AA checklist items to verify and fix |

**Screenshot to capture:** Bob's task summary after it confirms it has read all three documents.

---

## Step 2 — Implementation plan

Bob uses Agent mode to inspect the codebase and produce a plan before acting.
The plan must name the four subagents and their responsibilities.

**Screenshot to capture:** Bob's full implementation plan, showing the subagent breakdown.

---

## Step 3 — Parallel subagent execution

Bob assigns the work to four subagents running in parallel:

### `diff-analyst` — Dark mode

**Task:** Add a dark mode toggle to the application.

**Instructions for Bob:**
- Add a toggle button to `Header.tsx` that adds/removes the class `dark` on `document.body`.
- The `body.dark` CSS block already exists in `src/styles/global.css` — do not change the token values, only wire up the toggle.
- The button must have `aria-label="Switch to dark mode"` / `aria-label="Switch to light mode"` depending on current state.
- Add `aria-pressed` to communicate toggle state to screen readers.
- Update `CHANGELOG.md` (create it if it does not exist) with a `feat` entry describing the dark mode addition.
- Record all files changed.

**Expected output:**
- Modified `src/components/Header.tsx`
- Modified or created `CHANGELOG.md`
- List of changed files

### `deps-scanner` — Dependency review

**Task:** Check `package.json` and `package-lock.json` for issues.

**Instructions for Bob:**
- List all direct and dev dependencies with their current and latest versions.
- Flag any dependency that has a major version bump available (breaking change risk).
- Flag any dependency with a known security advisory.
- Do NOT run `npm audit fix --force` without explicit approval — raise a decision card instead.
- Record findings as a dependency report.

**Expected output:**
- Dependency report (versions, flags, recommendations)
- At least one `question` event if a breaking change is found (decision required)

### `test-runner` — Unit tests

**Task:** Write and run Vitest unit tests for all three components.

**Instructions for Bob:**
- Create `src/components/Header.test.tsx` — test that the task count renders correctly.
- Create `src/components/AddTaskForm.test.tsx` — test that submitting the form calls `onAdd` with the correct value, and that submitting an empty string does not call `onAdd`.
- Create `src/components/TaskList.test.tsx` — test that tasks render, that checking a checkbox calls `onToggle`, and that clicking Remove calls `onDelete`.
- Use `@testing-library/react` and `@testing-library/user-event` throughout.
- Run `npm test -- --run` and capture the full output.
- Report pass/fail counts per test file.

**Expected output:**
- Three new test files
- Test run output showing all tests passing

### `doc-writer` — Documentation

**Task:** Update README and add JSDoc comments.

**Instructions for Bob:**
- Add JSDoc `/** … */` comments to all exported functions in `App.tsx`, `Header.tsx`, `TaskList.tsx`, and `AddTaskForm.tsx`.
  - Each comment must describe what the component does and document its props.
- Update the project `README.md` (the root one — not `docs/`) to reflect:
  - The dark mode toggle that was added.
  - How to run the tests.
  - The project structure (component list).
- Verify that every change listed in `CHANGELOG.md` by `diff-analyst` is accurate.

**Expected output:**
- Updated component files with JSDoc
- Updated `README.md`
- Verified `CHANGELOG.md`

---

## Step 4 — Evidence to capture

For each subagent, screenshot:

| Screenshot | Filename |
| --- | --- |
| Bob's full implementation plan (before any code is written) | `evidence/01-bob-plan.png` |
| `diff-analyst` task summary on completion | `evidence/02-diff-analyst-complete.png` |
| `deps-scanner` decision card (breaking change question) | `evidence/03-deps-scanner-decision.png` |
| `test-runner` test output (all passing) | `evidence/04-test-runner-results.png` |
| `doc-writer` task summary on completion | `evidence/05-doc-writer-complete.png` |
| Final Bob session summary | `evidence/06-final-summary.png` |

Save all screenshots to `evidence/`. Create `evidence/README.md` listing each file.

---

## Step 5 — Completion criteria

The Bob session is complete when:

- [ ] `body.dark` is toggled by a keyboard-accessible button in the header
- [ ] All WCAG AA checklist items in `docs/accessibility.md` are either Pass or Fixed
- [ ] `src/components/Header.test.tsx` exists and passes
- [ ] `src/components/AddTaskForm.test.tsx` exists and passes
- [ ] `src/components/TaskList.test.tsx` exists and passes
- [ ] `npm test -- --run` exits 0
- [ ] `CHANGELOG.md` exists with at least one entry
- [ ] `README.md` reflects the current state of the app
- [ ] JSDoc comments added to all four component files
- [ ] All evidence screenshots saved to `evidence/`

---

## Custom rules for Bob

Apply these rules throughout the session:

1. **CSS variables only** — never add a hardcoded colour value. All colours go through the token system in `global.css`.
2. **Commit categorisation** — use conventional commit prefixes: `feat:`, `fix:`, `test:`, `docs:`, `chore:`.
3. **No scope creep** — do not refactor components beyond what is required for the task.
4. **Decision before destructive actions** — if any action could break existing behaviour (e.g. a major dependency upgrade), raise a question rather than acting.
5. **One subagent per concern** — do not let one subagent reach into another's files without a documented reason.
