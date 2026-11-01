/**
 * Pure contest-clock helpers — reusable anywhere (hooks, forms, API gates).
 * Pass fields from `useContestClock()` or a CLOCK_UPDATE payload.
 */

export type ContestClockInput = {
  /** True while the PC² contest clock is running (not paused). */
  isRunning: boolean;
  /** Seconds remaining; 0 means contest time is over. */
  timeLeft: number;
  /**
   * Optional: false until the first CLOCK_UPDATE arrives.
   * When omitted, phase treats the clock as known.
   */
  hasInitialData?: boolean;
};

export type ContestPhase = "unknown" | "running" | "paused" | "finished";

/**
 * High-level contest phase from clock fields.
 * - unknown: no clock yet
 * - finished: time remaining is zero
 * - paused: clock not running (and time still left, if known)
 * - running: clock running with time left
 */
export function getContestPhase(clock: ContestClockInput): ContestPhase {
  if (clock.hasInitialData === false) return "unknown";
  if (clock.timeLeft <= 0) return "finished";
  if (!clock.isRunning) return "paused";
  return "running";
}

/** Contest is actively running with time remaining (submissions allowed). */
export function isContestRunning(clock: ContestClockInput): boolean {
  return getContestPhase(clock) === "running";
}

/**
 * Whether the app should call catalog endpoints (`listProblem`, `listlanguages`).
 * Skip while paused, finished, or before the first clock update.
 */
export function shouldFetchContestCatalog(clock: ContestClockInput): boolean {
  return isContestRunning(clock);
}
