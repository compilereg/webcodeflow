import { useEffect, useRef, useState } from "react";
import { fetchScoreboard } from "shared/api/scoreboardApi";
import type { ScoreboardRow } from "shared/api/types";

function formatRelative(secondsAgo: number): string {
  if (secondsAgo < 5) return "just now";
  if (secondsAgo < 60) return `${secondsAgo}s ago`;
  const mins = Math.floor(secondsAgo / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

/**
 * Scoreboard data for the Live Standings page only.
 * - REST fetch on mount (entering the page)
 * - REST refetch when backend signals dirty standings and WS has no rows yet
 * - Prefer live WS rows when present
 */
export function useScoreboard(liveScoreboard: ScoreboardRow[] = []) {
  const [apiScoreboard, setApiScoreboard] = useState<ScoreboardRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const liveLenRef = useRef(liveScoreboard.length);
  const hadSuccess = useRef(false);
  liveLenRef.current = liveScoreboard.length;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchScoreboard();
        if (cancelled) return;
        setApiScoreboard(data);
        setLoadError(null);
        hadSuccess.current = true;
        if (data.length > 0) setUpdatedAt(Date.now());
      } catch (err) {
        console.error("Scoreboard fetch error:", err);
        if (cancelled) return;
        if (!hadSuccess.current && liveLenRef.current === 0) {
          setLoadError(
            err instanceof Error ? err.message : "Unable to load scoreboard"
          );
        }
      }
    };

    void load();

    const onInvalidate = () => {
      if (liveLenRef.current > 0) {
        setUpdatedAt(Date.now());
        return;
      }
      void load();
    };
    window.addEventListener("contest-scoreboard-invalidate", onInvalidate);

    return () => {
      cancelled = true;
      window.removeEventListener("contest-scoreboard-invalidate", onInvalidate);
    };
  }, []);

  const scoreboardData =
    liveScoreboard.length > 0 ? liveScoreboard : apiScoreboard;

  useEffect(() => {
    if (scoreboardData.length > 0) {
      setUpdatedAt(Date.now());
      setLoadError(null);
    }
  }, [scoreboardData]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const secondsAgo =
    updatedAt == null ? null : Math.max(0, Math.floor((now - updatedAt) / 1000));

  const lastUpdateRelative =
    secondsAgo == null ? "waiting…" : formatRelative(secondsAgo);

  return {
    scoreboardData,
    lastUpdateRelative,
    hasData: scoreboardData.length > 0,
    loadError,
  };
}
