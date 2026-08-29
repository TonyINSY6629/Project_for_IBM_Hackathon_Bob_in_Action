/**
 * Shared event contract — frontend copy.
 * Keep in sync with server/src/types/bob-events.ts.
 * Do not change without notifying the whole team.
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

export type AttentionRoute =
  | "visual-progress"
  | "decision"
  | "blocker"
  | "critical-alert"
  | "completed";

export interface AgentDecision {
  question: string;
  options: string[];
}

export interface BobEvent {
  id: string;
  runId: string;
  ts: string;
  analyzer: AnalyzerId;
  phase: AgentPhase;
  type: EventType;
  severity: EventSeverity;
  title: string;
  detail: string;
  progress?: number;
  decision?: AgentDecision | null;
  replayDelayMs?: number;
}

export interface RoutedEvent {
  event: BobEvent;
  route: AttentionRoute;
}

export interface AnalyzerState {
  id: AnalyzerId;
  phase: AgentPhase;
  progress: number;
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
  suppressionRatio: number;
  timeToReportMs: number | null;
}

export interface RunState {
  runId: string;
  mode: RunMode;
  status: RunStatus;
  startedAt: string | null;
  completedAt: string | null;
  analyzers: Record<AnalyzerId, AnalyzerState>;
  allEvents: BobEvent[];
  hiddenEvents: BobEvent[];
  surfacedEvents: RoutedEvent[];
  pendingDecision: RoutedEvent | null;
  blockers: RoutedEvent[];
  criticalRisks: RoutedEvent[];
  completedAnalyzers: AnalyzerId[];
  developerAnswers: DeveloperAnswer[];
  metrics: ImpactMetrics;
}

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
