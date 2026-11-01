import { fetchWsPath } from "shared/api/wsPathApi";
import {
  buildWsUrl,
  DEFAULT_WS_PATH,
  getWsUrlOverride,
} from "shared/config/env";

/**
 * Cached promise for the WebSocket URL resolution.
 * - Caches successful results to avoid repeated fetches on remounts/reconnects.
 * - Does NOT cache failures, so the next attempt will try again.
 */
let cachedPromise: Promise<string> | null = null;
let cachedResult: string | null = null;

/**
 * Resolve the WebSocket URL with the following precedence:
 * 1. VITE_WS_URL override (if set)
 * 2. Backend path from GET /api/main/getwspath
 * 3. Default path "/ws/contest" (fallback)
 *
 * Results are cached per page load. Use invalidateWsPath() to clear.
 */
export async function resolveWsUrl(): Promise<string> {
  // 1. Check for explicit override
  const override = getWsUrlOverride();
  if (override) {
    return override;
  }

  // 2. Return cached result if available
  if (cachedResult) {
    return cachedResult;
  }

  // 3. Return in-flight promise if one exists
  if (cachedPromise) {
    return cachedPromise;
  }

  // 4. Fetch from backend
  cachedPromise = (async () => {
    const backendPath = await fetchWsPath();

    if (backendPath) {
      // Success: cache the result
      cachedResult = buildWsUrl(backendPath);
      return cachedResult;
    }

    // Failure: use default, but don't cache (allow retry)
    if (import.meta.env.DEV) {
      console.warn(
        "resolveWsUrl: backend path unavailable, using default:",
        DEFAULT_WS_PATH
      );
    }
    return buildWsUrl(DEFAULT_WS_PATH);
  })();

  try {
    const result = await cachedPromise;
    // Only keep the promise cached if we got a successful backend response
    if (!cachedResult) {
      // Failed fetch: clear promise so next call retries
      cachedPromise = null;
    }
    return result;
  } catch {
    // Clear promise on error
    cachedPromise = null;
    return buildWsUrl(DEFAULT_WS_PATH);
  }
}

/**
 * Clear the cached WebSocket path.
 * Call this when the socket fails to connect (e.g., 403 on handshake),
 * which may indicate the backend has a new path after restart.
 */
export function invalidateWsPath(): void {
  cachedPromise = null;
  cachedResult = null;
  if (import.meta.env.DEV) {
    console.log("invalidateWsPath: cache cleared");
  }
}
