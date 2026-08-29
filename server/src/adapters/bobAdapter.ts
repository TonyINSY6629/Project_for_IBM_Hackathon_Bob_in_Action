/**
 * bobAdapter
 *
 * Live-mode stub for a future real IBM Bob 2.0 event stream connection.
 *
 * A real implementation would:
 *  - Connect to the IBM Bob 2.0 WebSocket or SSE endpoint
 *  - Translate IBM Bob native events into BobEvent objects
 *  - Forward them via the onEvent callback
 *  - Handle authentication (IBM Cloud API key, IAM token, etc.)
 *
 * This stub satisfies the Part 2 acceptance criteria.
 * It is NOT used by the demo — replay mode uses replayEventAdapter.ts.
 */

import type { ReplayAdapter, ReplayOptions, OnEventCallback } from "./replayEventAdapter.js";

export function createBobAdapter(
  _onEvent: OnEventCallback,
  _options?: ReplayOptions
): ReplayAdapter {
  function notImplemented(method: string): never {
    throw new Error(
      `bobAdapter.${method}(): live mode is not implemented. ` +
        "Use replay mode for the hackathon demo."
    );
  }

  return {
    start()                           { notImplemented("start"); },
    pause()                           { notImplemented("pause"); },
    resume()                          { notImplemented("resume"); },
    reset()                           { notImplemented("reset"); },
    submitAnswer(_id, _answer)        { notImplemented("submitAnswer"); },
    getState()                        { return "idle" as const; },
  };
}
