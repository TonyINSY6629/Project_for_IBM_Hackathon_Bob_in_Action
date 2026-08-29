/**
 * RiskAlert
 *
 * Displays blocker and critical-risk notices alongside the garden.
 * Uses a calm amber/slate palette — no alarming red.
 * Each alert is dismissible but remains in RunState for the report.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRun } from "../context/RunContext";
import type { RoutedEvent } from "../types/bob-events";

const ROUTE_LABELS: Record<string, string> = {
  blocker: "Blocked",
  "critical-alert": "Risk detected",
};

const ROUTE_CLASS: Record<string, string> = {
  blocker: "risk-alert--blocker",
  "critical-alert": "risk-alert--risk",
};

function SingleAlert({ re, onDismiss }: { re: RoutedEvent; onDismiss: () => void }) {
  const label = ROUTE_LABELS[re.route] ?? re.route;
  const cls = ROUTE_CLASS[re.route] ?? "";

  return (
    <motion.div
      className={`risk-alert ${cls}`}
      role="alert"
      aria-live="assertive"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.25 }}
    >
      <div className="risk-alert__header">
        <span className="risk-alert__badge">{label}</span>
        <span className="risk-alert__analyzer">{re.event.analyzer}</span>
        <button
          className="risk-alert__dismiss"
          aria-label="Dismiss alert"
          onClick={onDismiss}
        >
          ×
        </button>
      </div>
      <p className="risk-alert__title">{re.event.title}</p>
    </motion.div>
  );
}

export function RiskAlert() {
  const { state } = useRun();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const alerts = [
    ...state.blockers,
    ...state.criticalRisks,
  ].filter((re) => !dismissed.has(re.event.id));

  if (alerts.length === 0) return null;

  return (
    <div className="risk-alert-stack" aria-label="Alerts">
      <AnimatePresence>
        {alerts.map((re) => (
          <SingleAlert
            key={re.event.id}
            re={re}
            onDismiss={() =>
              setDismissed((prev) => new Set([...prev, re.event.id]))
            }
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
