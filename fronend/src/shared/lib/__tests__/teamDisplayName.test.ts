import { describe, expect, it } from "vitest";
import {
  parseTeamDisplayName,
  teamNameOnly,
  universityForTeam,
  UNKNOWN_UNIVERSITY,
} from "../teamDisplayName";

describe("parseTeamDisplayName", () => {
  it("splits name and institution from parentheses", () => {
    expect(parseTeamDisplayName("S7S Makrem (AASTMT-Alameen)")).toEqual({
      teamName: "S7S Makrem",
      university: "AASTMT-Alameen",
    });
  });

  it("uses N/A when there are no parentheses", () => {
    expect(parseTeamDisplayName("Team One")).toEqual({
      teamName: "Team One",
      university: UNKNOWN_UNIVERSITY,
    });
  });

  it("uses N/A for empty parentheses", () => {
    expect(parseTeamDisplayName("Team One ()")).toEqual({
      teamName: "Team One",
      university: UNKNOWN_UNIVERSITY,
    });
  });

  it("handles empty input", () => {
    expect(parseTeamDisplayName(null).teamName).toBe("");
    expect(parseTeamDisplayName("   ").university).toBe(UNKNOWN_UNIVERSITY);
  });

  it("leaves names that start with parentheses alone", () => {
    expect(parseTeamDisplayName("(A) Team").teamName).toBe("(A) Team");
  });
});

describe("teamNameOnly", () => {
  it("strips the institution suffix", () => {
    expect(teamNameOnly("Alpha (Cairo University)")).toBe("Alpha");
  });
});

describe("universityForTeam", () => {
  it("prefers teamGroupName over the display-name parentheses", () => {
    expect(
      universityForTeam({
        teamName: "Unfortunately you are rejected (Fayoum)",
        teamGroupName: "Fayoum University",
      })
    ).toBe("Fayoum University");
  });

  it("falls back to parentheses then N/A", () => {
    expect(
      universityForTeam({ teamName: "Team X (GUC)", teamGroupName: "" })
    ).toBe("GUC");
    expect(universityForTeam({ teamName: "Solo" })).toBe(UNKNOWN_UNIVERSITY);
  });
});
