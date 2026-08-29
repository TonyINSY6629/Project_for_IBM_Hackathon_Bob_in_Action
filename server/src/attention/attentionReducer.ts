/**
 * attentionReducer
 *
 * Pure reducer: (RunState, action) → RunState
 *
 * Actions:
 *   START_RUN          — transition to "running", record startedAt
 *   RECEIVE_EVENT      — classify, route, and update state
 *   SUBMIT_ANSWER      — developer answers a pending decision
 *   RESET              — return to initial state (same runId / mode)
 *
 * The reducer never throws. Invalid or unknown actions return the
 * current state unchanged.
 */

import { classifyEvent } from "./classifyEvent.js";
import { initialState } from "./initialState.js";
import type {
  AnalyzerId,
  BobEvent,
  DeveloperAnswer,
  ImpactMetrics,
  RoutedEvent,
  RunState,
} from "../types/bob-events.js";

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type AttentionAction =
  | { type: "START_RUN" }
  | { type: "RECEIVE_EVENT"; event: BobEvent }
  | { type: "SUBMIT_ANSWER"; eventId: string; answer: string }
  | { type: "RESET" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALL_ANALYZER_IDS: AnalyzerId[] = [
  "diff-analyst",
  "deps-scanner",
  "test-runner",
  "doc-writer",
];

function recalcMetrics(state: RunState): ImpactMetrics {
  const total = state.allEvents.length;
  const hidden = state.hiddenEvents.length;
  const surfaced = state.surfacedEvents.length;

  return {
    totalEventsReceived: total,
    eventsHidden: hidden,
    eventsSurfaced: surfaced,
    decisionsRequested: state.developerAnswers.length,
    blockersDetected: state.blockers.length,
    criticalRisksDetected: state.criticalRisks.length,
    tasksCompleted: state.completedAnalyzers.length,
    suppressionRatio: total > 0 ? hidden / total : 0,
    timeToReportMs:
      state.completedAt && state.startedAt
        ? new Date(state.completedAt).getTime() -
          new Date(state.startedAt).getTime()
        : null,
  };
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function attentionReducer(
  state: RunState,
  action: AttentionAction
): RunState {
  switch (action.type) {
    // -----------------------------------------------------------------------
    case "START_RUN": {
      if (state.status !== "idle") return state;
      return {
        ...state,
        status: "running",
        startedAt: new Date().toISOString(),
      };
    }

    // -----------------------------------------------------------------------
    case "RECEIVE_EVENT": {
      const { event } = action;
      const route = classifyEvent(event);

      // Always append to the full log
      const allEvents = [...state.allEvents, event];

      // Update analyzer phase and progress
      const analyzers = { ...state.analyzers };
      const existing = analyzers[event.analyzer];
      analyzers[event.analyzer] = {
        ...existing,
        phase: event.phase,
        progress:
          event.progress !== undefined ? event.progress : existing.progress,
      };

      const routedEvent: RoutedEvent = { event, route };

      let hiddenEvents = state.hiddenEvents;
      let surfacedEvents = state.surfacedEvents;
      let pendingDecision = state.pendingDecision;
      let blockers = state.blockers;
      let criticalRisks = state.criticalRisks;
      let completedAnalyzers = state.completedAnalyzers;
      let status = state.status;
      let completedAt = state.completedAt;

      switch (route) {
        case "visual-progress":
          hiddenEvents = [...hiddenEvents, event];
          break;

        case "decision":
          surfacedEvents = [...surfacedEvents, routedEvent];
          pendingDecision = routedEvent;
          status = "waiting-for-decision";
          break;

        case "blocker":
          surfacedEvents = [...surfacedEvents, routedEvent];
          blockers = [...blockers, routedEvent];
          // Update phase to blocked
          analyzers[event.analyzer] = {
            ...analyzers[event.analyzer],
            phase: "blocked",
          };
          break;

        case "critical-alert":
          surfacedEvents = [...surfacedEvents, routedEvent];
          criticalRisks = [...criticalRisks, routedEvent];
          break;

        case "completed": {
          surfacedEvents = [...surfacedEvents, routedEvent];
          if (!completedAnalyzers.includes(event.analyzer)) {
            completedAnalyzers = [...completedAnalyzers, event.analyzer];
          }
          analyzers[event.analyzer] = {
            ...analyzers[event.analyzer],
            phase: "done",
            progress: 100,
          };
          // Check if all four analyzers are done
          const allDone = ALL_ANALYZER_IDS.every((id) =>
            completedAnalyzers.includes(id)
          );
          if (allDone) {
            status = "completed";
            completedAt = new Date().toISOString();
          }
          break;
        }
      }

      const next: RunState = {
        ...state,
        analyzers,
        allEvents,
        hiddenEvents,
        surfacedEvents,
        pendingDecision,
        blockers,
        criticalRisks,
        completedAnalyzers,
        status,
        completedAt,
      };

      return { ...next, metrics: recalcMetrics(next) };
    }

    // -----------------------------------------------------------------------
    case "SUBMIT_ANSWER": {
      if (!state.pendingDecision) return state;

      const { eventId, answer } = action;
      if (state.pendingDecision.event.id !== eventId) return state;

      const answerRecord: DeveloperAnswer = {
        eventId,
        question: state.pendingDecision.event.decision!.question,
        answer,
        ts: new Date().toISOString(),
      };

      const next: RunState = {
        ...state,
        pendingDecision: null,
        status: "running",
        developerAnswers: [...state.developerAnswers, answerRecord],
      };

      return { ...next, metrics: recalcMetrics(next) };
    }

    // -----------------------------------------------------------------------
    case "RESET": {
      return initialState(state.mode, state.runId);
    }

    default:
      return state;
  }
}
