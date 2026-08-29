# Bob Break — Development Work Split

> Version 2.0 · Hackathon working document  
> All three parts connect through the shared `BobEvent` contract defined in [`server/src/types/bob-events.ts`](../server/src/types/bob-events.ts).  
> **The shared contract must not change without agreement from the whole team.**

---

## Shared Agreement (read first)

Before working separately, every team member must confirm agreement on the following.
Nothing downstream can be built correctly until these items are settled.

| Item | Agreed value |
| --- | --- |
| Analyzer identifiers | `diff-analyst` · `deps-scanner` · `test-runner` · `doc-writer` |
| Event types | `progress` · `question` · `blocker` · `risk` · `complete` |
| Attention routes | `visual-progress` · `decision` · `blocker` · `critical-alert` · `completed` |
| Demo duration | 60–90 seconds via replay mode (`speedMultiplier = 1`) |
| Event source | Replay from `fixtures/demo-run.json`; live mode runs real analyzers |
| Final report type | `ReleaseReport` — defined in `bob-events.ts` |
| Contract freeze | No change to `BobEvent` or `ReleaseReport` without notifying the whole team |

---

## Part 1 — IBM Bob Workflow and Sample Project

| | |
| --- | --- |
| **Owner** | Team Member 1 |
| **Branch** | `feature/bob-workflow` |

### Objective

Demonstrate the real development work performed by IBM Bob 2.0 on the sample application
and produce every document and piece of evidence required for the hackathon submission.

### Responsibilities

1. Prepare the sample application used as the target for the four analyzers.
2. Create the project requirements and supporting documents:
   `product-requirements.md`, `architecture.md`, `accessibility.md`.
3. Ask Bob to read and understand the project documentation.
4. Use Agent mode to create a full implementation plan.
5. Divide the implementation task between specialised subagents.
6. Use Bob to implement dark mode in the sample application.
7. Review the sample application for accessibility.
8. Create or update automated tests for the sample application.
9. Update project documentation to reflect the final state.
10. Save screenshots and other evidence of Bob's work.
11. Record changed files, test results, decisions taken, and risks identified.
12. Produce or validate the fixture file (`fixtures/demo-run.json`) — a complete
    60–90-second event sequence covering all five event types and all four analyzer
    identifiers.

### Deliverables

| Deliverable | Location |
| --- | --- |
| Working sample application | `sample-project/` |
| Product requirements | `docs/product-requirements.md` |
| Architecture document | `docs/architecture.md` |
| Accessibility review | `docs/accessibility.md` |
| Bob implementation plan | `docs/bob-implementation-plan.md` |
| Evidence — document understanding | `evidence/` (screenshots) |
| Evidence — Agent mode and subagent usage | `evidence/` (screenshots) |
| Changed files and test results | `evidence/` |
| Demo event fixture | `fixtures/demo-run.json` |

### File Layout

```
docs/
├── product-requirements.md
├── architecture.md
├── accessibility.md
└── bob-implementation-plan.md

sample-project/
└── README.md

evidence/
└── (screenshots · test output · Bob task session summary)

fixtures/
└── demo-run.json
```

### Acceptance Criteria

- [ ] Sample application runs locally (`npm run dev`).
- [ ] Dark mode is implemented and visible.
- [ ] Accessibility review is recorded in `docs/accessibility.md`.
- [ ] At least one automated test is added or updated.
- [ ] `fixtures/demo-run.json` is a valid array of `BobEvent` objects; each event has
      all required fields and a `replayDelayMs` value that produces a 60–90-second run.
- [ ] The fixture contains all five event types and all four `AnalyzerId` values.
- [ ] `evidence/` contains exported Bob task session summary screenshots.
- [ ] All documents are consistent with the final implementation.

---

## Part 2 — Attention Manager and Event System

| | |
| --- | --- |
| **Owner** | Team Member 2 |
| **Branch** | `feature/attention-manager` |

### Objective

Build the logic that converts the analyzer event stream into appropriate developer
notifications and visual states — the core intelligence of Bob Break.

### Responsibilities

1. Own `server/src/types/bob-events.ts` — the single source of truth for all shared types.
2. Implement `classifyEvent(event: BobEvent): AttentionRoute` — a pure function with no side effects.
3. Implement `attentionReducer(state, action)` — routes events, updates per-analyzer
   progress and phase, records the run log, detects all-done.
4. Implement `createSummary(state: RunState): ReleaseReport` — derives the structured
   completion report from the finished run state.
5. Implement `createReplayAdapter(events, onEvent, options)` — loads `fixtures/demo-run.json`,
   emits events at `replayDelayMs × speedMultiplier`, pauses on `question` events, resumes on
   `submitAnswer`.
6. Provide a live-mode adapter stub (`server/src/adapters/bobAdapter.ts`) ready for a
   future real connection.
7. Expose the HTTP API (POST `/api/runs`, GET `/api/runs/:id/stream`, POST
   `/api/runs/:id/decisions`, GET `/api/runs/:id/report`, GET `/api/health`).
8. Write unit tests for the classification rules and all-done detection.

### Classification Rules

| `type` | `severity` | Route |
| --- | --- | --- |
| any | `critical` | `critical-alert` |
| `risk` | any | `critical-alert` |
| `complete` or `phase === "done"` | any | `completed` |
| `question` with `decision != null` | any | `decision` |
| `blocker` | any | `blocker` |
| everything else | — | `visual-progress` |

### Deliverables

| Deliverable | Location |
| --- | --- |
| Shared type definitions | `server/src/types/bob-events.ts` |
| Event classifier | `server/src/attention/classifyEvent.ts` |
| Application state reducer | `server/src/attention/attentionReducer.ts` |
| Initial state factory | `server/src/attention/initialState.ts` |
| Final report generator | `server/src/attention/createSummary.ts` |
| Replay adapter | `server/src/adapters/replayEventAdapter.ts` |
| Live adapter stub | `server/src/adapters/bobAdapter.ts` |
| Unit tests | `server/tests/attention.test.ts` |

### File Layout

```
server/src/
├── adapters/
│   ├── replayEventAdapter.ts
│   └── bobAdapter.ts
├── attention/
│   ├── classifyEvent.ts
│   ├── attentionReducer.ts
│   ├── createSummary.ts
│   └── initialState.ts
└── types/
    └── bob-events.ts

server/tests/
└── attention.test.ts
```

### Acceptance Criteria

- [ ] `classifyEvent` is a pure function — no imports other than types.
- [ ] All five event types produce the correct route (verified by unit tests).
- [ ] `critical` severity always routes to `critical-alert` regardless of `type`.
- [ ] Decision card route fires only when `event.decision != null`.
- [ ] All-done detection fires only after all four `AnalyzerId` values report `complete`.
- [ ] `createSummary` returns a `ReleaseReport` — never a plain string or raw log dump.
- [ ] Replay adapter pauses on `question` events and resumes only after `submitAnswer`.
- [ ] Unit tests all pass: `npm test` in `/server` exits 0.

---

## Part 3 — Visual Recovery Experience and Presentation

| | |
| --- | --- |
| **Owner** | Team Member 3 |
| **Branch** | `feature/visual-experience` |

> **Design reference:** [`docs/design-brief.md`](./design-brief.md) — IBM Carbon Design Brief. Read before making any visual change.
> **Migration plan:** [`docs/carbon-migration-plan.md`](./carbon-migration-plan.md) — ordered sub-tasks to migrate from the current dark theme to Carbon light theme.

### Objective

Create the visual experience that reduces technical-text exposure while keeping the
developer informed — the interface that turns an event stream into a calm garden.
Follow the IBM Carbon Design System (light theme) as defined in the design brief.

### Responsibilities

1. Design the main Bob Break interface layout (`src/App.tsx`).
2. Create `AgentGarden` — one plant per analyzer, layout for four simultaneous plants.
3. Create `AgentPlant` — driven by `progress` (0–100) from `RunState.analyzers`; five
   distinct visual states (see table below).
4. Create `BreathingCircle` — guided breathing animation that runs during the
   `running` state without user interaction.
5. Create `DecisionCard` — receives a `question` string and `options` array from a
   `decision`-routed event; emits the selected answer back to the reducer.
6. Create `RiskAlert` — calm, non-alarming display for `blocker` and `critical-alert`
   routed events.
7. Create `CompletionSummary` — receives a `ReleaseReport` object from `createSummary`;
   renders it as a human-readable summary without raw JSON or log lines.
8. Add smooth transitions between the three interface states:
   **Working** → **Interruption** (decision / alert) → **Completion**.
9. Ensure the interface is responsive and accessible.
10. Prepare the pitch slides for the live presentation.
11. Write and rehearse the demonstration script.
12. Record a backup demo video using replay mode.

### Plant Visual States

| State | Trigger | Appearance |
| --- | --- | --- |
| Seedling | Analyzer `planned`, not yet started | 🌱 Small, static |
| Growing | `progress` events arriving (`working` phase) | 🌿 Animated growth |
| Paused | `RunState.status === "waiting-for-decision"` | ⏸️ Frozen mid-growth |
| Blocked | `blocked` phase set by reducer on `blocker` route | 🍂 Wilting animation |
| Completed | `done` phase — analyzer in `completedAnalyzers` | 🌸 Flowering |

### Deliverables

| Deliverable | Location |
| --- | --- |
| Main application shell | `src/App.tsx` |
| Agent garden | `src/components/AgentGarden.tsx` |
| Animated plant (five states) | `src/components/AgentPlant.tsx` |
| Breathing circle | `src/components/BreathingCircle.tsx` |
| Decision card | `src/components/DecisionCard.tsx` |
| Blocker / risk alerts | `src/components/RiskAlert.tsx` |
| Completion summary screen | `src/components/CompletionSummary.tsx` |
| Garden styles | `src/styles/garden.css` |
| Breathing animation styles | `src/styles/breathing.css` |
| Interface base styles | `src/styles/interface.css` |
| Pitch slides | `docs/pitch-slides.pdf` (or equivalent) |
| Demonstration script | `docs/demo-script.md` |
| Backup demo video | `evidence/demo-video.mp4` (or link) |

### File Layout

```
src/
├── components/
│   ├── AgentGarden.tsx
│   ├── AgentPlant.tsx
│   ├── BreathingCircle.tsx
│   ├── DecisionCard.tsx
│   ├── RiskAlert.tsx
│   └── CompletionSummary.tsx
├── styles/
│   ├── garden.css
│   ├── breathing.css
│   └── interface.css
└── App.tsx

docs/
├── demo-script.md
└── pitch-slides.pdf
```

### Acceptance Criteria

- [ ] Garden renders one plant per `AnalyzerId`: `diff-analyst`, `deps-scanner`,
      `test-runner`, `doc-writer`.
- [ ] Plant progress is driven by `RunState.analyzers[id].progress` (0–100).
- [ ] All five plant states are visually distinct and transition smoothly.
- [ ] `DecisionCard` is shown only when `RunState.pendingDecision` is non-null.
- [ ] `DecisionCard` emits an answer that reaches `attentionReducer` as a
      `SUBMIT_ANSWER` action.
- [ ] `RiskAlert` uses a calm colour palette — no alarming red.
- [ ] `CompletionSummary` renders the `ReleaseReport`; no raw JSON visible to the user.
- [ ] Breathing animation plays automatically during `RunState.status === "running"`.
- [ ] Interface is usable at 1280 × 800 and at mobile width (375 px).
- [ ] Primary garden view has no axe accessibility violations.
- [ ] Demo video is recorded with `speedMultiplier = 1` (replay mode, no live repo needed).

---

## Integration Point

All three parts connect through the types in [`server/src/types/bob-events.ts`](../server/src/types/bob-events.ts).
**Do not change this file without team consensus.**

### Key types (current implementation)

```typescript
// Analyzer identifiers
export type AnalyzerId =
  | "diff-analyst"
  | "deps-scanner"
  | "test-runner"
  | "doc-writer";

// Lifecycle phase of an analyzer
export type AgentPhase =
  | "planned" | "working" | "waiting" | "blocked" | "done";

// What kind of event this is
export type EventType =
  | "progress" | "question" | "blocker" | "risk" | "complete";

// Severity
export type EventSeverity = "info" | "warn" | "critical";

// Every event emitted by an analyzer or replayed from fixtures
export interface BobEvent {
  id: string;
  runId: string;
  ts: string;                   // ISO-8601
  analyzer: AnalyzerId;
  phase: AgentPhase;
  type: EventType;
  severity: EventSeverity;
  title: string;                // short headline — shown in cards and alerts
  detail: string;               // full text — held for the report, never shown unprompted
  progress?: number;            // 0–100
  decision?: AgentDecision | null;
  replayDelayMs?: number;       // replay-only: ms to wait before emitting
}

// Route assigned by classifyEvent
export type AttentionRoute =
  | "visual-progress" | "decision" | "blocker" | "critical-alert" | "completed";

// Final structured report (output of createSummary)
export interface ReleaseReport {
  runId: string;
  generatedAt: string;
  runStatus: RunStatus;
  analyzerReports: AnalyzerReport[];
  decisions: DeveloperAnswer[];
  blockers: RoutedEvent[];
  criticalRisks: RoutedEvent[];
  metrics: ImpactMetrics;
  reviewRequired: string[];
}
```

### Data flow

```
Part 1  →  fixtures/demo-run.json
             BobEvent[] recorded from real Bob work on the sample app

Part 2  →  replayEventAdapter   loads fixture, emits events with controlled timing
Part 2  →  classifyEvent        BobEvent → AttentionRoute (pure function)
Part 2  →  attentionReducer     RunState: per-analyzer progress, run log, metrics
Part 2  →  createSummary        RunState → ReleaseReport

Part 3  →  AgentGarden          reads RunState.analyzers → renders four plants
Part 3  →  DecisionCard         receives RunState.pendingDecision → emits SUBMIT_ANSWER
Part 3  →  RiskAlert            receives blockers / criticalRisks from RunState
Part 3  →  CompletionSummary    receives ReleaseReport → renders human-readable report
```

---

## Demo Sequence (60–90 seconds)

The following sequence must be covered by `fixtures/demo-run.json` and rehearsed in the demo script.
Timing is controlled by the `replayDelayMs` field on each `BobEvent`.

| # | ~Time (s) | Event | `type` | `analyzer` | What the developer sees |
| --- | --- | --- | --- | --- | --- |
| 1 | 0 | Run starts | — | all | Garden activates; all four plants at seedling |
| 2 | 5–15 | Parallel progress | `progress` | all four | Plants grow silently; breathing circle visible |
| 3 | 20 | Decision required | `question` | `diff-analyst` | Garden pauses; decision card appears |
| 4 | 25 | Developer answers | — | — | Garden resumes; plant continues growing |
| 5 | 30–50 | More progress | `progress` | all four | Silent growth continues |
| 6 | 50 | Risk detected | `risk` | `test-runner` | Calm risk alert appears alongside garden |
| 7 | 60 | Final completions | `complete` | all four | Plants flower; firefly transition |
| 8 | 65–75 | Completion summary | — | — | `ReleaseReport` screen replaces garden |

---

## Branch and Integration Strategy

```
main
├── feature/bob-workflow          (Part 1)
├── feature/attention-manager     (Part 2)
└── feature/visual-experience     (Part 3)
```

- **Unblock Part 3 immediately:** freeze `server/src/types/bob-events.ts` and commit it
  to `main` (or a shared `feature/shared-types` branch) before either Part 2 or Part 3
  begins coding.
- Part 3 can use a local stub for `attentionReducer`'s output shape while Part 2 is in
  progress, as long as both agree on `RunState`.
- Integration: single merge to `main` after all three parts pass their individual
  acceptance criteria.

---

## Risks and Mitigations

| Risk | Owner | Mitigation |
| --- | --- | --- |
| `BobEvent` field names drift between parts | All | Freeze `bob-events.ts` first; no changes without team chat |
| Fixture timing feels rushed or too slow | Part 1 | Adjust `replayDelayMs` values during rehearsal |
| Plant animations cause layout shift | Part 3 | Use `transform` only; avoid layout-triggering CSS properties |
| `ReleaseReport` shape mismatch between Part 2 output and Part 3 display | Parts 2 & 3 | Agree on shape before Part 3 builds `CompletionSummary` |
| Demo video depends on live network | Part 3 | Always record with `speedMultiplier = 1` in replay mode — no `TARGET_REPO` needed |
| Part 3 blocked waiting for real reducer | Part 2 | Part 3 provides a local stub that matches `RunState`; swap in real reducer at integration |
