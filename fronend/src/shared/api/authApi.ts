import { apiRequest } from "./apiClient";
import { extractApiError, networkErrorMessage } from "./apiError";
import { endpoints } from "./endpoints";
import {
  clearAuthenticationStorage,
  notifyAuthChanged,
  setAuthSession,
} from "shared/auth/authStorage";
import type { LoginResponse, SessionResponse } from "./types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Probe the JWT cookie session.
 * - `authenticated: true` — valid team session
 * - `authenticated: false, unreachable: true` — network/timeout (do not treat as logout)
 * - `authenticated: false` — server said not logged in
 */
export async function checkSession(): Promise<SessionResponse> {
  try {
    const { ok, data } = await apiRequest<SessionResponse>(endpoints.session, {
      method: "GET",
      csrf: false,
      json: false,
      timeoutMs: 4000,
    });

    if (!ok || !data?.authenticated) {
      return { authenticated: false };
    }

    return {
      authenticated: true,
      message: data.message,
      username: data.username,
      displayName: data.displayName,
    };
  } catch {
    return { authenticated: false, unreachable: true };
  }
}

/** Retry a few times on unreachable; used by route guards and reconnect. */
export async function checkSessionWithRetry({
  attempts = 3,
  delayMs = 400,
}: {
  attempts?: number;
  delayMs?: number;
} = {}): Promise<SessionResponse> {
  let last: SessionResponse = { authenticated: false, unreachable: true };
  for (let i = 0; i < attempts; i += 1) {
    last = await checkSession();
    if (!last.unreachable) return last;
    if (i < attempts - 1) await sleep(delayMs * (i + 1));
  }
  return last;
}

export async function login(username: string, password: string) {
  let ok: boolean;
  let status: number;
  let data: LoginResponse | string | null;

  try {
    const result = await apiRequest<LoginResponse>(endpoints.login, {
      method: "POST",
      csrf: false,
      body: { username, password },
      timeoutMs: 15000,
    });
    ok = result.ok;
    status = result.status;
    data = result.data;
  } catch (err) {
    return {
      ok: false as const,
      status: 0,
      error: networkErrorMessage(err),
    };
  }

  if (!ok) {
    return {
      ok: false as const,
      status,
      error: extractApiError(data, status, "AUTH_LOGIN_FAILED"),
    };
  }

  const payload = data && typeof data === "object" ? data : {};
  const displayName = payload.displayName || username;
  setAuthSession({
    username,
    displayName,
    csrfToken: payload.csrfToken || "",
  });
  notifyAuthChanged();

  // Cookie is HttpOnly + SameSite. Cross-site browsers often accept login JSON
  // but never store/send the cookie — next /session is 401. Surface that here.
  const session = await checkSessionWithRetry({ attempts: 3, delayMs: 300 });
  if (session.unreachable) {
    clearAuthenticationStorage();
    notifyAuthChanged();
    return {
      ok: false as const,
      status: 0,
      error: "AUTH_UNREACHABLE",
    };
  }
  if (!session.authenticated) {
    clearAuthenticationStorage();
    notifyAuthChanged();
    return {
      ok: false as const,
      status: 401,
      error: "AUTH_COOKIE_BLOCKED",
    };
  }

  return {
    ok: true as const,
    status,
    data: { ...payload, displayName, username },
  };
}

/**
 * Best-effort server logout; always clears local auth afterward.
 */
export async function logout(): Promise<void> {
  try {
    await apiRequest(endpoints.logout, { method: "DELETE" });
  } catch (err) {
    console.error("Logout error:", err);
  } finally {
    clearAuthenticationStorage();
    notifyAuthChanged();
  }
}
