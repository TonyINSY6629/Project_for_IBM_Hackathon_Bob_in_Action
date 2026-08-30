# How IBM Bob 2.0 Was Used

**Project:** Bob Break
**Event:** IBM TechXchange 2026 Pre-conference Dev Day Hackathon

Evidence for every claim in this document is committed under [`/evidence`](../evidence/),
with a per-screenshot index in [`evidence/README.md`](../evidence/README.md).

---

## Summary

IBM Bob 2.0 was the core development engine for this project and the subject of the workflow
the project visualises. Bob planned the architecture, read the project's own specifications
before writing code, divided the implementation across four isolated subagents running in
parallel, wrote the application code and the test suite, and updated the documentation — under
five custom rules enforced across the whole session.

At runtime the prototype executes four local analyzers against a project folder the developer
chooses, and translates their activity into a shared event format. A future Bob event
integration would replace the current adapter without changing the Attention Manager or the
visual interface.

---

## 1. The request given to Bob

Agent mode was given a single multi-step request against a React + TypeScript task-board
application, reproduced verbatim from
[`docs/bob-implementation-plan.md`](bob-implementation-plan.md):

> "I have a React + TypeScript task-board application. I need you to:
> 1. Add a dark mode toggle using the CSS variable system already in place.
> 2. Review and fix any WCAG 2.1 AA accessibility issues.
> 3. Write Vitest unit tests for all three components.
> 4. Update the README and add JSDoc comments to all components.
>
> Before starting, please read `docs/product-requirements.md`, `docs/architecture.md`,
> and `docs/accessibility.md` so your work follows the project's conventions."

This is deliberately the kind of request that produces the problem Bob Break exists to solve:
four concurrent workstreams, each generating its own stream of plans, diffs, and results.

---

## 2. Capabilities used

### Document understanding

Before writing any code, Bob read three project documents and confirmed its understanding of
the component tree, the CSS variable convention, and the WCAG AA checklist.

| Document | What Bob took from it |
| --- | --- |
| `docs/product-requirements.md` | Project goal, agent roles, success criteria |
| `docs/architecture.md` | Component tree, file layout, CSS variable convention |
| `docs/accessibility.md` | The WCAG AA checklist items to verify and fix |

This is the difference between an agent treating a request as an isolated coding task and an
agent working inside a project's real constraints. Bob did not invent a styling approach — it
adopted the one already in the repository.

**Evidence:** `evidence/Part-1_Sub-task_4_Screenshot1.jpg`

### Agent mode

Bob inspected the codebase autonomously and produced a full implementation plan before making
any change, naming the four subagents and their responsibilities up front. The plan, not the
code, was the first output.

**Evidence:** all screenshots — Bob operates autonomously across the full task.

### Subagents

The work was divided across four isolated subagents, each in a self-contained context so that
one concern could not pollute another:

| Subagent | Responsibility | Output |
| --- | --- | --- |
| `diff-analyst` | Dark mode toggle | `Header.tsx` with `aria-label` and `aria-pressed`, `.header__theme-toggle` styles using existing CSS variables only, `CHANGELOG.md` entry |
| `deps-scanner` | Accessibility audit | Identified a `--color-text-muted` contrast failure (3.8:1 on surface), planned a focus-ring fix, verified ARIA labels and semantic HTML |
| `test-runner` | Automated tests | Three Vitest files — `Header.test.tsx`, `AddTaskForm.test.tsx`, `TaskList.test.tsx` — using `@testing-library/react` and `user-event` |
| `doc-writer` | Documentation | JSDoc comments across components, README update |

**Evidence:** `Screenshot2.1.jpg` – `Screenshot2.4.jpg`, one per subagent plan.

### Parallel tasks

All four subagents were planned and executed concurrently rather than in sequence. This is
what produces the event volume the Attention Manager was built to absorb — and it is why the
project's own development is an honest instance of the problem it addresses.

**Evidence:** `Screenshot2.1.jpg` – `Screenshot2.4.jpg`.

### Custom rules

Five custom rules were defined and enforced across the entire session:

1. **CSS variables only** — no hard-coded colour values anywhere in generated styles
2. **Conventional commits** — consistent commit categorisation across all generated work
3. **No scope creep** — subagents stay inside their stated responsibility
4. **Decision before destructive action** — no deletion or overwrite without an explicit decision
5. **One subagent per concern** — no shared context between workstreams

Rule 4 is worth noting: it is the same principle the prototype implements at runtime, where a
destructive or ambiguous situation becomes a decision card rather than an autonomous choice.

**Evidence:** `Screenshot2.4.jpg` — all five rules explicitly acknowledged and enforced.

---

## 3. What Bob produced

Bob's work is present throughout the repository, not confined to a demo branch:

| Area | Path |
| --- | --- |
| Sample task-board application | `src/` — `Header.tsx`, `AddTaskForm.tsx`, `TaskList.tsx` |
| Test suite | `src/components/*.test.tsx` |
| Analysis pipeline | `src/hooks/useBobBreak.ts` — analyzers, event contract, attention classifier, report builder |
| Recovery interface | `src/components/BobBreak.tsx` — garden, plants, breathing circle, decision cards, alerts, report |
| Project documentation | `docs/` — architecture, requirements, accessibility, and the plans for each part |

Development itself was split across four branches — `feature/bob-workflow`,
`feature/attention-manager`, `feature/visual-experience`, and `integration/full-prototype` —
mirroring the subagent isolation Bob used inside the session.

---

## 4. Where Bob sits in the running prototype

Stated precisely, because the distinction is one a technical reviewer should not have to infer:

**Bob is the build-time engine.** Agent mode, subagents, parallel tasks, document
understanding, and custom rules were used to plan, implement, test, and document this system.

**At runtime, the prototype executes four local analyzers in parallel** against a project
folder the developer chooses, and translates their activity into the shared event format
defined in [`src/hooks/useBobBreak.ts`](../src/hooks/useBobBreak.ts). The folder is read in the
browser through the File System Access API; nothing is uploaded.

**The prototype does not attach to a running Bob IDE process** and does not receive live
subagent events. No such hook is claimed.

The Event Adapter is the only component that knows where events come from. A future Bob event
integration replaces the adapter's input and nothing else — the Attention Manager, the report
builder, and the entire interface are unchanged. That is the reason the seam exists where it
does.

---

## 5. Evidence index

| File | Capability shown |
| --- | --- |
| `Part-1_Sub-task_4_Screenshot1.jpg` | Document understanding — three project docs read and confirmed before any code |
| `Part-1_Sub-task_4_Screenshot2.1.jpg` | Subagent plan — `diff-analyst`, dark mode |
| `Part-1_Sub-task_4_Screenshot2.2.jpg` | Subagent plan — `deps-scanner`, accessibility audit |
| `Part-1_Sub-task_4_Screenshot2.3.jpg` | Subagent plan — `test-runner`, Vitest suite |
| `Part-1_Sub-task_4_Screenshot2.4.jpg` | Subagent plan — `doc-writer`, plus all five custom rules enforced |

Full descriptions accompany each screenshot in [`evidence/README.md`](../evidence/README.md).
