import { apiRequest } from "./apiClient";
import { endpoints } from "./endpoints";
import type { ContestInfoResponse } from "./types";

/** Public contest metadata (scoreboard connection; no team session required). */
export async function fetchContestInfo(): Promise<string | null> {
  try {
    const { ok, data } = await apiRequest<ContestInfoResponse>(
      endpoints.contestInfo,
      {
        method: "GET",
        csrf: false,
        timeoutMs: 5000,
      }
    );
    if (!ok) return null;
    const title = data?.contestTitle?.trim();
    return title || null;
  } catch {
    return null;
  }
}
