/**
 * classifyEvent
 *
 * Pure function: BobEvent → AttentionRoute
 *
 * Routing rules (in priority order):
 *
 * 1. critical severity                    → critical-alert
 * 2. type === "risk" (any severity)       → critical-alert  (risk always surfaces)
 * 3. type === "complete" / phase === "done" → completed
 * 4. type === "question" with decision    → decision
 * 5. type === "blocker"                   → blocker
 * 6. everything else                      → visual-progress
 *
 * This function has no side effects and no external dependencies.
 * It is the core of the Attention Manager and must remain unit-testable
 * without any infrastructure setup.
 */

import type { AttentionRoute, BobEvent } from "../types/bob-events.js";

export function classifyEvent(event: BobEvent): AttentionRoute {
  // 1. Critical severity always surfaces immediately
  if (event.severity === "critical") {
    return "critical-alert";
  }

  // 2. Risk events surface regardless of severity
  if (event.type === "risk") {
    return "critical-alert";
  }

  // 3. Completion (either explicit type or phase reaching "done")
  if (event.type === "complete" || event.phase === "done") {
    return "completed";
  }

  // 4. Question with a valid decision payload
  if (event.type === "question" && event.decision != null) {
    return "decision";
  }

  // 5. Blocker
  if (event.type === "blocker") {
    return "blocker";
  }

  // 6. Everything else: routine progress, silently aggregated
  return "visual-progress";
}
