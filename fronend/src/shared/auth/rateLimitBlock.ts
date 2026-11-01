/**
 * Backend windows (keep in sync with wwfapi):
 * - ContestSocket.WINDOW_MS = 60_000 (5 WS connects / 30 messages per IP)
 * - maincontroller.LOCK_TIME = 5 * 60 * 1000 (5 failed logins)
 */
export const WS_RATE_LIMIT_MS = 60_000;
export const LOGIN_LOCKOUT_MS = 5 * 60 * 1000;

export type RateLimitKind = "ws" | "login";

export type RateLimitBlock = {
  kind: RateLimitKind;
  until: number;
};

const KEY = "wcf:rateLimitBlock";

export function setRateLimitBlock(kind: RateLimitKind): RateLimitBlock {
  const existing = getRateLimitBlock();
  if (existing && existing.kind === kind && existing.until > Date.now()) {
    return existing;
  }

  const ms = kind === "ws" ? WS_RATE_LIMIT_MS : LOGIN_LOCKOUT_MS;
  const block: RateLimitBlock = { kind, until: Date.now() + ms };
  sessionStorage.setItem(KEY, JSON.stringify(block));
  return block;
}

export function getRateLimitBlock(): RateLimitBlock | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as RateLimitBlock;
    if (
      !parsed ||
      (parsed.kind !== "ws" && parsed.kind !== "login") ||
      typeof parsed.until !== "number"
    ) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    if (parsed.until <= Date.now()) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(KEY);
    return null;
  }
}

export function clearRateLimitBlock(): void {
  sessionStorage.removeItem(KEY);
}

export function remainingRateLimitMs(block = getRateLimitBlock()): number {
  if (!block) return 0;
  return Math.max(0, block.until - Date.now());
}

export function formatRateLimitRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
