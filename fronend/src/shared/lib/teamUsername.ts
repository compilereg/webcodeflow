/**
 * Team login account validation (PC²-style `team` + digits).
 * Pure helpers for login UI and any other callers.
 */

/** Matches `team8`, `team1008`, `TEAM2008`, etc. — not bare numbers or other prefixes. */
const TEAM_USERNAME_PATTERN = /^team[0-9]+$/i;

export function isValidTeamUsername(username: string): boolean {
  return TEAM_USERNAME_PATTERN.test(username.trim());
}

/**
 * Returns an error message when invalid, or `null` when valid.
 * Empty input is reported separately so callers can keep “required” copy.
 */
export function validateTeamUsername(username: string): string | null {
  const trimmed = username.trim();
  if (!trimmed) return "Username is required";
  if (!isValidTeamUsername(trimmed)) {
    return "Username must be team followed by a number (e.g. team8, team1008)";
  }
  return null;
}
