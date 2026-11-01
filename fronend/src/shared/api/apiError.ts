import type { ApiErrorBody } from "./types";

function statusFallback(status: number): string | null {
  if (status === 0 || status === 404) return "AUTH_UNREACHABLE";
  if (status === 401) return "AUTH_INVALID_CREDENTIALS";
  if (status === 403) return "AUTH_TEAM_ONLY";
  if (status === 429) return "AUTH_RATE_LIMIT";
  if (status === 503) return "AUTH_UNAVAILABLE";
  if (status >= 500) return "AUTH_SERVER";
  return null;
}

/** Pull a user-facing message from an API body + HTTP status. */
export function extractApiError(
  data: unknown,
  status: number,
  fallback = "Request failed"
): string {
  if (data && typeof data === "object") {
    const body = data as ApiErrorBody;
    const raw = body.error || body.message;
    if (typeof raw === "string" && raw.trim()) {
      const text = raw.trim();
      // Backend login catch-all is just "Login failed" — be specific.
      if (text.toLowerCase() === "login failed" && status === 401) {
        return "AUTH_INVALID_CREDENTIALS";
      }
      if (status === 403) return "AUTH_TEAM_ONLY";
      if (status === 429) return "AUTH_RATE_LIMIT";
      return text;
    }
  }

  if (typeof data === "string") {
    const text = data.trim();
    if (text && !text.startsWith("<")) return text;
  }

  return statusFallback(status) || fallback;
}

export function networkErrorMessage(err: unknown): string {
  if (err instanceof DOMException && err.name === "AbortError") {
    return "AUTH_TIMEOUT";
  }
  if (err instanceof TypeError) return "AUTH_UNREACHABLE";
  return "AUTH_UNREACHABLE";
}
