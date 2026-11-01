/** Shown when a PC² display name / scoreboard row has no institution. */
export const UNKNOWN_UNIVERSITY = "N/A";

export type TeamDisplayName = {
  /** Team name without the parenthesised institution. */
  teamName: string;
  /** Institution from parentheses, or N/A when missing. */
  university: string;
};

/** PC² display names look like "S7S Makrem (AASTMT-Alameen)". */
const INSTITUTION_PATTERN = /^(.*?)\s*\(([^()]*)\)\s*$/;

export function parseTeamDisplayName(raw?: string | null): TeamDisplayName {
  const trimmed = (raw || "").trim();
  const match = INSTITUTION_PATTERN.exec(trimmed);

  if (!match) {
    return { teamName: trimmed, university: UNKNOWN_UNIVERSITY };
  }

  const teamName = match[1].trim();
  const university = match[2].trim();

  return {
    teamName: teamName || trimmed,
    university: university || UNKNOWN_UNIVERSITY,
  };
}

/** Team name with the institution stripped. */
export function teamNameOnly(raw?: string | null): string {
  return parseTeamDisplayName(raw).teamName;
}

/**
 * University for a scoreboard row: prefer PC² `teamGroupName`, else parse
 * the display name parentheses, else N/A.
 */
export function universityForTeam(row: {
  teamName?: string | null;
  teamGroupName?: string | null;
}): string {
  const fromGroup = (row.teamGroupName || "").trim();
  if (fromGroup) return fromGroup;
  return parseTeamDisplayName(row.teamName).university;
}
