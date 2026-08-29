/**
 * RunContext
 *
 * Provides RunState and dispatch to the entire component tree.
 * Also wires up the SSE stream from the backend and exposes
 * submitAnswer so components can answer decision cards.
 *
 * Usage:
 *   <RunProvider runId="run_demo" mode="replay">
 *     <App />
 *   </RunProvider>
 */

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import type {
  AnalyzerId,
  AnalyzerState,
  BobEvent,
  ImpactMetrics,
  RunMode,
  RunState,
} from "../types/bob-events";

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const ANALYZER_IDS: AnalyzerId[] = [
  "diff-analyst",
  "deps-scanner",
  "test-runner",
  "doc-writer",
];

function buildAnalyzers(): Record<AnalyzerId, AnalyzerState> {
  return Object.fromEntries(
    ANALYZER_IDS.map((id) => [id, { id, phase: "planned" as const, progress: 0 }])
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

function makeInitialState(mode: RunMode, runId: string): RunState {
  return {
    runId,
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

// ---------------------------------------------------------------------------
// Reducer — mirrors server/src/attention/attentionReducer.ts
// ---------------------------------------------------------------------------

type Action =
  | { type: "START_RUN" }
  | { type: "RECEIVE_EVENT"; event: BobEvent }
  | { type: "SUBMIT_ANSWER"; eventId: string; answer: string }
  | { type: "RESET" };

function classifyEvent(event: BobEvent) {
  if (event.severity === "critical") return "critical-alert" as const;
  if (event.type === "risk") return "critical-alert" as const;
  if (event.type === "complete" || event.phase === "done") return "completed" as const;
  if (event.type === "question" && event.decision != null) return "decision" as const;
  if (event.type === "blocker") return "blocker" as const;
  return "visual-progress" as const;
}

function recalcMetrics(state: RunState): ImpactMetrics {
  const total = state.allEvents.length;
  const hidden = state.hiddenEvents.length;
  return {
    totalEventsReceived: total,
    eventsHidden: hidden,
    eventsSurfaced: state.surfacedEvents.length,
    decisionsRequested: state.developerAnswers.length,
    blockersDetected: state.blockers.length,
    criticalRisksDetected: state.criticalRisks.length,
    tasksCompleted: state.completedAnalyzers.length,
    suppressionRatio: total > 0 ? hidden / total : 0,
    timeToReportMs:
      state.completedAt && state.startedAt
        ? new Date(state.completedAt).getTime() - new Date(state.startedAt).getTime()
        : null,
  };
}

function runReducer(state: RunState, action: Action): RunState {
  switch (action.type) {
    case "START_RUN": {
      if (state.status !== "idle") return state;
      return { ...state, status: "running", startedAt: new Date().toISOString() };
    }

    case "RECEIVE_EVENT": {
      const { event } = action;
      const route = classifyEvent(event);
      const allEvents = [...state.allEvents, event];

      const analyzers = { ...state.analyzers };
      analyzers[event.analyzer] = {
        ...analyzers[event.analyzer],
        phase: event.phase,
        progress: event.progress !== undefined ? event.progress : analyzers[event.analyzer].progress,
      };

      const routed = { event, route };
      let { hiddenEvents, surfacedEvents, pendingDecision, blockers, criticalRisks, completedAnalyzers, status, completedAt } = state;

      switch (route) {
        case "visual-progress":
          hiddenEvents = [...hiddenEvents, event];
          break;
        case "decision":
          surfacedEvents = [...surfacedEvents, routed];
          pendingDecision = routed;
          status = "waiting-for-decision";
          break;
        case "blocker":
          surfacedEvents = [...surfacedEvents, routed];
          blockers = [...blockers, routed];
          analyzers[event.analyzer] = { ...analyzers[event.analyzer], phase: "blocked" };
          break;
        case "critical-alert":
          surfacedEvents = [...surfacedEvents, routed];
          criticalRisks = [...criticalRisks, routed];
          break;
        case "completed":
          surfacedEvents = [...surfacedEvents, routed];
          if (!completedAnalyzers.includes(event.analyzer)) {
            completedAnalyzers = [...completedAnalyzers, event.analyzer];
          }
          analyzers[event.analyzer] = { ...analyzers[event.analyzer], phase: "done", progress: 100 };
          if (ANALYZER_IDS.every((id) => completedAnalyzers.includes(id))) {
            status = "completed";
            completedAt = new Date().toISOString();
          }
          break;
      }

      const next: RunState = { ...state, analyzers, allEvents, hiddenEvents, surfacedEvents, pendingDecision, blockers, criticalRisks, completedAnalyzers, status, completedAt };
      return { ...next, metrics: recalcMetrics(next) };
    }

    case "SUBMIT_ANSWER": {
      if (!state.pendingDecision) return state;
      if (state.pendingDecision.event.id !== action.eventId) return state;
      const answerRecord = {
        eventId: action.eventId,
        question: state.pendingDecision.event.decision!.question,
        answer: action.answer,
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

    case "RESET":
      return makeInitialState(state.mode, state.runId);

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface RunContextValue {
  state: RunState;
  dispatch: React.Dispatch<Action>;
  submitAnswer: (eventId: string, answer: string) => Promise<void>;
}

const RunContext = createContext<RunContextValue | null>(null);

export function useRun(): RunContextValue {
  const ctx = useContext(RunContext);
  if (!ctx) throw new Error("useRun must be used inside <RunProvider>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface RunProviderProps {
  children: ReactNode;
  runId: string;
  mode: RunMode;
}

export function RunProvider({ children, runId, mode }: RunProviderProps) {
  const [state, dispatch] = useReducer(runReducer, makeInitialState(mode, runId));

  // Start the run and open the SSE stream
  useEffect(() => {
    let es: EventSource | null = null;

    async function startRun() {
      try {
        const res = await fetch("/api/runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode }),
        });
        if (!res.ok) return;
        const { id } = (await res.json()) as { id: string };

        dispatch({ type: "START_RUN" });

        es = new EventSource(`/api/runs/${id}/stream`);
        es.onmessage = (e) => {
          const event: BobEvent = JSON.parse(e.data as string);
          dispatch({ type: "RECEIVE_EVENT", event });
        };
        es.onerror = () => es?.close();
      } catch {
        // network error — leave in idle state
      }
    }

    void startRun();
    return () => es?.close();
  }, [mode]);

  const submitAnswer = useCallback(
    async (eventId: string, answer: string) => {
      dispatch({ type: "SUBMIT_ANSWER", eventId, answer });
      try {
        await fetch(`/api/runs/${state.runId}/decisions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, answer }),
        });
      } catch {
        // ignore network errors — local state already updated
      }
    },
    [state.runId]
  );

  return (
    <RunContext.Provider value={{ state, dispatch, submitAnswer }}>
      {children}
    </RunContext.Provider>
  );
}
