/**
 * AgentGarden
 *
 * Renders the four analyzer plants in a 2×2 grid.
 * Reads RunState from context; passes paused flag when a decision is pending.
 */

import { useRun } from "../context/RunContext";
import { AgentPlant } from "./AgentPlant";
import type { AnalyzerId } from "../types/bob-events";

const ANALYZER_ORDER: AnalyzerId[] = [
  "diff-analyst",
  "deps-scanner",
  "test-runner",
  "doc-writer",
];

export function AgentGarden() {
  const { state } = useRun();
  const paused = state.status === "waiting-for-decision";

  return (
    <section className="garden" aria-label="Agent garden">
      <ul className="garden-grid" role="list">
        {ANALYZER_ORDER.map((id) => (
          <AgentPlant
            key={id}
            analyzer={state.analyzers[id]}
            paused={paused}
          />
        ))}
      </ul>

      {/* Suppression counter */}
      {state.status !== "idle" && (
        <p className="garden-counter" aria-live="polite">
          <span className="garden-counter__num">{state.metrics.eventsHidden}</span>
          {" "}routine updates hidden ·{" "}
          <span className="garden-counter__num">{state.metrics.eventsSurfaced}</span>
          {" "}surfaced
        </p>
      )}
    </section>
  );
}
