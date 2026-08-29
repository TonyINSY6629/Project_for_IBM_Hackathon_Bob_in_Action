/**
 * DecisionCard
 *
 * Shown when RunState.pendingDecision is non-null.
 * Presents the question and options from the event's decision payload.
 * Emits the selected answer via submitAnswer from RunContext.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { useRun } from "../context/RunContext";

export function DecisionCard() {
  const { state, submitAnswer } = useRun();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pending = state.pendingDecision;
  if (!pending) return null;

  const { event } = pending;
  const decision = event.decision!;

  async function handleSubmit() {
    if (!selected || submitting) return;
    setSubmitting(true);
    await submitAnswer(event.id, selected);
    setSelected(null);
    setSubmitting(false);
  }

  return (
    <motion.div
      className="decision-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="decision-question"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.25 }}
    >
      <p className="decision-card__from">
        <span className="decision-card__badge">{event.analyzer}</span>
        {" "}needs your input
      </p>

      <h2 id="decision-question" className="decision-card__question">
        {decision.question}
      </h2>

      <ul className="decision-card__options" role="list">
        {decision.options.map((opt) => (
          <li key={opt}>
            <button
              className={`decision-card__option${selected === opt ? " decision-card__option--selected" : ""}`}
              onClick={() => setSelected(opt)}
              aria-pressed={selected === opt}
            >
              {opt}
            </button>
          </li>
        ))}
      </ul>

      <button
        className="decision-card__submit"
        onClick={() => void handleSubmit()}
        disabled={!selected || submitting}
        aria-busy={submitting}
      >
        {submitting ? "Submitting…" : "Confirm"}
      </button>
    </motion.div>
  );
}
