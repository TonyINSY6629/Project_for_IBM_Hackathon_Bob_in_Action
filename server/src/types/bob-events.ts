/**
 * Shared event contract for Bob Break.
 *
 * This is the single source of truth used by:
 *  - The Event Adapter (replay + future live mode)
 *  - The Attention Manager
 *  - The Report Builder
 *  - The frontend React context / reducer
 *
 * Field `analyzer` matches the README event contract exactly.
 * Do not rename it to `agent` without updating all consumers.
 */

export type AnalyzerId =
  | "diff-analyst"
  | "deps-scanner"
  | "test-runner"
  | "doc-writer";

export type AgentPhase =
  | "planned"
  | "working"
  | "waiting"
  | "blocked"
  | "done";

export type EventType =
  | "progress"
  | "question"
  | "blocker"
  | "risk"
  | "complete";

export type EventSeverity = "info" | "warn" | "critical";

export type RunMode = "live" | "replay";

export type RunStatus =
  | "idle"
  | "running"
  | "waiting-for-decision"
  | "completed"
  | "error";

export interface AgentDecision {
  question: string;
  options: string[];
}

/**
 * Every event emitted by an analyzer (or replayed from fixtures).
 * The shape is source-agnostic: local analyzers and a future IBM Bob
 * event stream both produce this same structure.
 */
export interface BobEvent {
  /** Unique event identifier, e.g. "evt_0001" */
  id: string;
  /** Identifies the run this event belongs to */
  runId: string;
  /** ISO-8601 timestamp */
  ts: string;
  /** Which analyzer produced this event */
  analyzer: AnalyzerId;
  /** Lifecycle phase of the analyzer at the time of the event */
  phase: AgentPhase;
  /** What kind of event this is */
  type: EventType;
  /** How urgent this event is */
  severity: EventSeverity;
  /** Short human-readable headline (shown in alerts / decision cards) */
  title: string;
  /** Full technical detail — never shown unprompted, held for report */
  detail: string;
  /**
   * Optional 0–100 progress value for this analyzer.
   * If omitted the Attention Manager does not update progress.
   */
  progress?: number;
  /**
   * Present only when type === "question".
   * Null on all other event types.
   */
  decision?: AgentDecision | null;
  /**
   * Replay-only: milliseconds to wait before emitting this event.
   * Ignored in live mode.
   */
  replayDelayMs?: number;
}

// ---------------------------------------------------------------------------
// Attention routing
// ---------------------------------------------------------------------------

/**
 * The five routes the Attention Manager can assign to an event.
 *
 * visual-progress  Routine update – aggregate silently, grow the plant.
 * decision         Developer must answer a question before the run continues.
 * blocker          A task is stuck – display a calm notice.
 * critical-alert   Immediate human attention required.
 * completed        An analyzer has finished successfully.
 */
export type AttentionRoute =
  | "visual-progress"
  | "decision"
  | "blocker"
  | "critical-alert"
  | "completed";

export interface RoutedEvent {
  event: BobEvent;
  route: AttentionRoute;
}

// ---------------------------------------------------------------------------
// Run state (shared shape for both server reducer and frontend context)
// ---------------------------------------------------------------------------

export interface AnalyzerState {
  id: AnalyzerId;
  phase: AgentPhase;
  progress: number; // 0–100
}

export interface DeveloperAnswer {
  eventId: string;
  question: string;
  answer: string;
  ts: string;
}

export interface ImpactMetrics {
  totalEventsReceived: number;
  eventsHidden: number;
  eventsSurfaced: number;
  decisionsRequested: number;
  blockersDetected: number;
  criticalRisksDetected: number;
  tasksCompleted: number;
  /** eventsHidden / totalEventsReceived expressed as 0–1 */
  suppressionRatio: number;
  /** ISO duration from run start to report ready, or null if not yet done */
  timeToReportMs: number | null;
}

export interface RunState {
  runId: string;
  mode: RunMode;
  status: RunStatus;
  startedAt: string | null;
  completedAt: string | null;
  analyzers: Record<AnalyzerId, AnalyzerState>;
  /** All events received, in order */
  allEvents: BobEvent[];
  /** Events that were silently aggregated (visual-progress route) */
  hiddenEvents: BobEvent[];
  /** Events surfaced to the developer (decision / blocker / critical / completed) */
  surfacedEvents: RoutedEvent[];
  /** The current pending decision, if any */
  pendingDecision: RoutedEvent | null;
  blockers: RoutedEvent[];
  criticalRisks: RoutedEvent[];
  completedAnalyzers: AnalyzerId[];
  developerAnswers: DeveloperAnswer[];
  metrics: ImpactMetrics;
}

// ---------------------------------------------------------------------------
// Final report
// ---------------------------------------------------------------------------

export interface AnalyzerReport {
  analyzer: AnalyzerId;
  status: AgentPhase;
  summary: string;
  detail: string;
}

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
