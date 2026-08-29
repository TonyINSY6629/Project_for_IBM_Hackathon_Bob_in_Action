/**
 * AgentPlant
 *
 * Renders a single analyzer as a growing plant.
 * Visual state is derived from the analyzer's phase and progress.
 *
 * States:
 *   planned  → 🌱 Seedling — small, static
 *   working  → 🌿 Growing  — animated stem height driven by progress
 *   waiting  → ⏸️ Paused   — frozen mid-growth (whole garden paused)
 *   blocked  → 🍂 Wilting  — drooping animation
 *   done     → 🌸 Flowering — bloomed
 */

import { motion, AnimatePresence } from "framer-motion";
import type { AnalyzerState } from "../types/bob-events";

const ANALYZER_LABELS: Record<string, string> = {
  "diff-analyst": "Change Analysis",
  "deps-scanner": "Dependency Scan",
  "test-runner": "Test Runner",
  "doc-writer": "Doc Writer",
};

interface AgentPlantProps {
  analyzer: AnalyzerState;
  paused?: boolean;
}

function PlantIcon({ phase }: { phase: string }) {
  if (phase === "done") return <span className="plant-icon plant-icon--done">🌸</span>;
  if (phase === "blocked") return <span className="plant-icon plant-icon--blocked">🍂</span>;
  if (phase === "planned") return <span className="plant-icon plant-icon--planned">🌱</span>;
  return <span className="plant-icon plant-icon--growing">🌿</span>;
}

export function AgentPlant({ analyzer, paused = false }: AgentPlantProps) {
  const { id, phase, progress } = analyzer;
  const label = ANALYZER_LABELS[id] ?? id;

  const stemHeight = Math.max(4, (progress / 100) * 80); // px, 4–80

  return (
    <div
      className={`plant plant--${phase}${paused ? " plant--paused" : ""}`}
      role="listitem"
      aria-label={`${label}: ${phase}, ${progress}% complete`}
    >
      {/* Stem */}
      <div className="plant-stem-track">
        <motion.div
          className="plant-stem"
          animate={
            phase === "blocked"
              ? { height: stemHeight, rotate: [-2, 2, -2], transition: { repeat: Infinity, duration: 1.4 } }
              : { height: stemHeight }
          }
          transition={paused ? { duration: 0 } : { duration: 0.8, ease: "easeOut" }}
          style={{ height: stemHeight }}
        />
      </div>

      {/* Flower / icon */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <PlantIcon phase={phase} />
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <div
        className="plant-progress-track"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} progress`}
      >
        <motion.div
          className="plant-progress-fill"
          animate={{ width: `${progress}%` }}
          transition={paused ? { duration: 0 } : { duration: 0.6 }}
        />
      </div>

      {/* Label */}
      <p className="plant-label">{label}</p>
    </div>
  );
}
