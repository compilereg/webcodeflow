import { describe, expect, it } from "vitest";
import {
  STANDINGS_SERVICE_UNAVAILABLE,
  isStandingsServiceStatus,
  standingsServiceMessage,
} from "../standingsErrors";

describe("standingsServiceMessage", () => {
  it("treats 401 and 503 as scoreboard-service issues", () => {
    expect(isStandingsServiceStatus(401)).toBe(true);
    expect(isStandingsServiceStatus(503)).toBe(true);
    expect(isStandingsServiceStatus(500)).toBe(false);
    expect(standingsServiceMessage(503)).toBe(STANDINGS_SERVICE_UNAVAILABLE);
    expect(standingsServiceMessage(401)).toBe(STANDINGS_SERVICE_UNAVAILABLE);
  });

  it("keeps PC2 detail when present", () => {
    expect(
      standingsServiceMessage(503, { message: "PC2 contest data unavailable" })
    ).toContain("PC2 contest data unavailable");
  });
});
