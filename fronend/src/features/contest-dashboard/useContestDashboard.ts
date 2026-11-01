import { useEffect, useMemo, useState } from "react";
import {
  useContestClock,
  useContestConnection,
} from "features/contest-realtime";
import { listSubmitRuns } from "shared/api/runsApi";
import { fetchTeamRank } from "shared/api/scoreboardApi";
import type { RunDto } from "shared/api/types";
import { getTeamName, getUsername } from "shared/auth/authStorage";
import {
  aggregateRunStats,
  contestProgressRatio,
  findMyTeamRow,
} from "pages/home/runStats";

const RUNS_POLL_MS = 5000;

/** Shared dashboard data for the pinned contest sidebar + stats row. */
export function useContestDashboard() {
  const { scoreboard: liveScoreboard } = useContestConnection();
  const { elapsedSeconds, contestLengthSeconds } = useContestClock();

  const [teamName, setTeamName] = useState<string | null>(getTeamName());
  const [username, setUsername] = useState<string | null>(getUsername());
  const [runs, setRuns] = useState<RunDto[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [standingsIssue, setStandingsIssue] = useState<string | null>(null);

  useEffect(() => {
    const updateIdentity = () => {
      setTeamName(getTeamName());
      setUsername(getUsername());
    };
    updateIdentity();
    window.addEventListener("authChanged", updateIdentity);
    return () => window.removeEventListener("authChanged", updateIdentity);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadRuns = async () => {
      try {
        const data = await listSubmitRuns();
        if (!cancelled) setRuns(data);
      } catch (err) {
        console.error("Contest runs fetch error:", err);
      }
    };
    void loadRuns();
    const interval = setInterval(() => {
      void loadRuns();
    }, RUNS_POLL_MS);
    const onInvalidate = () => {
      void loadRuns();
    };
    window.addEventListener("contest-runs-invalidate", onInvalidate);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("contest-runs-invalidate", onInvalidate);
    };
  }, []);

  // Rank: one initial fetch, then only when standings change (WS SCOREBOARD_UPDATED).
  useEffect(() => {
    let cancelled = false;

    const loadRank = async () => {
      try {
        const next = await fetchTeamRank();
        if (cancelled) return;
        setRank(next.rank);
        setStandingsIssue(next.serviceIssue);
      } catch (err) {
        console.error("Contest rank fetch error:", err);
        if (!cancelled) {
          setRank(null);
          setStandingsIssue(
            err instanceof Error
              ? err.message
              : "Standings temporarily unavailable."
          );
        }
      }
    };

    void loadRank();
    const onInvalidate = () => {
      void loadRank();
    };
    window.addEventListener("contest-rank-invalidate", onInvalidate);
    return () => {
      cancelled = true;
      window.removeEventListener("contest-rank-invalidate", onInvalidate);
    };
  }, []);

  const myTeam = useMemo(
    () => findMyTeamRow(liveScoreboard, teamName, username),
    [liveScoreboard, teamName, username]
  );

  const runStats = useMemo(() => aggregateRunStats(runs), [runs]);

  const progressRatio = useMemo(
    () => contestProgressRatio(elapsedSeconds, contestLengthSeconds),
    [elapsedSeconds, contestLengthSeconds]
  );

  // Prefer getRank; fall back to scoreboard row if API has no usable rank yet.
  const resolvedRank =
    rank ??
    (myTeam?.rank != null && myTeam.rank > 0 ? myTeam.rank : null);

  return {
    teamName,
    username,
    rank: resolvedRank,
    /** Scoreboard row match (solves/penalty); rank prefers getRank. */
    myTeam,
    standingsIssue,
    solved: runStats.solved,
    pending: runStats.pending,
    failed: runStats.failed,
    progressRatio,
  };
}
