import type { Problem, ProblemDtoRaw } from "./types";

/**
 * Backend listProblems uses typo field `alphabte` for PC² shortName.
 * Normalize to shortName for the rest of the client.
 */
export function normalizeProblem(raw: ProblemDtoRaw | null | undefined): Problem | null | undefined {
  if (!raw || typeof raw !== "object") return raw as null | undefined;
  return {
    name: raw.name,
    shortName: raw.shortName || raw.alphabte || "",
    isDeleted: Boolean(raw.isDeleted),
  };
}

export function normalizeProblems(list: unknown): Problem[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => normalizeProblem(item as ProblemDtoRaw))
    .filter((p): p is Problem => Boolean(p));
}

export function activeProblems(list: unknown): Problem[] {
  return normalizeProblems(list).filter((p) => !p.isDeleted);
}
