/**
 * CompletionSummary
 *
 * Final screen: fetches the ReleaseReport from the backend and
 * renders it as a human-readable summary.
 * No raw JSON or log lines are shown to the user.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRun } from "../context/RunContext";
import type { ReleaseReport } from "../types/bob-events";

const PHASE_LABEL: Record<string, string> = {
  done: "Completed",
  blocked: "Blocked",
  working: "In progress",
  planned: "Not started",
  waiting: "Waiting",
};

const PHASE_CLASS: Record<string, string> = {
  done: "summary-analyzer--done",
  blocked: "summary-analyzer--blocked",
};

function fmt(ms: number | null): string {
  if (ms === null) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function CompletionSummary() {
  const { state } = useRun();
  const [report, setReport] = useState<ReleaseReport | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (state.status !== "completed") return;

    fetch(`/api/runs/${state.runId}/report`)
      .then((r) => {
        if (!r.ok) throw new Error("report fetch failed");
        return r.json() as Promise<ReleaseReport>;
      })
      .then(setReport)
      .catch(() => setError(true));
  }, [state.status, state.runId]);

  if (state.status !== "completed") return null;

  return (
    <motion.div
      className="summary"
      role="main"
      aria-labelledby="summary-heading"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <h1 id="summary-heading" className="summary-heading">
        Release Readiness Report
      </h1>

      {error && (
        <p className="summary-error">
          Could not load the full report. The run completed successfully.
        </p>
      )}

      {report && (
        <>
          {/* Metrics strip */}
          <ul className="summary-metrics" role="list" aria-label="Run metrics">
            <li>
              <span className="summary-metric__value">{report.metrics.totalEventsReceived}</span>
              <span className="summary-metric__label">events produced</span>
            </li>
            <li>
              <span className="summary-metric__value">{report.metrics.eventsSurfaced}</span>
              <span className="summary-metric__label">surfaced to you</span>
            </li>
            <li>
              <span className="summary-metric__value">
                {Math.round(report.metrics.suppressionRatio * 100)}%
              </span>
              <span className="summary-metric__label">routine — hidden</span>
            </li>
            <li>
              <span className="summary-metric__value">{fmt(report.metrics.timeToReportMs)}</span>
              <span className="summary-metric__label">total duration</span>
            </li>
          </ul>

          {/* Analyzer results */}
          <section aria-labelledby="summary-analyzers-heading">
            <h2 id="summary-analyzers-heading" className="summary-section-heading">
              Analyzer results
            </h2>
            <ul className="summary-analyzer-list" role="list">
              {report.analyzerReports.map((ar) => (
                <li
                  key={ar.analyzer}
                  className={`summary-analyzer ${PHASE_CLASS[ar.status] ?? ""}`}
                >
                  <span className="summary-analyzer__status">
                    {PHASE_LABEL[ar.status] ?? ar.status}
                  </span>
                  <span className="summary-analyzer__name">{ar.analyzer}</span>
                  <p className="summary-analyzer__summary">{ar.summary}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Decisions made */}
          {report.decisions.length > 0 && (
            <section aria-labelledby="summary-decisions-heading">
              <h2 id="summary-decisions-heading" className="summary-section-heading">
                Decisions made
              </h2>
              <ul className="summary-decisions" role="list">
                {report.decisions.map((d) => (
                  <li key={d.eventId} className="summary-decision">
                    <p className="summary-decision__question">{d.question}</p>
                    <p className="summary-decision__answer">→ {d.answer}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Needs review */}
          {report.reviewRequired.length > 0 && (
            <section aria-labelledby="summary-review-heading">
              <h2 id="summary-review-heading" className="summary-section-heading">
                Needs your review
              </h2>
              <ul className="summary-review-list" role="list">
                {report.reviewRequired.map((item) => (
                  <li key={item} className="summary-review-item">{item}</li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {!report && !error && (
        <p className="summary-loading" aria-live="polite">Generating report…</p>
      )}
    </motion.div>
  );
}
