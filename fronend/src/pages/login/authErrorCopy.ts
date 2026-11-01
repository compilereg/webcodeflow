export type AuthErrorCopy = {
  title: string;
  detail: string;
};

const COPY: Record<string, AuthErrorCopy> = {
  AUTH_ADMIN_LOGOFF: {
    title: "Session ended",
    detail: "Signed out by the administrator.",
  },
  AUTH_WS_RATE_LIMIT: {
    title: "Temporarily blocked",
    detail:
      "Too many connection attempts. You are blocked for 1 minute. Wait, then open a new window and log in again.",
  },
  AUTH_COOKIE_BLOCKED: {
    title: "Login failed",
    detail: "AUTH_COOKIE_BLOCKED",
  },
  AUTH_INVALID_CREDENTIALS: {
    title: "Login failed",
    detail: "AUTH_INVALID_CREDENTIALS",
  },
  AUTH_TEAM_ONLY: {
    title: "Login failed",
    detail: "AUTH_TEAM_ONLY",
  },
  AUTH_RATE_LIMIT: {
    title: "Temporarily blocked",
    detail:
      "Too many failed logins. You are blocked for 5 minutes. Wait, then open a new window and try again.",
  },
  AUTH_UNREACHABLE: {
    title: "Login failed",
    detail: "AUTH_UNREACHABLE",
  },
  AUTH_TIMEOUT: {
    title: "Login failed",
    detail: "AUTH_TIMEOUT",
  },
  AUTH_UNAVAILABLE: {
    title: "Login failed",
    detail: "AUTH_UNAVAILABLE",
  },
  AUTH_SERVER: {
    title: "Login failed",
    detail: "AUTH_SERVER",
  },
  AUTH_LOGIN_FAILED: {
    title: "Login failed",
    detail: "AUTH_LOGIN_FAILED",
  },
};

export function authErrorCopy(codeOrMessage: string): AuthErrorCopy {
  return (
    COPY[codeOrMessage] || {
      title: "Login failed",
      detail: codeOrMessage,
    }
  );
}
