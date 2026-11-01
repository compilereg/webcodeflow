import type { ScoreboardProblem, ScoreboardRow } from "./types";

type RawProblemSummary = {
  fts?: boolean;
  isSolved?: boolean;
  isPending?: boolean;
  index?: number | string;
  solutionTime?: number | string;
  problemId?: string | number;
  shortName?: string;
  attempts?: number | string;
  points?: number | string;
  problemName?: string;
};

type RawTeamStanding = {
  teamName?: string;
  teamGroupName?: string;
  rank?: number | string;
  overallRank?: number | string;
  solved?: number | string;
  points?: number | string;
  penalty?: number | string;
  problemSummaryInfo?: RawProblemSummary | RawProblemSummary[];
  problems?: ScoreboardProblem[] | RawProblemSummary[];
};

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function unwrapJson(data: unknown): unknown {
  let current = data;
  // Jersey sometimes returns an already-stringified JSON body as a JSON string.
  for (let i = 0; i < 2; i += 1) {
    if (typeof current !== "string") break;
    const trimmed = current.trim();
    if (!trimmed) return null;
    try {
      current = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  return current;
}

function mapProblem(raw: RawProblemSummary, fallbackIndex: number): ScoreboardProblem {
  const index = asNumber(raw.index, fallbackIndex + 1);
  const shortRaw = (raw.shortName || "").trim();
  const shortName =
    shortRaw ||
    (index > 0 ? String.fromCharCode(64 + Math.min(index, 26)) : "?");

  const solutionTime = asNumber(raw.solutionTime, -1);

  return {
    problemId: index,
    problemName: raw.problemName,
    shortName: shortName.toUpperCase(),
    solved: Boolean(raw.isSolved),
    firstSolve: Boolean(raw.fts),
    pending: Boolean(raw.isPending),
    attempts: asNumber(raw.attempts, 0),
    solutionTime: solutionTime >= 0 ? solutionTime : undefined,
    penalty: asNumber(raw.points, 0),
  };
}

function mapTeamStanding(raw: RawTeamStanding): ScoreboardRow | null {
  const teamName = (raw.teamName || "").trim();
  if (!teamName) return null;

  // Prefer PC² `rank`; fall back to overallRank / DTO field names.
  const rank = asNumber(raw.rank ?? raw.overallRank, 0);
  const solved = asNumber(raw.solved, 0);
  const penalty = asNumber(raw.points ?? raw.penalty, 0);

  let problems: ScoreboardProblem[] = [];
  if (raw.problemSummaryInfo != null) {
    problems = asArray(raw.problemSummaryInfo).map(mapProblem);
  } else if (Array.isArray(raw.problems)) {
    // Already-normalized DTO rows (or partial DTO).
    problems = (raw.problems as RawProblemSummary[]).map((p, i) => {
      if (
        p &&
        typeof p === "object" &&
        ("isSolved" in p || "fts" in p || "isPending" in p)
      ) {
        return mapProblem(p, i);
      }
      const dto = p as unknown as ScoreboardProblem;
      return {
        problemId: asNumber(dto.problemId, i + 1),
        problemName: dto.problemName,
        shortName: (dto.shortName || String.fromCharCode(65 + i)).toUpperCase(),
        solved: Boolean(dto.solved),
        firstSolve: Boolean(dto.firstSolve),
        pending: Boolean(dto.pending),
        attempts: asNumber(dto.attempts, 0),
        solutionTime: dto.solutionTime,
        penalty: asNumber(dto.penalty, 0),
      };
    });
  }

  return {
    teamName,
    teamGroupName: (raw.teamGroupName || "").trim() || undefined,
    rank,
    solved,
    penalty,
    problems,
  };
}

function extractTeamList(data: unknown): RawTeamStanding[] {
  if (Array.isArray(data)) {
    return data as RawTeamStanding[];
  }
  if (!data || typeof data !== "object") return [];

  const obj = data as Record<string, unknown>;

  if (Array.isArray(obj.rows)) return obj.rows as RawTeamStanding[];
  if (Array.isArray(obj.standings)) return obj.standings as RawTeamStanding[];

  const contestStandings = obj.contestStandings;
  if (contestStandings && typeof contestStandings === "object") {
    const standing = (contestStandings as { teamStanding?: unknown })
      .teamStanding;
    return asArray(standing as RawTeamStanding | RawTeamStanding[]);
  }

  if (obj.teamStanding != null) {
    return asArray(obj.teamStanding as RawTeamStanding | RawTeamStanding[]);
  }

  return [];
}

/**
 * Normalize GET /api/main/scoreboard JSON into UI rows.
 *
 * Expected PC² / WTI shape (from DSA XML→JSON):
 * `{ contestStandings: { teamStanding: [ { teamName, rank, solved, points, problemSummaryInfo: [...] } ] } }`
 *
 * Also accepts a top-level `ScoreboardRowDTO[]` if the API returns that.
 */
export function parseScoreboardResponse(data: unknown): ScoreboardRow[] {
  const unwrapped = unwrapJson(data);
  const teams = extractTeamList(unwrapped);
  return teams
    .map(mapTeamStanding)
    .filter((row): row is ScoreboardRow => row != null);
}
