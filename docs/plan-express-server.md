# Plan — Express SSE Server (`server/src/index.ts`)

> **Priority:** 🚨 Demo blocker — without this file the frontend `RunContext` cannot POST `/api/runs`
> or open the `EventSource` stream, and the UI stays in `idle` state forever.
>
> **Read first:**
> - [`server/src/types/bob-events.ts`](../server/src/types/bob-events.ts) — shared contract (BobEvent, RunState, ReleaseReport)
> - [`server/src/adapters/replayEventAdapter.ts`](../server/src/adapters/replayEventAdapter.ts) — ReplayAdapter interface
> - [`server/src/attention/attentionReducer.ts`](../server/src/attention/attentionReducer.ts) — AttentionAction, attentionReducer
> - [`server/src/attention/initialState.ts`](../server/src/attention/initialState.ts) — initialState factory
> - [`server/src/attention/createSummary.ts`](../server/src/attention/createSummary.ts) — createSummary
> - [`fixtures/demo-run.json`](../fixtures/demo-run.json) — BobEvent[] replay fixture (27 events)
> - [`web/src/context/RunContext.tsx`](../web/src/context/RunContext.tsx) — the frontend consumer (shows exact fetch/SSE calls expected)
>
> **Scope:** `server/src/index.ts` only + `server/src/adapters/bobAdapter.ts` stub.
> Do not change any existing server files.
>
> **Stack:** Express 4, Node ESM (`"type": "module"`), TypeScript via `tsx`.
> No additional npm packages needed — `express` and `uuid` are already in `package.json`.

---

## Overview

Create a minimal Express HTTP server that:
1. Accepts a run creation request and returns a run ID.
2. Streams `BobEvent` objects to the frontend via Server-Sent Events.
3. Accepts developer answers (decision submissions).
4. Returns the final `ReleaseReport` when the run is complete.
5. Exposes a health endpoint.

In **replay mode** (the only mode needed for the demo), the server loads
`fixtures/demo-run.json` and delegates event emission to `createReplayAdapter`.

Each run is held in memory — no database, no persistence.

---

## Sub-Task 1 — In-memory run store

**Status:** `[ ] pending`

**Intent**
Define the shape of an active run in memory and create a simple Map-based store.
This is the foundation every other sub-task builds on.

**Expected outcomes**
- A `RunRecord` type that holds: `id`, `state: RunState`, `adapter: ReplayAdapter`,
  `clients: Set<Response>` (SSE connections), `mode: RunMode`.
- A `runs` Map exported from the store module or defined at the top of `index.ts`.

**Todo**
1. At the top of `server/src/index.ts`, define `RunRecord`:
   ```ts
   interface RunRecord {
     id: string;
     mode: RunMode;
     state: RunState;
     adapter: ReplayAdapter;
     clients: Set<import("express").Response>;
   }
   ```
2. Create `const runs = new Map<string, RunRecord>();`

**Relevant context**
- `RunMode`, `RunState` from `server/src/types/bob-events.ts`
- `ReplayAdapter` from `server/src/adapters/replayEventAdapter.ts`

---

## Sub-Task 2 — SSE helper

**Status:** `[ ] pending`

**Intent**
Create a reusable function that writes a `BobEvent` as an SSE `data:` frame to all
connected clients for a given run. This keeps the routing handlers clean.

**Expected outcomes**
- `broadcast(run: RunRecord, event: BobEvent): void` — serialises event to JSON,
  writes `data: <json>\n\n` to every client in `run.clients`.
- Removes closed connections automatically.

**Todo**
1. Implement `broadcast` as a plain function in `index.ts`:
   ```ts
   function broadcast(run: RunRecord, event: BobEvent): void {
     const frame = `data: ${JSON.stringify(event)}\n\n`;
     for (const res of run.clients) {
       try { res.write(frame); } catch { run.clients.delete(res); }
     }
   }
   ```

**Relevant context**
- `BobEvent` from `server/src/types/bob-events.ts`
- SSE format: each message is `data: <payload>\n\n` (double newline)

---

## Sub-Task 3 — `POST /api/runs` — create and start a run

**Status:** `[ ] pending`

**Intent**
Handle run creation. Load the fixture, create the replay adapter, apply `START_RUN`
to the reducer state, and return the new run ID.

**Expected outcomes**
- `POST /api/runs` with body `{ mode: "replay" | "live" }` returns `{ id: string }`.
- A `RunRecord` is inserted into `runs`.
- The replay adapter is created but **not yet started** (it starts when the first SSE
  client connects in Sub-Task 4).
- State is set to `"running"` via `attentionReducer(s, { type: "START_RUN" })`.

**Todo**
1. Import `fs` and `path` (Node built-ins) to read the fixture file.
2. Read `fixtures/demo-run.json` relative to `process.cwd()` at request time.
3. Generate run ID with `uuidv4()`.
4. Call `initialState("replay", id)` to get the starting `RunState`.
5. Apply `attentionReducer(state, { type: "START_RUN" })`.
6. Create adapter via `createReplayAdapter(events, onEvent, { speedMultiplier: 1 })`.
   - `onEvent` callback: calls `attentionReducer` with `RECEIVE_EVENT`, updates
     `run.state`, then calls `broadcast(run, event)`.
7. Store `RunRecord` in `runs`.
8. Return `res.json({ id })`.

**Relevant context**
- `initialState` from `server/src/attention/initialState.ts`
- `attentionReducer` from `server/src/attention/attentionReducer.ts`
- `createReplayAdapter` from `server/src/adapters/replayEventAdapter.ts`
- Fixture path: `fixtures/demo-run.json` — resolve with
  `new URL("../../fixtures/demo-run.json", import.meta.url)`
- Frontend call (reference): `fetch("/api/runs", { method: "POST", body: JSON.stringify({ mode }) })`

---

## Sub-Task 4 — `GET /api/runs/:id/stream` — SSE event stream

**Status:** `[ ] pending`

**Intent**
Open a persistent SSE connection. Set correct headers, register the response in
`run.clients`, start the adapter on first client, and clean up on disconnect.

**Expected outcomes**
- Response headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`,
  `Connection: keep-alive`, `X-Accel-Buffering: no`.
- The adapter starts (`adapter.start()`) when the first client connects.
- On client disconnect (`req.on("close")`), the response is removed from `run.clients`.
- 404 if run ID not found.

**Todo**
1. Look up run by `req.params.id` — return 404 if missing.
2. Set SSE headers on `res`.
3. Add `res` to `run.clients`.
4. If `run.clients.size === 1`, call `run.adapter.start()`.
5. On `req.on("close", () => run.clients.delete(res))`.

**Relevant context**
- Frontend call (reference): `new EventSource(\`/api/runs/${id}/stream\`)`
- `vite.config.ts` already proxies `/api` → `http://localhost:3000`

---

## Sub-Task 5 — `POST /api/runs/:id/decisions` — submit answer

**Status:** `[ ] pending`

**Intent**
Accept the developer's answer to a pending decision, update the reducer state,
and forward the answer to the replay adapter so it resumes.

**Expected outcomes**
- `POST /api/runs/:id/decisions` with body `{ eventId: string, answer: string }`
  returns `{ ok: true }`.
- `run.state` is updated via `attentionReducer(state, { type: "SUBMIT_ANSWER", eventId, answer })`.
- `run.adapter.submitAnswer(eventId, answer)` is called — this resumes the replay.
- 404 if run not found, 400 if body is missing fields.

**Todo**
1. Look up run — 404 if missing.
2. Validate `eventId` and `answer` present in body.
3. Apply `SUBMIT_ANSWER` action to `run.state`.
4. Call `run.adapter.submitAnswer(eventId, answer)`.
5. Return `res.json({ ok: true })`.

**Relevant context**
- Frontend call (reference):
  `fetch(\`/api/runs/${runId}/decisions\`, { method: "POST", body: JSON.stringify({ eventId, answer }) })`

---

## Sub-Task 6 — `GET /api/runs/:id/report` — release report

**Status:** `[ ] pending`

**Intent**
Generate and return the `ReleaseReport` from the completed run state.

**Expected outcomes**
- Returns a `ReleaseReport` JSON object.
- Works even if run is not yet completed (returns partial report with current `runStatus`).
- 404 if run not found.

**Todo**
1. Look up run — 404 if missing.
2. Call `createSummary(run.state)`.
3. Return `res.json(report)`.

**Relevant context**
- `createSummary` from `server/src/attention/createSummary.ts`
- Frontend call (reference):
  `fetch(\`/api/runs/${runId}/report\`)`

---

## Sub-Task 7 — `GET /api/health` + server bootstrap

**Status:** `[ ] pending`

**Intent**
Add the health endpoint and wire up the Express app with JSON body parsing, CORS
for local dev, and start listening on port 3000.

**Expected outcomes**
- `GET /api/health` returns `{ ok: true, ts: <ISO string> }`.
- Server listens on `process.env.PORT ?? 3000`.
- JSON body parsing enabled (`express.json()`).
- CORS header `Access-Control-Allow-Origin: *` set for local dev (Vite proxies in prod).
- `npm run dev` in `/server` starts the server without errors.

**Todo**
1. Add `app.use(express.json())`.
2. Add permissive CORS middleware for local dev only.
3. Register all routes from Sub-Tasks 3–6.
4. Add `GET /api/health` handler.
5. `app.listen(port, () => console.log(\`Bob Break server on :${port}\`))`.

---

## Sub-Task 8 — `server/src/adapters/bobAdapter.ts` stub

**Status:** `[ ] pending`

**Intent**
Create the live-mode adapter stub so Part 2 acceptance criteria are met.
This file is not used by the demo — it is a placeholder for future IBM Bob integration.

**Expected outcomes**
- File exists at `server/src/adapters/bobAdapter.ts`.
- Exports a `createBobAdapter` function with the same `ReplayAdapter` interface signature.
- All methods throw `new Error("Live mode not implemented")` or log a warning and no-op.
- A comment explains what a real implementation would connect to.

**Todo**
1. Create `server/src/adapters/bobAdapter.ts`.
2. Export `createBobAdapter(onEvent: OnEventCallback, options?: ReplayOptions): ReplayAdapter`.
3. Return an object where every method is a stub.

**Relevant context**
- `ReplayAdapter`, `OnEventCallback`, `ReplayOptions` from `server/src/adapters/replayEventAdapter.ts`

---

## Acceptance criteria checklist

- [ ] `POST /api/runs` returns `{ id }` and stores a RunRecord.
- [ ] `GET /api/runs/:id/stream` opens SSE and the adapter starts emitting events.
- [ ] Events arrive in the frontend `RunContext` and the UI transitions from `idle` to `running`.
- [ ] Plants grow as `progress` events arrive.
- [ ] `DecisionCard` appears when the `question` event fires (evt_016 in fixture).
- [ ] Answering the decision resumes the replay.
- [ ] `RiskAlert` appears for the `blocker` event (evt_019 in fixture).
- [ ] All 4 analyzers complete → `CompletionSummary` renders.
- [ ] `GET /api/runs/:id/report` returns a valid `ReleaseReport`.
- [ ] `GET /api/health` returns 200.
- [ ] `npm run dev` in `/server` starts without TypeScript errors.
- [ ] `server/src/adapters/bobAdapter.ts` exists and exports `createBobAdapter`.
