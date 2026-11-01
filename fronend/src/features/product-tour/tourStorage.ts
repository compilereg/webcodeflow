/**
 * Persistence for the product tour.
 *
 * Keyed per-team so the tour re-runs for a different team on a shared
 * machine and never re-shows for a team that already dismissed or
 * finished it. Versioned so a future redesign can force a re-run by
 * bumping STORAGE_VERSION.
 */

import { getTeamName as getStoredTeamName } from "shared/auth/authStorage";
import type { TourState } from "./types";

const STORAGE_VERSION = "v1";
const STORAGE_PREFIX = "acpc:product-tour";

function getTeamName(): string | null {
  return getStoredTeamName();
}

function storageKey(teamName: string): string {
  return `${STORAGE_PREFIX}:${STORAGE_VERSION}:${teamName}`;
}

function defaultState(): TourState {
  return { status: "not_started", stepIndex: 0, updatedAt: Date.now() };
}

/**
 * Reads tour state for the currently logged-in team. Returns the
 * default ("not_started") state if there's no team identity yet, no
 * stored record, or the stored value is corrupt — never throws.
 */
export function readTourState(): TourState {
  const teamName = getTeamName();
  if (!teamName) return defaultState();

  try {
    const raw = localStorage.getItem(storageKey(teamName));
    if (!raw) return defaultState();

    const parsed = JSON.parse(raw) as Partial<TourState>;
    if (
      !parsed ||
      typeof parsed.status !== "string" ||
      typeof parsed.stepIndex !== "number"
    ) {
      return defaultState();
    }
    return {
      status: parsed.status as TourState["status"],
      stepIndex: parsed.stepIndex,
      updatedAt:
        typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return defaultState();
  }
}

/**
 * Writes tour state for the currently logged-in team. No-ops rather
 * than throwing if there's no team identity yet or storage is
 * unavailable.
 */
export function writeTourState(partial: Partial<TourState>): void {
  const teamName = getTeamName();
  if (!teamName) return;

  try {
    const current = readTourState();
    const next: TourState = {
      ...current,
      ...partial,
      updatedAt: Date.now(),
    };
    localStorage.setItem(storageKey(teamName), JSON.stringify(next));
  } catch {
    // Storage full, disabled, or unavailable — tour degrades gracefully.
  }
}

export function markInProgress(stepIndex: number): void {
  writeTourState({ status: "in_progress", stepIndex });
}

export function markSkipped(stepIndex: number): void {
  writeTourState({ status: "skipped", stepIndex });
}

export function markFinished(stepIndex: number): void {
  writeTourState({ status: "finished", stepIndex });
}
