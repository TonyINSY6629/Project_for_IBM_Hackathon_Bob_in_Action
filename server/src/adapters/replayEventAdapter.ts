/**
 * replayEventAdapter
 *
 * Replays a deterministic fixture of BobEvents with controlled timing.
 *
 * Features:
 *  - Loads events in sequence order (by `id` field, then `ts`)
 *  - Emits events with configurable delays (replayDelayMs or speedMultiplier)
 *  - Pauses automatically when a decision event is emitted
 *  - Resumes when an answer is submitted via submitAnswer()
 *  - Supports start / pause / resume / reset
 *  - Demo Mode (speedMultiplier=1): 60–90 second replay
 *  - Fast Mode (speedMultiplier=0.1): ~6–9 second replay for development
 *
 * Usage:
 *   const adapter = createReplayAdapter(events, onEvent);
 *   adapter.start();
 *   // later:
 *   adapter.submitAnswer(eventId, "Proceed with staged rollout");
 *   // to reset:
 *   adapter.reset();
 */

import type { BobEvent } from "../types/bob-events.js";

export type ReplayState = "idle" | "running" | "paused" | "done";

export interface ReplayAdapter {
  start(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  submitAnswer(eventId: string, answer: string): void;
  getState(): ReplayState;
}

export type OnEventCallback = (event: BobEvent) => void;
export type OnAnswerCallback = (eventId: string, answer: string) => void;

export interface ReplayOptions {
  /** Multiplier applied to replayDelayMs. 1 = real speed, 0.1 = 10× faster. */
  speedMultiplier?: number;
  /** Called when the adapter needs to notify the caller about a submitted answer */
  onAnswer?: OnAnswerCallback;
}

const DEFAULT_DELAY_MS = 1500;

export function createReplayAdapter(
  events: BobEvent[],
  onEvent: OnEventCallback,
  options: ReplayOptions = {}
): ReplayAdapter {
  const { speedMultiplier = 1, onAnswer } = options;

  // Sort events: by replayDelayMs cumulative position, fallback to id then ts
  const sorted = [...events].sort((a, b) => {
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return a.ts < b.ts ? -1 : 1;
  });

  let state: ReplayState = "idle";
  let currentIndex = 0;
  let currentTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingDecisionEventId: string | null = null;

  function clearTimer() {
    if (currentTimer !== null) {
      clearTimeout(currentTimer);
      currentTimer = null;
    }
  }

  function scheduleNext() {
    if (state !== "running") return;
    if (currentIndex >= sorted.length) {
      state = "done";
      return;
    }

    const event = sorted[currentIndex];
    const rawDelay = event.replayDelayMs ?? DEFAULT_DELAY_MS;
    const delay = Math.max(0, Math.round(rawDelay * speedMultiplier));

    currentTimer = setTimeout(() => {
      currentTimer = null;
      if (state !== "running") return;

      currentIndex++;
      onEvent(event);

      // Pause if this event requires a decision
      if (event.type === "question" && event.decision != null) {
        state = "paused";
        pendingDecisionEventId = event.id;
        return;
      }

      scheduleNext();
    }, delay);
  }

  return {
    start() {
      if (state !== "idle") return;
      state = "running";
      scheduleNext();
    },

    pause() {
      if (state !== "running") return;
      state = "paused";
      clearTimer();
    },

    resume() {
      if (state !== "paused") return;
      // Only resume if there is no pending decision (or it was already answered)
      if (pendingDecisionEventId !== null) return;
      state = "running";
      scheduleNext();
    },

    reset() {
      clearTimer();
      state = "idle";
      currentIndex = 0;
      pendingDecisionEventId = null;
    },

    submitAnswer(eventId: string, answer: string) {
      if (pendingDecisionEventId !== eventId) return;
      pendingDecisionEventId = null;
      onAnswer?.(eventId, answer);
      if (state === "paused") {
        state = "running";
        scheduleNext();
      }
    },

    getState() {
      return state;
    },
  };
}
