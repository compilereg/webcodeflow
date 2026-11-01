const PENDING_AUTH_ERROR_KEY = "wcf:pendingAuthError";

export function setPendingAuthError(code: string): void {
  sessionStorage.setItem(PENDING_AUTH_ERROR_KEY, code);
}

export function consumePendingAuthError(): string | null {
  const code = sessionStorage.getItem(PENDING_AUTH_ERROR_KEY);
  if (code) sessionStorage.removeItem(PENDING_AUTH_ERROR_KEY);
  return code;
}
