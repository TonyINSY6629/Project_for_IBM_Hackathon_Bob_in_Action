/**
 * createSummary
 *
 * Generates the final ReleaseReport from a completed RunState.
 *
 * This function has no side effects. It does not depend on visual
 * components or infrastructure. It can be called safely from tests.
 *
 * If the run is not yet completed, a partial report is returned with
 * runStatus reflecting the current state.
 */

import type {
  AnalyzerId,
  AnalyzerReport,
  BobEvent,
  ReleaseReport,
  RunState,
} from "../types/bob-events.js";

const ANALYZER_LABELS: Record<AnalyzerId, string> = {
  "diff-analyst": "Change Analysis",
  "deps-scanner": "Dependency Scan",
  "test-runner": "Test Execution",
  "doc-writer": "Documentation Review",
};

/**
 * Pick the last "complete" event for an analyzer to use as its report summary.
 * Falls back to the last event of any type if no completion event exists.
 */
function lastEventForAnalyzer(
  events: BobEvent[],
  analyzerId: AnalyzerId
): BobEvent | undefined {
  const forAnalyzer = events.filter((e) => e.analyzer === analyzerId);
  return (
    forAnalyzer.findLast((e) => e.type === "complete") ??
    forAnalyzer[forAnalyzer.length - 1]
  );
}

/**
 * Derive items that need human review from:
 * - Blocker events
 * - Critical risk events
 * - Unanswered questions (pending decisions that were never answered)
 */
function deriveReviewRequired(state: RunState): string[] {
  const items: string[] = [];

  for (const re of state.blockers) {
    items.push(`[BLOCKED] ${re.event.analyzer}: ${re.event.title}`);
  }

  for (const re of state.criticalRisks) {
    items.push(`[RISK] ${re.event.analyzer}: ${re.event.title}`);
  }

  return items;
}

export function createSummary(state: RunState): ReleaseReport {
  const analyzerReports: AnalyzerReport[] = (
    ["diff-analyst", "deps-scanner", "test-runner", "doc-writer"] as AnalyzerId[]
  ).map((id) => {
    const last = lastEventForAnalyzer(state.allEvents, id);
    const label = ANALYZER_LABELS[id];

    return {
      analyzer: id,
      status: state.analyzers[id].phase,
      summary: last
        ? last.title
        : `${label}: no events received`,
      detail: last?.detail ?? "",
    };
  });

  return {
    runId: state.runId,
    generatedAt: new Date().toISOString(),
    runStatus: state.status,
    analyzerReports,
    decisions: state.developerAnswers,
    blockers: state.blockers,
    criticalRisks: state.criticalRisks,
    metrics: state.metrics,
    reviewRequired: deriveReviewRequired(state),
  };
}
