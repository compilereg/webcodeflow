import { apiRequest, ApiError } from "./apiClient";
import { endpoints } from "./endpoints";
import type { RunDto, SubmitRunRequest, SubmitRunResponse } from "./types";

export async function listSubmitRuns(): Promise<RunDto[]> {
  const { ok, status, data } = await apiRequest<
    { submissions?: RunDto[] } | RunDto[]
  >(endpoints.listSubmitRuns, { method: "GET" });

  if (!ok) {
    throw new ApiError("Unable to load submissions", { status, body: data });
  }

  if (Array.isArray(data)) return data;
  return data?.submissions || [];
}

function runNumberOf(run: RunDto): number | null {
  const n = run.runNumber ?? run.id;
  if (n == null || Number.isNaN(Number(n))) return null;
  return Number(n);
}

function runProblemName(run: RunDto): string {
  return (run.problemName || run.problem || "").trim().toLowerCase();
}

function runLanguageName(run: RunDto): string {
  return (run.languageName || run.language || "").trim().toLowerCase();
}

/**
 * Among runs that appeared after `knownRunNumbers`, pick the submission id.
 * - Prefer exactly one new match for problem+language.
 * - If several (rare with submit lock), take the smallest new id (earliest PC² allocation).
 */
export function pickNewSubmissionId(
  runs: RunDto[],
  problemName: string,
  languageName: string,
  knownRunNumbers: Set<number>
): number | null {
  const problem = problemName.trim().toLowerCase();
  const language = languageName.trim().toLowerCase();

  const newIds = runs
    .filter((run) => {
      const id = runNumberOf(run);
      if (id == null || knownRunNumbers.has(id)) return false;
      return (
        runProblemName(run) === problem && runLanguageName(run) === language
      );
    })
    .map((run) => runNumberOf(run)!)
    .sort((a, b) => a - b);

  if (newIds.length === 0) return null;
  return newIds[0];
}

/** After submit, PC² may need a moment before the new run appears in listSubmitRuns. */
export async function resolveSubmissionIdAfterSubmit(
  problemName: string,
  languageName: string,
  knownRunNumbers: Set<number>
): Promise<number | null> {
  const delaysMs = [0, 300, 700, 1200];

  for (const delay of delaysMs) {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const runs = await listSubmitRuns();
    const id = pickNewSubmissionId(
      runs,
      problemName,
      languageName,
      knownRunNumbers
    );
    if (id != null) return id;
  }

  return null;
}

export async function collectKnownRunNumbers(): Promise<Set<number>> {
  try {
    const runs = await listSubmitRuns();
    const ids = runs
      .map(runNumberOf)
      .filter((id): id is number => id != null);
    return new Set(ids);
  } catch {
    return new Set();
  }
}

export async function submitRun(body: SubmitRunRequest) {
  return apiRequest<SubmitRunResponse>(endpoints.submitRun, {
    method: "POST",
    body,
  });
}
