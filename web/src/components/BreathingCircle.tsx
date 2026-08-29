/**
 * BreathingCircle
 *
 * Guided breathing animation shown during the "running" state.
 * Inhale 4 s → hold 1 s → exhale 4 s, repeat.
 *
 * Wrapped in a Gray 100 dark recovery panel (intentional dark island
 * per IBM Carbon Design Brief § 1).
 *
 * Reduced-motion: animation stops; static text guidance shown instead.
 */

import { motion } from "framer-motion";

const BREATHE_DURATION = 9; // seconds for one full cycle

export function BreathingCircle() {
  return (
    <div className="recovery-panel">
      <div className="breathing" aria-hidden="true">
        <motion.div
          className="breathing-circle"
          animate={{
            scale: [1, 1.45, 1.45, 1],
            opacity: [0.55, 0.9, 0.9, 0.55],
          }}
          transition={{
            duration: BREATHE_DURATION,
            ease: "easeInOut",
            times: [0, 0.44, 0.55, 1],
            repeat: Infinity,
          }}
        />
        <motion.p
          className="breathing-label breathing-label--animated"
          animate={{ opacity: [0.4, 0.9, 0.9, 0.4] }}
          transition={{
            duration: BREATHE_DURATION,
            ease: "easeInOut",
            times: [0, 0.44, 0.55, 1],
            repeat: Infinity,
          }}
        >
          breathe
        </motion.p>
        {/* Shown only when prefers-reduced-motion is active */}
        <p className="breathing-label breathing-label--static">
          Take a breath
        </p>
      </div>
    </div>
  );
}
