import type { ClarificationEventPayload } from "features/contest-realtime";
import type { ClarificationDto } from "shared/api/types";

export function questionText(c: ClarificationDto): string {
  return (c.Question || c.question || "").trim();
}

export function normalizeQuestion(text?: string | null): string {
  return (text || "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function isGeneralProblem(name?: string | null): boolean {
  const n = (name || "").trim().toLowerCase();
  return !n || n === "general" || n === "generic";
}

export function isAnnouncement(c: ClarificationDto): boolean {
  return (c.Status || "").trim().toLowerCase() === "broadcast";
}

/** General/category clars (not a contest problem). PC² may not name the category "General". */
export function isGeneralClarification(
  name?: string | null,
  contestProblemNames?: Set<string>
): boolean {
  if (isGeneralProblem(name)) return true;
  if (!name || !contestProblemNames || contestProblemNames.size === 0) {
    return false;
  }
  const needle = name.trim().toLowerCase();
  for (const problem of contestProblemNames) {
    if (problem.trim().toLowerCase() === needle) return false;
  }
  return true;
}

/** Show this team's private records plus judge-approved all-team broadcasts. */
export function filterTeamClarifications(
  list: ClarificationDto[],
  loginName?: string | null
): ClarificationDto[] {
  const owner = normalizeQuestion(loginName);
  if (!owner) return [];
  return list.filter(
    (c) =>
      isAnnouncement(c) ||
      normalizeQuestion(c.teamname) === owner
  );
}

export function partitionClarifications(
  list: ClarificationDto[],
  contestProblemNames?: Set<string>
) {
  const generic: ClarificationDto[] = [];
  const team: ClarificationDto[] = [];

  for (const c of list) {
    if (
      isGeneralClarification(c.ProblemName, contestProblemNames) ||
      isAnnouncement(c)
    ) {
      generic.push(c);
    } else {
      team.push(c);
    }
  }

  return { generic, team };
}

export type ClarificationSortKey =
  | "ClarificationId"
  | "ClarificationTime";
export type ClarificationSortDirection = "asc" | "desc";

/** Newest first by PC² contest submission time; higher ID breaks ties. */
export function sortClarifications(
  list: ClarificationDto[],
  key: ClarificationSortKey = "ClarificationTime",
  direction: ClarificationSortDirection = "desc"
): ClarificationDto[] {
  const sign = direction === "asc" ? 1 : -1;

  return [...list].sort((a, b) => {
    // Prefer contest time when available; fall back to ID for missing times.
    const aTime =
      a.ClarificationTime != null ? Number(a.ClarificationTime) : null;
    const bTime =
      b.ClarificationTime != null ? Number(b.ClarificationTime) : null;
    const aId = a.ClarificationId != null ? Number(a.ClarificationId) : null;
    const bId = b.ClarificationId != null ? Number(b.ClarificationId) : null;

    if (key === "ClarificationTime") {
      // Optimistic / not-yet-synced rows stay on top while waiting for PC².
      if (aTime == null && bTime != null) return -1;
      if (aTime != null && bTime == null) return 1;
      if (aTime != null && bTime != null && aTime !== bTime) {
        return (aTime - bTime) * sign;
      }
      if (aId != null && bId != null && aId !== bId) {
        return (aId - bId) * sign;
      }
      return 0;
    }

    const aValue = aId ?? Number(a[key] ?? 0);
    const bValue = bId ?? Number(b[key] ?? 0);
    if (aValue !== bValue) return (aValue - bValue) * sign;
    if (aTime != null && bTime != null && aTime !== bTime) {
      return (aTime - bTime) * sign;
    }
    return 0;
  });
}

export function clarificationKey(c: ClarificationDto): string {
  return `${normalizeQuestion(c.ProblemName)}|${normalizeQuestion(questionText(c))}`;
}

function preferNewerAnswer(
  server: ClarificationDto,
  previous?: ClarificationDto
): ClarificationDto {
  if (!previous) return server;
  const serverAnswer = (server.Answer || "").trim();
  const prevAnswer = (previous.Answer || "").trim();
  if (!serverAnswer && prevAnswer) {
    return {
      ...server,
      Answer: previous.Answer,
      Status: previous.Status || "Answered",
    };
  }
  return server;
}

/** Keep optimistic rows and locally patched answers until the list API catches up. */
export function mergePendingClarifications(
  server: ClarificationDto[],
  previous: ClarificationDto[]
): ClarificationDto[] {
  const prevById = new Map<number, ClarificationDto>();
  const prevByKey = new Map<string, ClarificationDto>();
  for (const c of previous) {
    if (c.ClarificationId != null) prevById.set(c.ClarificationId, c);
    prevByKey.set(clarificationKey(c), c);
  }

  const merged = server.map((s) =>
    preferNewerAnswer(
      s,
      (s.ClarificationId != null ? prevById.get(s.ClarificationId) : undefined) ||
        prevByKey.get(clarificationKey(s))
    )
  );

  const serverKeys = new Set(merged.map(clarificationKey));
  const pending = previous.filter(
    (c) => c.ClarificationId == null && !serverKeys.has(clarificationKey(c))
  );
  return pending.length === 0 ? merged : [...pending, ...merged];
}

export function matchesClarificationPayload(
  c: ClarificationDto,
  payload?: ClarificationEventPayload | null,
  contestProblemNames?: Set<string>
): boolean {
  if (!payload) return false;

  const localQ = normalizeQuestion(questionText(c));
  const remoteQ = normalizeQuestion(payload.question);
  const questionsMatch = !remoteQ || localQ === remoteQ;

  const localGeneral =
    isGeneralProblem(c.ProblemName) ||
    c.Status === "Broadcast" ||
    isGeneralClarification(c.ProblemName, contestProblemNames);
  const remoteGeneral = isGeneralClarification(
    payload.problem,
    contestProblemNames
  );

  // General rows match on question text: PC² often sends a category name, not "General".
  if (localGeneral) {
    return questionsMatch && (remoteGeneral || isGeneralProblem(payload.problem) || !contestProblemNames?.size);
  }

  return (
    questionsMatch &&
    (c.ProblemName || "").trim().toLowerCase() ===
      (payload.problem || "").trim().toLowerCase()
  );
}

export function applyClarificationAnswer(
  list: ClarificationDto[],
  payload?: ClarificationEventPayload | null,
  contestProblemNames?: Set<string>
): { list: ClarificationDto[]; matched: boolean } {
  if (!payload) return { list, matched: false };
  const answer = payload.answer ?? "";
  let matched = false;

  const next = list.map((c) => {
    if (!matchesClarificationPayload(c, payload, contestProblemNames)) {
      return c;
    }
    matched = true;
    return {
      ...c,
      Answer: answer,
      Status: payload.answered === false ? c.Status : "Answered",
      Question: c.Question || c.question || payload.question,
    };
  });

  return { list: next, matched };
}

export function applyAnswerToPanes(
  generic: ClarificationDto[],
  team: ClarificationDto[],
  payload?: ClarificationEventPayload | null,
  contestProblemNames?: Set<string>
): { generic: ClarificationDto[]; team: ClarificationDto[] } {
  if (!payload) return { generic, team };

  const nextGeneric = applyClarificationAnswer(
    generic,
    payload,
    contestProblemNames
  );
  const nextTeam = applyClarificationAnswer(team, payload, contestProblemNames);

  if (payload.broadcast) {
    const existing =
      generic.find((c) =>
        matchesClarificationPayload(c, payload, contestProblemNames)
      ) ||
      team.find((c) =>
        matchesClarificationPayload(c, payload, contestProblemNames)
      );
    const broadcast: ClarificationDto = {
      ...existing,
      teamname: payload.teamname || existing?.teamname,
      ClarificationId:
        payload.clarificationId ?? existing?.ClarificationId,
      ClarificationTime:
        payload.clarificationTime ?? existing?.ClarificationTime,
      ProblemName: payload.problem || "General",
      Question: payload.question || "",
      Answer: payload.answer || "",
      Status: "Broadcast",
    };
    return {
      generic: [
        broadcast,
        ...nextGeneric.list.filter(
          (c) =>
            !matchesClarificationPayload(c, payload, contestProblemNames)
        ),
      ],
      team: nextTeam.list.filter(
        (c) =>
          !matchesClarificationPayload(c, payload, contestProblemNames)
      ),
    };
  }

  if (nextGeneric.matched || nextTeam.matched) {
    return { generic: nextGeneric.list, team: nextTeam.list };
  }

  // Never create a private row from an unmatched event.
  return { generic: nextGeneric.list, team: nextTeam.list };
}
