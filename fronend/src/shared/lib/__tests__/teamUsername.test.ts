import { describe, expect, it } from "vitest";
import { isValidTeamUsername, validateTeamUsername } from "../teamUsername";

describe("isValidTeamUsername", () => {
  it("accepts team + digits", () => {
    expect(isValidTeamUsername("team8")).toBe(true);
    expect(isValidTeamUsername("team1008")).toBe(true);
    expect(isValidTeamUsername("team2008")).toBe(true);
    expect(isValidTeamUsername("team3008")).toBe(true);
    expect(isValidTeamUsername("team4008")).toBe(true);
    expect(isValidTeamUsername("  team1006  ")).toBe(true);
    expect(isValidTeamUsername("TEAM42")).toBe(true);
  });

  it("rejects other shapes", () => {
    expect(isValidTeamUsername("")).toBe(false);
    expect(isValidTeamUsername("team")).toBe(false);
    expect(isValidTeamUsername("team8a")).toBe(false);
    expect(isValidTeamUsername("8team")).toBe(false);
    expect(isValidTeamUsername("judge1")).toBe(false);
    expect(isValidTeamUsername("team-8")).toBe(false);
    expect(isValidTeamUsername("team_8")).toBe(false);
    expect(isValidTeamUsername("team 8")).toBe(false);
  });
});

describe("validateTeamUsername", () => {
  it("returns required for empty", () => {
    expect(validateTeamUsername("")).toBe("Username is required");
    expect(validateTeamUsername("   ")).toBe("Username is required");
  });

  it("returns format error or null", () => {
    expect(validateTeamUsername("admin")).toMatch(/team followed by a number/i);
    expect(validateTeamUsername("team1008")).toBeNull();
  });
});
