import { listSubmitRuns } from "shared/api/runsApi";
import { listProblems } from "shared/api/problemsApi";
import type { RunDto } from "shared/api/types";
import { formatTime } from "shared/lib/formatTime";
import { resolveSubmissionStatus } from "./mapJudgement";
import { useCallback, useEffect, useState } from "react";

const POLL_MS = 5000;

export type JudgmentRow = {
  id: number | string;
  submissionId: number | string | null;
  problem: string;
  problemLabel: string;
  time: string;
  lang: string;
  status: string;
};

export function mapRuns(
  data: RunDto[],
  shortNameByDisplay: Map<string, string>
): JudgmentRow[] {
  const sorted = [...(data || [])].sort(
    (a, b) => (b.runNumber || 0) - (a.runNumber || 0)
  );

  return sorted.map((item, index) => {
    const problem = item.problemName || item.problem || "N/A";
    const short = shortNameByDisplay.get(problem);
    return {
      // Local sequential row number, independent from PC²'s global run ID.
      id: sorted.length - index,
      submissionId: item.runNumber ?? null,
      problem,
      problemLabel: short ? `${short} - ${problem}` : problem,
      time: formatTime(item.submissionTime),
      lang: item.language || item.languageName || "-",
      status: resolveSubmissionStatus(item),
    };
  });
}

export function useJudgments() {
  const [submissions, setSubmissions] = useState<JudgmentRow[]>([]);
  const [problems, setProblems] = useState<{ name: string; shortName: string }[]>(
    []
  );
  const [shortNameByDisplay, setShortNameByDisplay] = useState<
    Map<string, string>
  >(new Map());
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadProblems = async () => {
      try {
        const list = await listProblems();
        if (cancelled) return;
        const map = new Map<string, string>();
        const active: { name: string; shortName: string }[] = [];
        for (const p of list) {
          if (!p.name) continue;
          const shortName = p.shortName || "";
          if (shortName) map.set(p.name, shortName);
          active.push({ name: p.name, shortName });
        }
        setShortNameByDisplay(map);
        setProblems(active);
      } catch (err) {
        console.error(err);
      }
    };
    void loadProblems();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchSubmissions = useCallback(async () => {
    try {
      const data = await listSubmitRuns();
      setSubmissions(mapRuns(data, shortNameByDisplay));
      setLoadError(null);
    } catch (err) {
      console.error(err);
      setLoadError(
        err instanceof Error ? err.message : "Unable to load submissions"
      );
    }
  }, [shortNameByDisplay]);

  useEffect(() => {
    void fetchSubmissions();
  }, [fetchSubmissions]);

  useEffect(() => {
    const interval = setInterval(() => {
      void fetchSubmissions();
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchSubmissions]);

  return {
    submissions,
    setSubmissions,
    fetchSubmissions,
    problems,
    loadError,
  };
}
