/**
 * User-facing copy when PC² scoreboard / getrank fails while the team
 * session may still be valid (scoreboard2 account down, etc.).
 */
export const STANDINGS_SERVICE_UNAVAILABLE =
  "Standings temporarily unavailable (scoreboard service). Your team login is still valid.";

export function isStandingsServiceStatus(status: number): boolean {
  return status === 503 || status === 401;
}

export function standingsServiceMessage(
  status: number,
  body?: unknown
): string {
  if (isStandingsServiceStatus(status)) {
    const fromBody =
      body &&
      typeof body === "object" &&
      typeof (body as { message?: unknown }).message === "string"
        ? (body as { message: string }).message.trim()
        : "";
    // Keep backend detail when it already points at PC² / scoreboard.
    if (
      fromBody &&
      /pc2|scoreboard|contest data|unavailable/i.test(fromBody)
    ) {
      return `${STANDINGS_SERVICE_UNAVAILABLE} (${fromBody})`;
    }
    return STANDINGS_SERVICE_UNAVAILABLE;
  }
  if (status === 428) {
    return "Standings are not available until the contest is running.";
  }
  return "Unable to load scoreboard";
}
