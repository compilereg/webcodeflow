import { apiRequest } from "./apiClient";
import { endpoints } from "./endpoints";
import type { WsPathResponse } from "./types";

/**
 * Valid WebSocket path: starts with `/`, contains only safe URL path characters.
 * Rejects full URLs (http://, ws://) and paths that could escape the server.
 */
const VALID_PATH_PATTERN = /^\/[A-Za-z0-9/_\-.]*$/;

/**
 * Fetch the WebSocket path from the backend.
 * Returns null on error, 404, invalid response, or if the path fails validation.
 * This endpoint is public (no auth required).
 */
export async function fetchWsPath(): Promise<string | null> {
  try {
    const { ok, data } = await apiRequest<WsPathResponse>(endpoints.wsPath, {
      method: "GET",
      csrf: false,
      timeoutMs: 5000,
    });

    if (!ok) return null;

    const path = data?.socketPath;

    // Must be a non-empty string
    if (typeof path !== "string" || !path.trim()) {
      return null;
    }

    const trimmed = path.trim();

    // Validate: must match safe path pattern (rejects full URLs, etc.)
    if (!VALID_PATH_PATTERN.test(trimmed)) {
      if (import.meta.env.DEV) {
        console.warn("fetchWsPath: invalid socketPath from server:", trimmed);
      }
      return null;
    }

    return trimmed;
  } catch {
    return null;
  }
}
