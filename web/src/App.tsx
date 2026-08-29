/**
 * App.tsx
 *
 * Root layout. Three visual states:
 *   idle       → welcome screen with a Start button
 *   running /
 *   waiting-for-decision → garden + breathing circle + overlays
 *   completed  → CompletionSummary
 *
 * The RunProvider wraps everything and manages state via SSE.
 */

import { AnimatePresence, motion } from "framer-motion";
import { RunProvider, useRun } from "./context/RunContext";
import { AgentGarden } from "./components/AgentGarden";
import { BreathingCircle } from "./components/BreathingCircle";
import { DecisionCard } from "./components/DecisionCard";
import { RiskAlert } from "./components/RiskAlert";
import { CompletionSummary } from "./components/CompletionSummary";
import "./styles/interface.css";
import "./styles/garden.css";
import "./styles/breathing.css";

// ---------------------------------------------------------------------------
// Inner layout (has access to RunContext)
// ---------------------------------------------------------------------------

function AppShell() {
  const { state, dispatch } = useRun();
  const { status } = state;

  const isIdle = status === "idle";
  const isWorking = status === "running" || status === "waiting-for-decision";
  const isDone = status === "completed";

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-header__title">Bob Break</span>
        <span className="app-header__badge">
          {status === "idle" ? "ready" : status}
        </span>
      </header>

      <main className="app-main">
        <AnimatePresence mode="wait">
          {/* Idle */}
          {isIdle && (
            <motion.div
              key="idle"
              className="idle-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="idle-screen__heading">While Bob works, you breathe.</h1>
              <p className="idle-screen__sub">
                Bob Break turns the agent event stream into a calm garden.
                You are only interrupted when human input provides real value.
              </p>
              <button
                className="idle-screen__start"
                onClick={() => dispatch({ type: "START_RUN" })}
              >
                Start run
              </button>
            </motion.div>
          )}

          {/* Working */}
          {isWorking && (
            <motion.div
              key="working"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32, width: "100%" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <AgentGarden />
              <BreathingCircle />
            </motion.div>
          )}

          {/* Done */}
          {isDone && (
            <motion.div
              key="done"
              style={{ width: "100%", display: "flex", justifyContent: "center" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
            >
              <CompletionSummary />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decision card overlay */}
        <AnimatePresence>
          {state.pendingDecision && (
            <motion.div
              key="decision-overlay"
              className="decision-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <DecisionCard />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alerts — fixed position, outside flow */}
        <RiskAlert />
      </main>

      <footer className="app-footer">
        Built with IBM Bob 2.0 · IBM TechXchange 2026 Hackathon
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root — wraps with RunProvider
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <RunProvider runId="run_demo" mode="replay">
      <AppShell />
    </RunProvider>
  );
}
