import { apiRequest, ApiError } from "./apiClient";
import { endpoints } from "./endpoints";
import { parseScoreboardResponse } from "./parseScoreboard";
import {
  isStandingsServiceStatus,
  standingsServiceMessage,
} from "./standingsErrors";
import type { ScoreboardRow, TeamRankResponse } from "./types";

export async function fetchScoreboard(): Promise<ScoreboardRow[]> {
  const { ok, status, data } = await apiRequest(endpoints.scoreboard, {
    method: "GET",
    csrf: false,
  });

  if (!ok) {
    throw new ApiError(standingsServiceMessage(status, data), {
      status,
      body: data,
    });
  }
  return parseScoreboardResponse(data);
}

export type TeamRankResult = {
  rank: number | null;
  /** Set when getrank failed because the scoreboard service is down — not a team logout. */
  serviceIssue: string | null;
};

/**
 * Logged-in team's contest rank from PC² standings.
 * 401/503 usually mean the PC² scoreboard account is unavailable, not the team JWT.
 */
export async function fetchTeamRank(): Promise<TeamRankResult> {
  const { ok, status, data } = await apiRequest<
    TeamRankResponse & { rank?: number }
  >(endpoints.getRank, { method: "GET", csrf: false });

  if (status === 428) {
    return { rank: null, serviceIssue: null };
  }

  if (!ok || isStandingsServiceStatus(status)) {
    return {
      rank: null,
      serviceIssue: standingsServiceMessage(status, data),
    };
  }

  const raw = data?.teamRank ?? data?.rank;
  if (raw == null || Number.isNaN(Number(raw)) || Number(raw) <= 0) {
    return { rank: null, serviceIssue: null };
  }
  return { rank: Number(raw), serviceIssue: null };
}
