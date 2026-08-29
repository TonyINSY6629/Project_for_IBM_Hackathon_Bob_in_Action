/**
 * attention.test.ts
 *
 * Unit tests for the Attention Manager:
 *  - classifyEvent
 *  - attentionReducer
 *  - createSummary
 *
 * Tests run with Vitest (globals: true).
 * No infrastructure setup required — all logic is pure.
 */

import { describe, it, expect } from "vitest";
import { classifyEvent } from "../src/attention/classifyEvent.js";
import { attentionReducer } from "../src/attention/attentionReducer.js";
import { initialState } from "../src/attention/initialState.js";
import { createSummary } from "../src/attention/createSummary.js";
import type { BobEvent } from "../src/types/bob-events.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _seq = 0;
function makeEvent(overrides: Partial<BobEvent> = {}): BobEvent {
  _seq++;
  return {
    id: `evt_t${String(_seq).padStart(3, "0")}`,
    runId: "run_test",
    ts: new Date().toISOString(),
    analyzer: "diff-analyst",
    phase: "working",
    type: "progress",
    severity: "info",
    title: `Test event ${_seq}`,
    detail: "Full technical detail",
    progress: 50,
    decision: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// classifyEvent
// ---------------------------------------------------------------------------

describe("classifyEvent", () => {
  it("routes routine progress to visual-progress", () => {
    expect(classifyEvent(makeEvent({ type: "progress", severity: "info" }))).toBe("visual-progress");
  });

  it("routes warn progress to visual-progress", () => {
    expect(classifyEvent(makeEvent({ type: "progress", severity: "warn" }))).toBe("visual-progress");
  });

  it("routes critical progress to critical-alert", () => {
    expect(classifyEvent(makeEvent({ type: "progress", severity: "critical" }))).toBe("critical-alert");
  });

  it("routes question with decision to decision", () => {
    const e = makeEvent({
      type: "question",
      severity: "info",
      decision: { question: "Which strategy?", options: ["A", "B"] },
    });
    expect(classifyEvent(e)).toBe("decision");
  });

  it("routes question without decision to visual-progress", () => {
    // A question missing a decision object is treated as routine
    expect(classifyEvent(makeEvent({ type: "question", decision: null }))).toBe("visual-progress");
  });

  it("routes blocker to blocker", () => {
    expect(classifyEvent(makeEvent({ type: "blocker", severity: "warn" }))).toBe("blocker");
  });

  it("routes risk (warn) to critical-alert", () => {
    expect(classifyEvent(makeEvent({ type: "risk", severity: "warn" }))).toBe("critical-alert");
  });

  it("routes risk (critical) to critical-alert", () => {
    expect(classifyEvent(makeEvent({ type: "risk", severity: "critical" }))).toBe("critical-alert");
  });

  it("routes complete type to completed", () => {
    expect(classifyEvent(makeEvent({ type: "complete", phase: "done" }))).toBe("completed");
  });

  it("routes phase=done (non-complete type) to completed", () => {
    expect(classifyEvent(makeEvent({ type: "progress", phase: "done" }))).toBe("completed");
  });

  it("critical severity overrides complete type → critical-alert", () => {
    // critical severity has highest priority
    expect(classifyEvent(makeEvent({ type: "complete", severity: "critical" }))).toBe("critical-alert");
  });
});

// ---------------------------------------------------------------------------
// attentionReducer — basic routing
// ---------------------------------------------------------------------------

describe("attentionReducer — event routing", () => {
  it("START_RUN transitions status to running", () => {
    const s0 = initialState();
    const s1 = attentionReducer(s0, { type: "START_RUN" });
    expect(s1.status).toBe("running");
    expect(s1.startedAt).not.toBeNull();
  });

  it("START_RUN is idempotent when already running", () => {
    const s0 = { ...initialState(), status: "running" as const };
    const s1 = attentionReducer(s0, { type: "START_RUN" });
    expect(s1).toBe(s0);
  });

  it("routine progress goes to hiddenEvents", () => {
    const s0 = { ...initialState(), status: "running" as const };
    const event = makeEvent({ type: "progress", severity: "info" });
    const s1 = attentionReducer(s0, { type: "RECEIVE_EVENT", event });
    expect(s1.hiddenEvents).toHaveLength(1);
    expect(s1.surfacedEvents).toHaveLength(0);
  });

  it("routine events are counted as hidden in metrics", () => {
    let s = { ...initialState(), status: "running" as const };
    for (let i = 0; i < 5; i++) {
      s = attentionReducer(s, { type: "RECEIVE_EVENT", event: makeEvent() });
    }
    expect(s.metrics.eventsHidden).toBe(5);
    expect(s.metrics.eventsSurfaced).toBe(0);
    expect(s.metrics.totalEventsReceived).toBe(5);
  });

  it("question with decision routes to decision and pauses run", () => {
    const s0 = { ...initialState(), status: "running" as const };
    const event = makeEvent({
      type: "question",
      decision: { question: "Deploy now?", options: ["Yes", "No"] },
    });
    const s1 = attentionReducer(s0, { type: "RECEIVE_EVENT", event });
    expect(s1.status).toBe("waiting-for-decision");
    expect(s1.pendingDecision).not.toBeNull();
    expect(s1.surfacedEvents).toHaveLength(1);
    expect(s1.metrics.eventsSurfaced).toBe(1);
  });

  it("blocker routes to blocker and is surfaced", () => {
    const s0 = { ...initialState(), status: "running" as const };
    const event = makeEvent({ type: "blocker", severity: "warn" });
    const s1 = attentionReducer(s0, { type: "RECEIVE_EVENT", event });
    expect(s1.blockers).toHaveLength(1);
    expect(s1.surfacedEvents).toHaveLength(1);
    expect(s1.analyzers["diff-analyst"].phase).toBe("blocked");
  });

  it("critical severity routes to critical-alert", () => {
    const s0 = { ...initialState(), status: "running" as const };
    const event = makeEvent({ severity: "critical" });
    const s1 = attentionReducer(s0, { type: "RECEIVE_EVENT", event });
    expect(s1.criticalRisks).toHaveLength(1);
    expect(s1.surfacedEvents).toHaveLength(1);
  });

  it("complete event routes to completed and sets progress to 100", () => {
    const s0 = { ...initialState(), status: "running" as const };
    const event = makeEvent({ type: "complete", phase: "done", analyzer: "diff-analyst" });
    const s1 = attentionReducer(s0, { type: "RECEIVE_EVENT", event });
    expect(s1.completedAnalyzers).toContain("diff-analyst");
    expect(s1.analyzers["diff-analyst"].progress).toBe(100);
    expect(s1.analyzers["diff-analyst"].phase).toBe("done");
  });

  it("surfaced events counter matches non-hidden routes", () => {
    let s = { ...initialState(), status: "running" as const };
    s = attentionReducer(s, { type: "RECEIVE_EVENT", event: makeEvent({ type: "progress" }) });
    s = attentionReducer(s, { type: "RECEIVE_EVENT", event: makeEvent({ type: "blocker" }) });
    s = attentionReducer(s, { type: "RECEIVE_EVENT", event: makeEvent({ type: "progress" }) });
    s = attentionReducer(s, { type: "RECEIVE_EVENT", event: makeEvent({ severity: "critical" }) });
    expect(s.metrics.eventsHidden).toBe(2);
    expect(s.metrics.eventsSurfaced).toBe(2);
    expect(s.metrics.totalEventsReceived).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// attentionReducer — decision flow
// ---------------------------------------------------------------------------

describe("attentionReducer — decision flow", () => {
  it("SUBMIT_ANSWER clears pending decision and resumes run", () => {
    let s = { ...initialState(), status: "running" as const };
    const event = makeEvent({
      type: "question",
      decision: { question: "Which rollout?", options: ["Canary", "Full"] },
    });
    s = attentionReducer(s, { type: "RECEIVE_EVENT", event });
    expect(s.status).toBe("waiting-for-decision");

    s = attentionReducer(s, { type: "SUBMIT_ANSWER", eventId: event.id, answer: "Canary" });
    expect(s.status).toBe("running");
    expect(s.pendingDecision).toBeNull();
    expect(s.developerAnswers).toHaveLength(1);
    expect(s.developerAnswers[0].answer).toBe("Canary");
  });

  it("SUBMIT_ANSWER with wrong eventId is ignored", () => {
    let s = { ...initialState(), status: "running" as const };
    const event = makeEvent({
      type: "question",
      decision: { question: "q?", options: ["a"] },
    });
    s = attentionReducer(s, { type: "RECEIVE_EVENT", event });
    const before = s;
    s = attentionReducer(s, { type: "SUBMIT_ANSWER", eventId: "wrong_id", answer: "a" });
    expect(s).toStrictEqual(before);
  });
});

// ---------------------------------------------------------------------------
// attentionReducer — run completion
// ---------------------------------------------------------------------------

describe("attentionReducer — run completion", () => {
  it("all four agents completing marks status as completed", () => {
    let s = { ...initialState(), status: "running" as const };
    const agents = ["diff-analyst", "deps-scanner", "test-runner", "doc-writer"] as const;
    for (const analyzer of agents) {
      s = attentionReducer(s, {
        type: "RECEIVE_EVENT",
        event: makeEvent({ type: "complete", phase: "done", analyzer }),
      });
    }
    expect(s.status).toBe("completed");
    expect(s.completedAt).not.toBeNull();
    expect(s.completedAnalyzers).toHaveLength(4);
    expect(s.metrics.tasksCompleted).toBe(4);
  });

  it("only three agents completing does not mark run as completed", () => {
    let s = { ...initialState(), status: "running" as const };
    const three = ["diff-analyst", "deps-scanner", "test-runner"] as const;
    for (const analyzer of three) {
      s = attentionReducer(s, {
        type: "RECEIVE_EVENT",
        event: makeEvent({ type: "complete", phase: "done", analyzer }),
      });
    }
    expect(s.status).toBe("running");
  });
});

// ---------------------------------------------------------------------------
// attentionReducer — RESET
// ---------------------------------------------------------------------------

describe("attentionReducer — RESET", () => {
  it("reset returns to idle with empty events", () => {
    let s = { ...initialState(), status: "running" as const };
    s = attentionReducer(s, { type: "RECEIVE_EVENT", event: makeEvent() });
    s = attentionReducer(s, { type: "RECEIVE_EVENT", event: makeEvent() });
    s = attentionReducer(s, { type: "RESET" });
    expect(s.status).toBe("idle");
    expect(s.allEvents).toHaveLength(0);
    expect(s.hiddenEvents).toHaveLength(0);
    expect(s.metrics.totalEventsReceived).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// createSummary
// ---------------------------------------------------------------------------

describe("createSummary", () => {
  function buildCompletedState() {
    let s = { ...initialState(), status: "running" as const };
    const agents = ["diff-analyst", "deps-scanner", "test-runner", "doc-writer"] as const;

    // Add routine events
    for (const analyzer of agents) {
      s = attentionReducer(s, {
        type: "RECEIVE_EVENT",
        event: makeEvent({ analyzer, type: "progress", progress: 50 }),
      });
    }

    // Add a decision + answer
    const decisionEvent = makeEvent({
      analyzer: "diff-analyst",
      type: "question",
      decision: { question: "Version bump?", options: ["major", "minor"] },
    });
    s = attentionReducer(s, { type: "RECEIVE_EVENT", event: decisionEvent });
    s = attentionReducer(s, { type: "SUBMIT_ANSWER", eventId: decisionEvent.id, answer: "major" });

    // Add a blocker
    s = attentionReducer(s, {
      type: "RECEIVE_EVENT",
      event: makeEvent({ analyzer: "test-runner", type: "blocker", severity: "warn" }),
    });

    // Complete all four
    for (const analyzer of agents) {
      s = attentionReducer(s, {
        type: "RECEIVE_EVENT",
        event: makeEvent({ analyzer, type: "complete", phase: "done" }),
      });
    }

    return s;
  }

  it("summary includes decisions and blockers", () => {
    const s = buildCompletedState();
    const report = createSummary(s);
    expect(report.decisions).toHaveLength(1);
    expect(report.blockers).toHaveLength(1);
    expect(report.runStatus).toBe("completed");
  });

  it("summary contains all four analyzer reports", () => {
    const report = createSummary(buildCompletedState());
    expect(report.analyzerReports).toHaveLength(4);
  });

  it("summary metrics match state", () => {
    const s = buildCompletedState();
    const report = createSummary(s);
    expect(report.metrics.totalEventsReceived).toBe(s.metrics.totalEventsReceived);
    expect(report.metrics.tasksCompleted).toBe(4);
  });

  it("reviewRequired lists blockers", () => {
    const s = buildCompletedState();
    const report = createSummary(s);
    expect(report.reviewRequired.length).toBeGreaterThan(0);
    expect(report.reviewRequired[0]).toContain("[BLOCKED]");
  });

  it("summary has a runId and generatedAt", () => {
    const report = createSummary(buildCompletedState());
    expect(report.runId).toBeTruthy();
    expect(report.generatedAt).toBeTruthy();
  });
});
