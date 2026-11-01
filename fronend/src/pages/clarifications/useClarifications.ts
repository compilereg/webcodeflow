import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ClarificationEventPayload } from "features/contest-realtime";
import { listProblems } from "shared/api/problemsApi";
import {
  listClarifications,
  submitClarification,
} from "shared/api/clarificationsApi";
import type { ClarificationDto, Problem } from "shared/api/types";
import {
  applyAnswerToPanes,
  filterTeamClarifications,
  isAnnouncement,
  mergePendingClarifications,
  partitionClarifications,
  sortClarifications,
} from "./clarificationModel";
import { getUsername } from "shared/auth/authStorage";

const POLL_MS = 15000;
const POST_SUBMIT_DELAYS_MS = [0, 400, 1200, 2500];
const CLARIFICATIONS_INVALIDATE = "contest-clarifications-invalidate";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function orderPanes(panes: {
  generic: ClarificationDto[];
  team: ClarificationDto[];
}) {
  return {
    generic: sortClarifications(panes.generic),
    team: sortClarifications(panes.team),
  };
}

export function useClarifications() {
  const [questions, setQuestions] = useState<Problem[]>([]);
  const [panes, setPanes] = useState<{
    generic: ClarificationDto[];
    team: ClarificationDto[];
  }>({ generic: [], team: [] });
  const [clarLoadError, setClarLoadError] = useState<string | null>(null);
  const hadListSuccess = useRef(false);

  const contestProblemNames = useMemo(() => {
    const names = new Set<string>();
    for (const q of questions) {
      if (q.name) names.add(q.name);
    }
    return names;
  }, [questions]);

  const loadQuestions = useCallback(async () => {
    try {
      const data = await listProblems();
      setQuestions(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadClarifications = useCallback(async () => {
    try {
      const data = await listClarifications();
      const ownClarifications = filterTeamClarifications(data, getUsername());
      const split = partitionClarifications(
        ownClarifications,
        contestProblemNames
      );
      setPanes((prev) =>
        orderPanes({
          generic: mergePendingClarifications(split.generic, prev.generic),
          team: mergePendingClarifications(split.team, prev.team),
        })
      );
      setClarLoadError(null);
      hadListSuccess.current = true;
      return { ...split, total: ownClarifications.length };
    } catch (err) {
      console.error(err);
      if (!hadListSuccess.current) {
        setClarLoadError(
          err instanceof Error ? err.message : "Unable to load clarifications"
        );
      }
      return null;
    }
  }, [contestProblemNames]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    void loadClarifications();
  }, [loadClarifications]);

  const applyAnswerPayload = useCallback(
    (payload?: ClarificationEventPayload | null) => {
      if (!payload) return;
      setPanes((prev) =>
        orderPanes(
          applyAnswerToPanes(
            prev.generic,
            prev.team,
            payload,
            contestProblemNames
          )
        )
      );
    },
    [contestProblemNames]
  );

  // Prefer WS invalidate (toast stays in WebSocketProvider). Slow poll is a
  // backup only when events are missed or the socket is down.
  useEffect(() => {
    const onInvalidate = (event: Event) => {
      const payload =
        event instanceof CustomEvent
          ? (event.detail as ClarificationEventPayload | null | undefined)
          : undefined;
      if (payload) applyAnswerPayload(payload);
      void loadClarifications();
    };
    window.addEventListener(CLARIFICATIONS_INVALIDATE, onInvalidate);
    const interval = setInterval(() => {
      void loadClarifications();
    }, POLL_MS);
    return () => {
      window.removeEventListener(CLARIFICATIONS_INVALIDATE, onInvalidate);
      clearInterval(interval);
    };
  }, [loadClarifications, applyAnswerPayload]);

  const sendClarification = useCallback(
    async ({
      type,
      selectedQuestion,
      message,
    }: {
      type: string;
      selectedQuestion: string;
      message: string;
    }): Promise<{ ok: true } | { ok: false; error: string }> => {
      if (!message || !type) {
        return { ok: false, error: "Choose a type and enter a message." };
      }
      if (type === "question" && !selectedQuestion) {
        return { ok: false, error: "Select a problem for your question." };
      }

      const problemName =
        type === "generic" ? "General" : selectedQuestion;
      const question = message.trim();

      const { ok, status, data } = await submitClarification({
        problemName,
        question,
      });

      if (!ok) {
        const body = data as { message?: string; error?: string } | null;
        const detail =
          body?.message ||
          body?.error ||
          (status === 403
            ? "Clarifications cannot be sent while the contest is paused or stopped."
            : `Unable to send clarification (${status || "error"}).`);
        return { ok: false, error: detail };
      }

      const optimistic: ClarificationDto = {
        ProblemName: problemName,
        Question: question,
        Answer: "",
        Status: "New",
      };

      setPanes((prev) =>
        orderPanes(
          type === "generic"
            ? { ...prev, generic: [optimistic, ...prev.generic] }
            : { ...prev, team: [optimistic, ...prev.team] }
        )
      );

      for (const delay of POST_SUBMIT_DELAYS_MS) {
        if (delay > 0) await sleep(delay);
        const result = await loadClarifications();
        const pane = type === "generic" ? result?.generic : result?.team;
        const appeared = pane?.some(
          (c) =>
            (c.ProblemName || "").trim().toLowerCase() ===
              problemName.toLowerCase() &&
            (c.Question || c.question || "").trim() === question
        );
        if (appeared) break;
      }

      return { ok: true };
    },
    [loadClarifications]
  );

  return {
    questions,
    contestProblemNames,
    announcements: panes.generic.filter(isAnnouncement),
    genericServerClarifications: panes.generic.filter(
      (clarification) => !isAnnouncement(clarification)
    ),
    teamClarifications: panes.team,
    loadError: clarLoadError,
    loadClarifications,
    applyAnswerPayload,
    sendClarification,
  };
}
