import {
  mapJudgement,
  resolveSubmissionStatus,
} from "pages/judgments/mapJudgement";
import type { RunDto, ScoreboardRow } from "shared/api/types";
import { parseTeamDisplayName, teamNameOnly } from "shared/lib/teamDisplayName";

export type RunStats = {
  solved: number;
  pending: number;
  failed: number;
};

/** Aggregate solved / pending / failed from listSubmitRuns. */
export function aggregateRunStats(runs: RunDto[]): RunStats {
  let solved = 0;
  let pending = 0;
  let failed = 0;

  for (const run of runs || []) {
    if (run.deleted) continue;
    const label = resolveSubmissionStatus(run);
    if (label === "In Queue") {
      pending += 1;
    } else if (label === "Accepted") {
      solved += 1;
    } else {
      failed += 1;
    }
  }

  return { solved, pending, failed };
}

/**
 * Find the authenticated team's scoreboard row.
 * Matches full display name, team-name-only, or login username.
 */
export function findMyTeamRow(
  rows: ScoreboardRow[],
  teamName: string | null | undefined,
  username?: string | null
): ScoreboardRow | null {
  if (!rows.length) return null;

  const candidates = [teamName, username]
    .map((v) => (v || "").trim().toLowerCase())
    .filter(Boolean);

  if (candidates.length === 0) return null;

  const shortCandidates = candidates.map((c) =>
    teamNameOnly(c).trim().toLowerCase()
  );

  return (
    rows.find((row) => {
      const raw = (row.teamName || "").trim().toLowerCase();
      if (!raw) return false;
      if (candidates.includes(raw)) return true;
      const short = teamNameOnly(raw).trim().toLowerCase();
      if (shortCandidates.includes(short)) return true;
      // Username often appears as a prefix/suffix in display names.
      return candidates.some(
        (c) => c.length >= 3 && (raw.includes(c) || short.includes(c))
      );
    }) ?? null
  );
}

/**
 * Progress of contest elapsed time. Returns null when length is unknown.
 */
export function contestProgressRatio(
  elapsedSeconds: number,
  contestLengthSeconds: number
): number | null {
  if (!contestLengthSeconds || contestLengthSeconds <= 0) return null;
  return Math.min(1, Math.max(0, elapsedSeconds / contestLengthSeconds));
}

export { mapJudgement, resolveSubmissionStatus, parseTeamDisplayName };
