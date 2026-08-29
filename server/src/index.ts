/**
 * Bob Break — Express HTTP + SSE server
 *
 * Endpoints:
 *   POST /api/runs                      create a new run (replay mode)
 *   GET  /api/runs/:id/stream           SSE event stream
 *   POST /api/runs/:id/decisions        submit developer answer
 *   GET  /api/runs/:id/report           retrieve ReleaseReport
 *   GET  /api/health                    health check
 *
 * All runs are held in memory. No persistence.
 */

import express, { type Request, type Response } from "express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { v4 as uuidv4 } from "uuid";

import { initialState } from "./attention/initialState.js";
import { attentionReducer } from "./attention/attentionReducer.js";
import { createSummary } from "./attention/createSummary.js";
import { createReplayAdapter, type ReplayAdapter } from "./adapters/replayEventAdapter.js";
import type { BobEvent, RunMode, RunState } from "./types/bob-events.js";

// ---------------------------------------------------------------------------
// In-memory run store
// ---------------------------------------------------------------------------

interface RunRecord {
  id: string;
  mode: RunMode;
  state: RunState;
  adapter: ReplayAdapter;
  clients: Set<Response>;
}

const runs = new Map<string, RunRecord>();

// ---------------------------------------------------------------------------
// Fixture path
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(__dirname, "../../fixtures/demo-run.json");

function loadFixture(): BobEvent[] {
  const raw = readFileSync(FIXTURE_PATH, "utf-8");
  return JSON.parse(raw) as BobEvent[];
}

// ---------------------------------------------------------------------------
// SSE broadcast helper
// ---------------------------------------------------------------------------

function broadcast(run: RunRecord, event: BobEvent): void {
  const frame = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of run.clients) {
    try {
      res.write(frame);
    } catch {
      run.clients.delete(res);
    }
  }
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------

const app = express();
app.use(express.json());

// Permissive CORS for local dev (Vite proxies /api in production builds)
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});

app.options("*", (_req, res) => res.sendStatus(204));

// ---------------------------------------------------------------------------
// POST /api/runs  — create and start a run
// ---------------------------------------------------------------------------

app.post("/api/runs", (req: Request, res: Response) => {
  const mode: RunMode = (req.body?.mode as RunMode) ?? "replay";

  let events: BobEvent[];
  try {
    events = loadFixture();
  } catch (err) {
    console.error("Failed to load fixture:", err);
    res.status(500).json({ error: "Could not load demo fixture" });
    return;
  }

  const id = uuidv4();
  let state = initialState(mode, id);
  state = attentionReducer(state, { type: "START_RUN" });

  const record: RunRecord = {
    id,
    mode,
    state,
    adapter: null as unknown as ReplayAdapter, // filled below
    clients: new Set(),
  };

  const adapter = createReplayAdapter(
    events,
    (event: BobEvent) => {
      // Update server-side state
      record.state = attentionReducer(record.state, { type: "RECEIVE_EVENT", event });
      // Push to all connected SSE clients
      broadcast(record, event);
    },
    {
      speedMultiplier: 1,
      onAnswer: (_eventId, _answer) => {
        // State already updated via SUBMIT_ANSWER in the /decisions endpoint
      },
    }
  );

  record.adapter = adapter;
  runs.set(id, record);

  res.json({ id });
});

// ---------------------------------------------------------------------------
// GET /api/runs/:id/stream  — SSE event stream
// ---------------------------------------------------------------------------

app.get("/api/runs/:id/stream", (req: Request, res: Response) => {
  const run = runs.get(req.params.id);
  if (!run) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Register client
  run.clients.add(res);

  // Start the adapter when the first client connects
  if (run.clients.size === 1) {
    run.adapter.start();
  }

  // Clean up on disconnect
  req.on("close", () => {
    run.clients.delete(res);
  });
});

// ---------------------------------------------------------------------------
// POST /api/runs/:id/decisions  — submit developer answer
// ---------------------------------------------------------------------------

app.post("/api/runs/:id/decisions", (req: Request, res: Response) => {
  const run = runs.get(req.params.id);
  if (!run) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  const { eventId, answer } = req.body as { eventId?: string; answer?: string };
  if (!eventId || !answer) {
    res.status(400).json({ error: "eventId and answer are required" });
    return;
  }

  // Update server-side state
  run.state = attentionReducer(run.state, { type: "SUBMIT_ANSWER", eventId, answer });

  // Resume the replay adapter
  run.adapter.submitAnswer(eventId, answer);

  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// GET /api/runs/:id/report  — release report
// ---------------------------------------------------------------------------

app.get("/api/runs/:id/report", (req: Request, res: Response) => {
  const run = runs.get(req.params.id);
  if (!run) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  const report = createSummary(run.state);
  res.json(report);
});

// ---------------------------------------------------------------------------
// GET /api/health
// ---------------------------------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, () => {
  console.log(`Bob Break server listening on :${PORT}`);
  console.log(`  Fixture: ${FIXTURE_PATH}`);
  console.log(`  Health:  http://localhost:${PORT}/api/health`);
});
