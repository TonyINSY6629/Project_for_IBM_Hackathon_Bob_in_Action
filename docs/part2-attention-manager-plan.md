# Part 2 — Attention Manager & Event System
## IBM TechXchange 2026 Hackathon — Bob Break

**Owner:** Sandratormo  
**Branch:** `feature/attention-manager`  
**Integration target:** `integration/full-prototype`  
**Repo:** https://github.com/TonyINSY6629/Project_for_IBM_Hackathon_Bob_in_Action

---

## Overview

Bob Break converts agentic AI output into calm visual progress. Part 2 is the core
logic layer that sits between the event stream and the visual interface.

Its responsibility is:
1. Receive every event emitted by the four parallel analyzers.
2. Classify each event: does the developer need to see this, or not?
3. Maintain the current run state (progress, phase, decisions, blockers).
4. Generate a structured final report when all analyzers complete.
5. Replay a deterministic fixture so the demo works every time.

Part 2 does not implement any visual components. It exposes a clean state shape
that Part 3 (visual garden, decision cards, alerts, report) reads from.

---

## Shared Event Contract

Established jointly with the team. Single source of truth in
`server/src/types/bob-events.ts`. Do not change field names without team agreement.

```
analyzer: "diff-analyst" | "deps-scanner" | "test-runner" | "doc-writer"
type:     "progress" | "question" | "blocker" | "risk" | "complete"
phase:    "planned" | "working" | "waiting" | "blocked" | "done"
severity: "info" | "warn" | "critical"
decision: null | { question: string; options: string[] }
runId:    "run_demo_01" (fixed for the demo fixture)
```

Team fixture: `src/data/demo-events.json` on `feature/bob-workflow` (32 events, 75s arc).  
Part 2 fixture: `fixtures/demo-run.json` on `integration/full-prototype` (27 events, ~70s arc).

---

## Sub-Tasks

---

### Sub-task 1 — Shared Type Contract

**Status:** [x] done

**Intent**  
Define the single TypeScript file that both server logic and the frontend React
context import. Having one file prevents type drift between teams.

**Expected Outcomes**
- `server/src/types/bob-events.ts` exists and compiles without errors.
- All field names match the event contract above exactly.
- Exports: `BobEvent`, `AnalyzerId`, `AgentPhase`, `EventType`, `EventSeverity`,
  `AttentionRoute`, `RoutedEvent`, `RunState`, `ImpactMetrics`, `ReleaseReport`,
  `DeveloperAnswer`, `AnalyzerReport`, `RunMode`, `RunStatus`.

**Files**
- `server/src/types/bob-events.ts` — created and pushed to GitHub.

---

### Sub-task 2 — Event Classifier

**Status:** [x] done

**Intent**  
A pure function with no side effects. Given a `BobEvent`, return the correct
`AttentionRoute`. This is the decision core of Bob Break.

**Routing rules (priority order)**
1. `severity === "critical"` → `critical-alert`
2. `type === "risk"` (any severity) → `critical-alert`
3. `type === "complete"` OR `phase === "done"` → `completed`
4. `type === "question"` AND `decision != null` → `decision`
5. `type === "blocker"` → `blocker`
6. Everything else → `visual-progress`

**Expected Outcomes**
- `server/src/attention/classifyEvent.ts` exists.
- Pure function: no imports other than types.
- All six routing rules implemented in priority order.
- Unit-testable without any setup.

**Files**
- `server/src/attention/classifyEvent.ts` — created and pushed to GitHub.

---

### Sub-task 3 — Run State: Initial State Factory

**Status:** [x] done

**Intent**  
Provide a single factory function that creates a fresh `RunState`. This ensures
the shape stays consistent with the type definition and makes `RESET` trivial.

**Expected Outcomes**
- `server/src/attention/initialState.ts` exists.
- All four analyzers start at `phase: "planned"`, `progress: 0`.
- All counters and arrays start empty.
- Accepts optional `runId` and `mode` parameters.

**Files**
- `server/src/attention/initialState.ts` — created and pushed to GitHub.

---

### Sub-task 4 — Attention Reducer

**Status:** [x] done

**Intent**  
A pure reducer that processes actions and returns a new `RunState`. This is the
state machine of the entire run. It must be deterministic: same inputs always
produce the same output.

**Actions**
- `START_RUN` — set status to `running`, record `startedAt`.
- `RECEIVE_EVENT` — classify the event, route it, update analyzer state,
  update metrics. If route is `decision`, set `pendingDecision` and pause run.
  If route is `completed` and all four done, set status to `completed`.
- `SUBMIT_ANSWER` — clear `pendingDecision`, record answer, resume run.
- `RESET` — return fresh initial state preserving `runId` and `mode`.

**Expected Outcomes**
- `server/src/attention/attentionReducer.ts` exists.
- All four actions implemented and type-safe.
- `metrics` recalculated after every `RECEIVE_EVENT` and `SUBMIT_ANSWER`.
- `suppressionRatio` = hidden / total (0 when total is 0).
- `timeToReportMs` = null until run completes.

**Files**
- `server/src/attention/attentionReducer.ts` — created and pushed to GitHub.
- Depends on: `classifyEvent.ts`, `initialState.ts`, `bob-events.ts`.

---

### Sub-task 5 — Summary / Report Builder

**Status:** [x] done

**Intent**  
Generates the structured `ReleaseReport` from a finished `RunState`. This is the
artifact the developer reviews at the end of the run. It must not depend on any
visual component.

**Expected Outcomes**
- `server/src/attention/createSummary.ts` exists.
- Returns `ReleaseReport` with: `runStatus`, `analyzerReports` (one per analyzer),
  `decisions`, `blockers`, `criticalRisks`, `metrics`, `reviewRequired`.
- `reviewRequired` lists all blockers and critical risks by analyzer + title.
- Works on both completed and in-progress runs (partial report).

**Files**
- `server/src/attention/createSummary.ts` — created and pushed to GitHub.

---

### Sub-task 6 — Replay Event Adapter

**Status:** [x] done

**Intent**  
Loads a JSON fixture and emits events with controlled timing so the demo runs
identically every time. This is the only component that touches timing/async.

**Expected Outcomes**
- `server/src/adapters/replayEventAdapter.ts` exists.
- Exports `createReplayAdapter(events, onEvent, options)`.
- Supports `start()`, `pause()`, `resume()`, `reset()`, `submitAnswer()`.
- Auto-pauses when a `question` event is emitted.
- Resumes after `submitAnswer()` is called with the correct `eventId`.
- `speedMultiplier` option: `1` = real speed (~70s), `0.1` = fast mode (~7s).
- Default delay per event: `replayDelayMs` field or 1500ms fallback.

**Files**
- `server/src/adapters/replayEventAdapter.ts` — created and pushed to GitHub.

---

### Sub-task 7 — Demo Fixture

**Status:** [x] done

**Intent**  
A JSON file with enough events to demonstrate: all four analyzers starting,
routine hidden progress, one developer decision, one blocker, all four
completing, and a clear suppression ratio.

**Expected Outcomes**
- `fixtures/demo-run.json` exists on `integration/full-prototype`.
- 27 events covering all four analyzers.
- `runId: "run_demo_01"` (aligned with team fixture).
- 1 `question` event (evt_016) with three options.
- 1 `blocker` event (evt_019) from `test-runner`.
- 4 `complete` events, one per analyzer.
- ~22 hidden events (suppression ratio ~81%).
- Replay duration at `speedMultiplier: 1` approximately 70 seconds.

**Files**
- `fixtures/demo-run.json` — created and pushed to GitHub.

---

### Sub-task 8 — Unit Tests

**Status:** [x] done

**Intent**  
Verify all routing rules and reducer behaviours with isolated, fast tests.
These are the evidence that the Attention Manager works correctly.

**Coverage (10 required scenarios + additional)**

| # | Scenario | Covers |
|---|---|---|
| 1 | Routine progress → `visual-progress` | classifyEvent |
| 2 | Question with options → `decision` | classifyEvent |
| 3 | Blocked task → `blocker` | classifyEvent |
| 4 | Critical severity → `critical-alert` | classifyEvent |
| 5 | Complete type → `completed` | classifyEvent |
| 6 | Routine events counted as hidden | reducer metrics |
| 7 | Surfaced events counted correctly | reducer metrics |
| 8 | All 4 agents completing → run `completed` | reducer completion |
| 9 | Summary includes decisions, blockers, metrics | createSummary |
| 10 | RESET restores initial state | reducer reset |
| + | Decision pauses run, answer resumes it | reducer decision flow |
| + | Wrong eventId on SUBMIT_ANSWER ignored | reducer guard |
| + | Only 3 agents done does not complete run | reducer guard |
| + | Critical overrides complete type | classifyEvent priority |

**Expected Outcomes**
- `server/tests/attention.test.ts` exists.
- All tests pass: `cd server && npm install && npm test`.
- No test depends on timers, network, or file system.

**Files**
- `server/tests/attention.test.ts` — created and pushed to GitHub.
- Test framework: Vitest (already in `server/package.json`).

---

### Sub-task 9 — Express Server Entry Point + SSE Route

**Status:** [x] done

**Intent**  
Wire the Attention Manager to the HTTP layer so the frontend can connect via
Server-Sent Events. This is the bridge between Part 2 logic and Part 3 visuals.

**Endpoints required (per README API surface)**

| Route | Method | Purpose |
|---|---|---|
| `/api/runs` | POST | Start a run — `{ mode: "live" \| "replay" }` |
| `/api/runs/:id/stream` | GET | SSE stream of routed events |
| `/api/runs/:id/decisions` | POST | Submit answer — `{ eventId, answer }` |
| `/api/runs/:id/report` | GET | Final release report |
| `/api/health` | GET | Liveness check |

**Expected Outcomes**
- `server/src/index.ts` exists and starts an Express server on port 3000.
- POST `/api/runs` creates a run, starts the replay adapter, returns `{ runId }`.
- GET `/api/runs/:id/stream` opens an SSE connection and emits each `RoutedEvent`
  as a JSON-encoded `data:` message.
- POST `/api/runs/:id/decisions` calls `submitAnswer()` on the adapter and
  dispatches `SUBMIT_ANSWER` to the reducer.
- GET `/api/runs/:id/report` calls `createSummary()` and returns the `ReleaseReport`.
- GET `/api/health` returns `{ status: "ok" }`.
- CORS enabled for `http://localhost:5173` (Vite frontend port).

**Files to create**
- `server/src/index.ts` — Express app + route handlers.
- Uses: `attentionReducer`, `initialState`, `createSummary`, `replayEventAdapter`,
  `bob-events` types, `fixtures/demo-run.json`.

---

### Sub-task 10 — Integration Verification

**Status:** [ ] pending

**Intent**  
Confirm that Part 2 and Part 1 (frontend) can run together on
`integration/full-prototype` without errors before Part 3 begins connecting them.

**Expected Outcomes**
- `cd server && npm install && npm test` — all tests pass.
- `cd server && npm run typecheck` — zero TypeScript errors.
- `npm run dev` (root) — Vite frontend starts on port 5173.
- `cd server && npm run dev` — Express server starts on port 3000.
- GET `http://localhost:3000/api/health` returns `{ status: "ok" }`.
- POST `http://localhost:3000/api/runs` with `{ mode: "replay" }` returns a `runId`.
- GET `http://localhost:3000/api/runs/:id/stream` starts emitting SSE events.

**Files**
- No new files — verification only.
- Fix any issues found in `server/src/index.ts` or configuration.

---

## Interface for Part 3 (Visual Team)

Once Sub-task 9 is done, Part 3 connects to:

```
SSE stream:  GET  http://localhost:3000/api/runs/:id/stream
Answer:      POST http://localhost:3000/api/runs/:id/decisions  { eventId, answer }
Report:      GET  http://localhost:3000/api/runs/:id/report
```

Each SSE message is a `RoutedEvent`:
```ts
{ event: BobEvent, route: AttentionRoute }
```

React state shape to maintain: `RunState` from `server/src/types/bob-events.ts`.

---

## Hackathon Evidence Checklist

- [x] Code committed to GitHub under `feature/attention-manager`
- [x] All files merged into `integration/full-prototype`
- [x] Type contract verified against team fixture
- [x] Demo fixture aligned (`runId: "run_demo_01"`)
- [ ] Tests passing locally (`npm test`)
- [ ] TypeScript clean (`npm run typecheck`)
- [ ] Server running and responding (`/api/health`)
- [ ] SSE stream emitting events in replay mode
- [ ] Task session summary screenshot saved to `/evidence`

---

## Constraints

- No database, no authentication, no external APIs.
- No visual components — Part 2 is logic only.
- All classifier and reducer logic is pure and side-effect free.
- Do not modify any file in `src/` (Part 1 territory).
- Do not claim live IBM Bob IDE integration.
- Replay mode must produce identical output every run.
