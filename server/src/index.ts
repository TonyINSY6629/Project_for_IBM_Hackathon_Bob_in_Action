/**
 * server/src/index.ts
 *
 * Express HTTP server for Bob Break.
 *
 * Routes (per README API surface):
 *   POST /api/runs                    — start a run in replay or live mode
 *   GET  /api/runs/:id/stream         — SSE stream of RoutedEvents
 *   POST /api/runs/:id/decisions      — submit a developer answer
 *   GET  /api/runs/:id/report         — final ReleaseReport
 *   GET  /api/health                  — liveness
 *
 * Only replay mode is implemented. Live mode is reserved for a future
 * adapter swap and returns 501 Not Implemented.
 *
 * CORS is open to http://localhost:5173 (Vite dev server).
 */

import express, { Request, Response } from "express";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

import { attentionReducer } from "./attention/attentionReducer.js";
import { createSummary } from "./attention/createSummary.js";
import { initialState } from "./attention/initialState.js";
import { createReplayAdapter } from "./adapters/replayEventAdapter.js";
import type {
  BobEvent,
  RoutedEvent,
  RunState,
} from "./types/bob-events.js";

// ---------------------------------------------------------------------------
// Fixture loading
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(__dirname, "../../../fixtures/demo-run.json");

function loadFixture(): BobEvent[] {
  try {
    const raw = readFileSync(FIXTURE_PATH, "utf-8");
    return JSON.parse(raw) as BobEvent[];
  } catch {
    console.error("[bob-break] Could not load fixture at", FIXTURE_PATH);
    return [];
  }
}

// ---------------------------------------------------------------------------
// In-memory run registry
// ---------------------------------------------------------------------------

interface RunEntry {
  state: RunState;
  clients: Response[];       // SSE connections subscribed to this run
  adapter: ReturnType<typeof createReplayAdapter> | null;
}

const runs = new Map<string, RunEntry>();

function getEntry(runId: string): RunEntry | undefined {
  return runs.get(runId);
}

function broadcastToClients(entry: RunEntry, payload: RoutedEvent) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of entry.clients) {
    client.write(data);
  }
}

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------

const app = express();
app.use(express.json());

// CORS — allow the Vite dev server
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// ---------------------------------------------------------------------------
// GET /api/health
// ---------------------------------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ---------------------------------------------------------------------------
// POST /api/runs
// Body: { mode: "replay" | "live" }
// ---------------------------------------------------------------------------

app.post("/api/runs", (req: Request, res: Response) => {
  const mode: string = req.body?.mode ?? "replay";

  if (mode === "live") {
    res.status(501).json({
      error: "Live mode is not yet implemented. Use mode: 'replay'.",
    });
    return;
  }

  const runId = uuidv4();
  const state = initialState("replay", runId);
  const entry: RunEntry = { state, clients: [], adapter: null };
  runs.set(runId, entry);

  // Transition to running
  entry.state = attentionReducer(entry.state, { type: "START_RUN" });

  // Load fixture and create replay adapter
  const events = loadFixture().map((e) => ({ ...e, runId }));

  entry.adapter = createReplayAdapter(
    events,
    (event) => {
      // On each event: run through reducer and broadcast to SSE clients
      const route = (() => {
        const before = entry.state;
        entry.state = attentionReducer(entry.state, {
          type: "RECEIVE_EVENT",
          event,
        });
        // Find the routed event that was just added
        const surfaced = entry.state.surfacedEvents;
        const prev = before.surfacedEvents;
        if (surfaced.length > prev.length) {
          return surfaced[surfaced.length - 1];
        }
        // Visual-progress events are not in surfacedEvents — broadcast a minimal wrapper
        return { event, route: "visual-progress" } as RoutedEvent;
      })();
      broadcastToClients(entry, route);
    },
    {
      speedMultiplier: 1,
      onAnswer: (eventId, answer) => {
        entry.state = attentionReducer(entry.state, {
          type: "SUBMIT_ANSWER",
          eventId,
          answer,
        });
      },
    }
  );

  entry.adapter.start();

  res.status(201).json({ runId });
});

// ---------------------------------------------------------------------------
// GET /api/runs/:id/stream  — Server-Sent Events
// ---------------------------------------------------------------------------

app.get("/api/runs/:id/stream", (req: Request, res: Response) => {
  const entry = getEntry(req.params.id);
  if (!entry) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Send current state snapshot so late-connecting clients catch up
  const snapshot: RoutedEvent = {
    event: {
      id: "snapshot",
      runId: entry.state.runId,
      ts: new Date().toISOString(),
      analyzer: "diff-analyst",
      phase: "working",
      type: "progress",
      severity: "info",
      title: "Connected to run",
      detail: JSON.stringify(entry.state),
      decision: null,
    },
    route: "visual-progress",
  };
  res.write(`data: ${JSON.stringify(snapshot)}\n\n`);

  entry.clients.push(res);

  req.on("close", () => {
    entry.clients = entry.clients.filter((c) => c !== res);
  });
});

// ---------------------------------------------------------------------------
// POST /api/runs/:id/decisions
// Body: { eventId: string; answer: string }
// ---------------------------------------------------------------------------

app.post("/api/runs/:id/decisions", (req: Request, res: Response) => {
  const entry = getEntry(req.params.id);
  if (!entry) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  const { eventId, answer } = req.body ?? {};
  if (!eventId || !answer) {
    res.status(400).json({ error: "eventId and answer are required" });
    return;
  }

  entry.adapter?.submitAnswer(eventId, answer);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// GET /api/runs/:id/report
// ---------------------------------------------------------------------------

app.get("/api/runs/:id/report", (req: Request, res: Response) => {
  const entry = getEntry(req.params.id);
  if (!entry) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  const report = createSummary(entry.state);
  res.json(report);
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`[bob-break] Server running on http://localhost:${PORT}`);
  console.log(`[bob-break] Health: http://localhost:${PORT}/api/health`);
});

export default app;
