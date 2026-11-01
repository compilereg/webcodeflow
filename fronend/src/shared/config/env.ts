/**
 * Normalize API base URL from VITE_API_URL.
 * Empty → same-origin relative paths (local Vite proxy or production).
 * Host:port without protocol → prefixed with http://
 */
export function normalizeApiBase(raw?: string | null): string {
  const trimmed = (raw || "").trim().replace(/\/$/, "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

export const getApiBase = (): string =>
  normalizeApiBase(import.meta.env.VITE_API_URL);

/** Default WebSocket path when backend endpoint is unavailable or returns invalid data. */
export const DEFAULT_WS_PATH = "/ws/contest";

/**
 * Returns the VITE_WS_URL override if set, otherwise empty string.
 * When set, this takes precedence over the backend-provided path.
 */
export function getWsUrlOverride(): string {
  return (import.meta.env.VITE_WS_URL || "").trim();
}

/**
 * Build a full WebSocket URL from a path.
 *
 * @param path - The WebSocket path (e.g., "/ws/contest")
 * @param apiBase - The API base URL (from getApiBase()). If set, its origin is used.
 * @param loc - The window.location object (for same-origin fallback)
 * @returns Full WebSocket URL (e.g., "wss://example.com/ws/contest")
 */
export function buildWsUrl(
  path: string,
  apiBase: string = getApiBase(),
  loc: Pick<Location, "protocol" | "host"> = typeof window !== "undefined"
    ? window.location
    : { protocol: "https:", host: "" }
): string {
  let wsProtocol: string;
  let host: string;

  if (apiBase) {
    // Use the API base's origin and map http(s) to ws(s)
    try {
      const url = new URL(apiBase);
      wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
      host = url.host;
    } catch {
      // Invalid URL, fall back to location
      wsProtocol = loc.protocol === "https:" ? "wss:" : "ws:";
      host = loc.host;
    }
  } else {
    // Same-origin: use window.location
    wsProtocol = loc.protocol === "https:" ? "wss:" : "ws:";
    host = loc.host;
  }

  // Ensure path starts with / and has no trailing slash
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const cleanPath = normalizedPath.replace(/\/+$/, "");

  return `${wsProtocol}//${host}${cleanPath}`;
}
