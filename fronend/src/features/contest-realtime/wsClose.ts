export type WsCloseKind = "admin-logout" | "rate-limit" | "auth" | "retry";

export type WsCloseHints = {
  /** Successful onopen → onclose in under 2s is almost always a server reject. */
  diedImmediately?: boolean;
  reconnectAttempts?: number;
};

/** After this many reconnects, ambiguous proxy closes may escalate to rate-limit. */
export const WS_AMBIGUOUS_CLOSE_RETRY_LIMIT = 5;

/**
 * Map ContestSocket close codes/reasons to frontend behavior.
 *
 * Prefer reconnect (`retry`) for ambiguous closes (empty reason / 1006) so a
 * flaky lab proxy does not false-logout teams. Escalate only after repeated
 * immediate failures, or when the reason clearly says rate-limit / auth.
 */
export function classifyWsClose(
  code: number,
  reason = "",
  hints: WsCloseHints = {}
): WsCloseKind {
  const r = reason.toLowerCase();
  const attempts = hints.reconnectAttempts ?? 0;
  const exhaustedAmbiguous =
    attempts >= WS_AMBIGUOUS_CLOSE_RETRY_LIMIT && Boolean(hints.diedImmediately);

  if (
    code === 4001 ||
    r.includes("forced logout") ||
    r.includes("pc2 admin")
  ) {
    return "admin-logout";
  }

  if (r.includes("too many")) {
    return "rate-limit";
  }

  if (r.includes("unauthorized") || r.includes("invalid token")) {
    return "auth";
  }

  // 1008 with an explicit non-auth reason still looks like a policy close.
  if (code === 1008 && r.trim() && !exhaustedAmbiguous) {
    // Unknown policy text — retry a few times, then stop looping.
    if (attempts >= WS_AMBIGUOUS_CLOSE_RETRY_LIMIT) {
      return "rate-limit";
    }
    return "retry";
  }

  // Bare 1008 (proxy stripped reason) or abnormal 1006: retry first.
  if (code === 1008 || code === 1006) {
    if (exhaustedAmbiguous) {
      return "rate-limit";
    }
    return "retry";
  }

  return "retry";
}
