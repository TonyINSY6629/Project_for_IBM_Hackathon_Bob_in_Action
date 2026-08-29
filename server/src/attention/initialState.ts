/**
 * initialState
 *
 * Returns a fresh RunState with all analyzers in "planned" phase
 * and all counters at zero.
 *
 * Always call this factory instead of constructing the object inline
 * so that the shape stays in sync with RunState automatically.
 */

import { v4 as uuidv4 } from "uuid";
import type {
  AnalyzerId,
  AnalyzerState,
  ImpactMetrics,
  RunMode,
  RunState,
} from "../types/bob-events.js";

const ANALYZER_IDS: AnalyzerId[] = [
  "diff-analyst",
  "deps-scanner",
  "test-runner",
  "doc-writer",
];

function buildAnalyzers(): Record<AnalyzerId, AnalyzerState> {
  return Object.fromEntries(
    ANALYZER_IDS.map((id) => [
      id,
      { id, phase: "planned", progress: 0 } satisfies AnalyzerState,
    ])
  ) as Record<AnalyzerId, AnalyzerState>;
}

function buildMetrics(): ImpactMetrics {
  return {
    totalEventsReceived: 0,
    eventsHidden: 0,
    eventsSurfaced: 0,
    decisionsRequested: 0,
    blockersDetected: 0,
    criticalRisksDetected: 0,
    tasksCompleted: 0,
    suppressionRatio: 0,
    timeToReportMs: null,
  };
}

export function initialState(
  mode: RunMode = "replay",
  runId?: string
): RunState {
  return {
    runId: runId ?? uuidv4(),
    mode,
    status: "idle",
    startedAt: null,
    completedAt: null,
    analyzers: buildAnalyzers(),
    allEvents: [],
    hiddenEvents: [],
    surfacedEvents: [],
    pendingDecision: null,
    blockers: [],
    criticalRisks: [],
    completedAnalyzers: [],
    developerAnswers: [],
    metrics: buildMetrics(),
  };
}
