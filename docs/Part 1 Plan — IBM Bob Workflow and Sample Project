# Part 1 Plan — IBM Bob Workflow and Sample Project

## Overview

**Goal:** Produce everything that feeds Parts 2 and 3 — a sample React app, supporting documentation, a Bob implementation plan, a realistic `demo-events.json`, and evidence screenshots.

**Scope:** You own the `feature/bob-workflow` branch. Nothing here touches `src/attention/`, `src/adapters/`, or `src/components/` — those are Parts 2 and 3.

**Non-goals:** No backend, no auth, no database, no watsonx integration.

**Integration contract:** `demo-events.json` must use the exact event shape from the README. Agent IDs are `diff-analyst`, `deps-scanner`, `test-runner`, `doc-writer`. Parts 2 and 3 depend on this file; do not change the shape without notifying the team.

---

## Sub-tasks

---

### Sub-task 1 — Create the sample React application

**Intent:** Give Bob a real, small codebase to work on. It must be minimal enough to implement in one session but realistic enough to demonstrate dark mode, accessibility, tests, and documentation.

**Expected outcomes:**
- A working React + TypeScript + Vite app at the repo root.
- Light mode only, no dark mode yet — Bob adds that.
- At least three components so Bob has something meaningful to touch.
- Basic CSS using variables so dark mode is a CSS variable swap.
- No tests yet — Bob adds those.
- `README.md` in the app is minimal — Bob updates it.

**Todo list:**
1. Run `npm create vite@latest . -- --template react-ts` at the repo root (or scaffold manually if Vite is already installed).
2. Replace the default Vite boilerplate with a small but realistic app — suggested: a task list with a header, a list of items, and an add-item form.
3. Style with plain CSS using CSS custom properties (`--color-bg`, `--color-text`, `--color-accent`) so dark mode is a single class swap on `<body>`.
4. Confirm `npm install && npm run dev` opens the app with no errors.
5. Commit to `feature/bob-workflow` with message `feat: scaffold sample React app for Bob workflow demo`.

**Relevant context:**
- Root location agreed: single `npm install`, single `npm run dev`.
- `Bob_Break_tech_stack.png` confirms React 18 + TypeScript + Vite + Custom CSS.
- Keep the app simple — it is a prop for the demo, not a product.

**Status:** `[x] done`

---

### Sub-task 2 — Write supporting documentation for Bob

**Intent:** Give Bob the documents it needs to understand the project before acting. Bob's "Document Understanding" capability works best when the docs are specific and scoped.

**Expected outcomes:**
- `docs/architecture.md` — component map, file layout, CSS variable conventions.
- `docs/accessibility.md` — WCAG AA checklist items Bob must verify: colour contrast, keyboard navigation, ARIA labels, semantic HTML.
- `docs/product-requirements.md` — already exists; review and update agent IDs and event contract to match the README (change `ui/accessibility/testing/documentation` to `diff-analyst/deps-scanner/test-runner/doc-writer`).

**Todo list:**
1. Open `docs/product-requirements.md` and update Agent Roles to `diff-analyst`, `deps-scanner`, `test-runner`, `doc-writer`.
2. Create `docs/architecture.md` — describe the component tree, file layout, and the CSS variable convention Bob must follow when adding dark mode.
3. Create `docs/accessibility.md` — list the specific WCAG AA items Bob's accessibility subagent must check: contrast ratio ≥ 4.5:1, all interactive elements keyboard-reachable, all images have `alt`, form fields have `<label>`.
4. Commit with message `docs: add architecture and accessibility guides for Bob`.

**Relevant context:**
- `docs/product-requirements.md` already exists (read above).
- The dev split specifies `docs/architecture.md` and `docs/accessibility.md` as Part 1 deliverables.
- Keep docs factual and short — Bob reads them literally.

**Status:** `[x] done`

---

### Sub-task 3 — Create the Bob implementation plan document

**Intent:** Produce the written plan that describes what Bob is asked to do and how it divides the work into subagents. This is both a deliverable and the script Bob follows during the demo.

**Expected outcomes:**
- `docs/bob-implementation-plan.md` — a clear, ordered plan Bob can follow.
- Covers all four subagent roles mapped to the README agent IDs.
- Includes the prompt or instruction set used with Bob Agent mode.

**Todo list:**
1. Create `docs/bob-implementation-plan.md`.
2. Write the top-level Bob request: `"Add dark mode to the application, review accessibility, create automated tests, and update the project documentation."`
3. Document the four subagent assignments:
   - `diff-analyst` — implement dark mode using CSS variables; update `CHANGELOG`.
   - `deps-scanner` — check `package.json` for outdated or vulnerable packages; flag breaking changes.
   - `test-runner` — write Vitest unit tests for all components; run them and report results.
   - `doc-writer` — update `README.md`, add JSDoc comments to components, verify `CHANGELOG` entries match changes.
4. Document the document-understanding step: Bob reads `docs/architecture.md`, `docs/accessibility.md`, and `docs/product-requirements.md` before acting.
5. Commit with message `docs: add Bob implementation plan`.

**Relevant context:**
- README section "How IBM Bob 2.0 was used" lists the five capabilities to demonstrate: Agent mode, Subagents, Parallel tasks, Document understanding, Custom rules.
- The plan document becomes evidence of structured Bob usage — keep it clear enough to screenshot for the submission.

**Status:** `[x] done`

---

### Sub-task 4 — Run Bob and collect evidence

**Intent:** Actually use IBM Bob 2.0 to execute the plan. Capture screenshots of every significant Bob action for the `/evidence` folder.

**Expected outcomes:**
- Dark mode implemented in the sample app.
- Accessibility issues identified and resolved.
- Vitest tests written and passing.
- `README.md` and `CHANGELOG.md` updated by Bob.
- At least one screenshot per subagent session saved to `evidence/`.
- A `evidence/README.md` listing what each screenshot shows.

**Todo list:**
1. Open Bob in Agent mode. Ask it to read `docs/product-requirements.md`, `docs/architecture.md`, and `docs/accessibility.md` first.
2. Give Bob the top-level request from `docs/bob-implementation-plan.md`.
3. Let Bob spawn subagents. Screenshot the subagent plan before work begins.
4. Screenshot each subagent's task summary when it completes.
5. Screenshot the test results (pass/fail output).
6. Screenshot any decision Bob raises (ideal source material for the `decision` event type).
7. Save all screenshots to `evidence/` with descriptive filenames: `evidence/01-bob-plan.png`, `evidence/02-diff-analyst-complete.png`, etc.
8. Create `evidence/README.md` listing each file and what it shows.
9. Commit with message `evidence: add Bob task session screenshots`.

**Relevant context:**
- Submission checklist in README requires "exported Bob task session summary screenshots" in `/evidence`.
- These screenshots are the primary evidence of IBM Bob 2.0 usage for the hackathon judges.

**Status:** `[ ] pending`

---

### Sub-task 5 — Draft demo-events.json

**Intent:** Produce the realistic event sequence that Parts 2 and 3 consume. Must be ready before the other team members need it so parallel work can proceed.

**Expected outcomes:**
- `src/data/demo-events.json` — a valid JSON array of events.
- Uses the exact README event contract: `id`, `runId`, `ts`, `analyzer`, `phase`, `type`, `severity`, `title`, `detail`, `decision`.
- Covers the full 60–90 second demo arc:
  - All four analyzers go through `planned → working → done`.
  - At least one `question` type with a `decision` object (human input required).
  - At least one `blocker` type.
  - At least one `risk` / `warn`.
  - All four `complete` events.
- Events are time-ordered by `ts` and realistic in content.

**Todo list:**
1. Create `src/data/` directory.
2. Draft `src/data/demo-events.json` with approximately 30–40 events.
3. Sequence:
   - `t=0s` — all four analyzers emit `planned` / `info` / `progress` events.
   - `t=5–20s` — `diff-analyst` and `deps-scanner` emit working progress events.
   - `t=22s` — `deps-scanner` emits a `question` event with `decision: { question: "...", options: [...] }`.
   - `t=25s` — `test-runner` emits a `blocker` / `warn` event.
   - `t=35s` — `diff-analyst` emits a `risk` / `warn` event about a breaking change.
   - `t=40–70s` — remaining analyzers emit progress and then `complete` events one by one.
   - `t=75s` — all four emit `complete` / `info`.
4. Use ISO timestamps starting from a fixed base time (e.g. `2026-08-30T02:14:00.000Z`) and increment by realistic intervals.
5. Write a brief comment block at the top of the file (or a companion `src/data/demo-events-notes.md`) explaining the arc so Parts 2 and 3 know what to expect.
6. Commit with message `feat: add demo-events.json with full 75-second event arc`.

**Relevant context:**
- Event contract from README:
  ```
  id, runId, ts, analyzer, phase, type, severity, title, detail, decision
  ```
- Agent IDs: `diff-analyst`, `deps-scanner`, `test-runner`, `doc-writer`.
- `phase` values: `planned`, `working`, `waiting`, `blocked`, `done`.
- `type` values: `progress`, `question`, `blocker`, `risk`, `complete`.
- `severity` values: `info`, `warn`, `critical`.
- `decision` is `null` unless `type === "question"`, then `{ question: string, options: string[] }`.
- The demo must include exactly the events the 60–90 second demo script needs — coordinate with Parts 2 and 3 before finalising.

**Status:** `[x] done`

---

## Shared contract reminder

Do not change the following without notifying the full team:

```ts
// src/types/bob-events.ts  (owned by Part 2, but Part 1 must match)
type AnalyzerId = "diff-analyst" | "deps-scanner" | "test-runner" | "doc-writer";
type EventPhase  = "planned" | "working" | "waiting" | "blocked" | "done";
type EventType   = "progress" | "question" | "blocker" | "risk" | "complete";
type Severity    = "info" | "warn" | "critical";

interface BobEvent {
  id:       string;
  runId:    string;
  ts:       string;   // ISO 8601
  analyzer: AnalyzerId;
  phase:    EventPhase;
  type:     EventType;
  severity: Severity;
  title:    string;
  detail:   string;
  decision: null | { question: string; options: string[] };
}
```

---

## Deliverables checklist

- [ ] Working sample React + TypeScript + Vite app at repo root
- [ ] `docs/architecture.md`
- [ ] `docs/accessibility.md`
- [ ] `docs/product-requirements.md` (updated agent IDs)
- [ ] `docs/bob-implementation-plan.md`
- [ ] `evidence/` — screenshots of Bob task sessions
- [ ] `evidence/README.md` — index of screenshots
- [ ] `src/data/demo-events.json` — 30–40 events, full demo arc
- [ ] `src/data/demo-events-notes.md` — arc explanation for teammates
