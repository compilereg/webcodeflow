import { apiRequest, ApiError } from "./apiClient";
import { endpoints } from "./endpoints";
import { activeProblems, normalizeProblems } from "./normalize";
import type { Language, Problem } from "./types";

export async function listProblems({
  includeDeleted = false,
}: { includeDeleted?: boolean } = {}): Promise<Problem[]> {
  const { ok, status, data } = await apiRequest(endpoints.listProblem, {
    method: "GET",
  });

  if (!ok) {
    throw new ApiError("Unable to load problems", { status, body: data });
  }

  return includeDeleted ? normalizeProblems(data) : activeProblems(data);
}

export async function listLanguages(): Promise<Language[]> {
  const { ok, status, data } = await apiRequest(endpoints.listLanguages, {
    method: "GET",
  });

  if (!ok) {
    throw new ApiError("Unable to load languages", { status, body: data });
  }
  return Array.isArray(data) ? (data as Language[]) : [];
}
