import { useEffect, useRef, useState } from "react";
import { useContestClock } from "features/contest-realtime";
import { listLanguages, listProblems } from "shared/api/problemsApi";
import type { Language, Problem } from "shared/api/types";
import { shouldFetchContestCatalog } from "shared/lib/contestStatus";

const POLL_MS = 10000;

/**
 * Loads problems + languages for Quick Submit.
 * Polls only while the contest is running; pauses/stops catalog API calls
 * when the clock is paused or finished (keeps the last loaded lists).
 */
export function useContestCatalog() {
  const { isRunning, timeLeft, hasInitialData } = useContestClock();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hadSuccess = useRef(false);

  const canFetch = shouldFetchContestCatalog({
    isRunning,
    timeLeft,
    hasInitialData,
  });

  useEffect(() => {
    if (!canFetch) return;

    let cancelled = false;

    const loadData = async () => {
      try {
        const [p, l] = await Promise.all([listProblems(), listLanguages()]);
        if (cancelled) return;
        setProblems(p);
        setLanguages(l);
        setLoadError(null);
        hadSuccess.current = true;
      } catch (err) {
        console.error("Load Error:", err);
        if (cancelled) return;
        // Keep last good catalog; only show error if we never loaded.
        if (!hadSuccess.current) {
          setLoadError(
            err instanceof Error ? err.message : "Unable to load contest catalog"
          );
        }
      }
    };

    void loadData();
    const interval = setInterval(() => {
      void loadData();
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [canFetch]);

  return { problems, languages, loadError };
}
