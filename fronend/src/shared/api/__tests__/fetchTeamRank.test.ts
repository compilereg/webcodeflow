import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchTeamRank } from "../scoreboardApi";
import { STANDINGS_SERVICE_UNAVAILABLE } from "../standingsErrors";

describe("fetchTeamRank", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns numeric rank from getrank", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({ teamName: "Team A", teamRank: 7 }),
    });

    await expect(fetchTeamRank()).resolves.toEqual({
      rank: 7,
      serviceIssue: null,
    });
  });

  it("returns null rank when contest is not running (428)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 428,
      text: async () => JSON.stringify({ message: "Contest is not running" }),
    });

    await expect(fetchTeamRank()).resolves.toEqual({
      rank: null,
      serviceIssue: null,
    });
  });

  it("flags 503 as scoreboard-service issue without treating it as team logout", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () =>
        JSON.stringify({
          message: "PC2 contest data unavailable",
        }),
    });

    const result = await fetchTeamRank();
    expect(result.rank).toBeNull();
    expect(result.serviceIssue).toContain(STANDINGS_SERVICE_UNAVAILABLE);
    expect(result.serviceIssue).toMatch(/PC2 contest data unavailable/i);
  });

  it("flags 401 on getrank as scoreboard-service issue (not team CSRF)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () =>
        JSON.stringify({
          error: "UNAUTHORIZED",
          message: "Unauthorized user request - not logged in",
        }),
    });

    const result = await fetchTeamRank();
    expect(result.rank).toBeNull();
    expect(result.serviceIssue).toBe(STANDINGS_SERVICE_UNAVAILABLE);
  });

  it("returns null for rank 0 / missing", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ teamName: "Team A", teamRank: 0 }),
    });

    await expect(fetchTeamRank()).resolves.toEqual({
      rank: null,
      serviceIssue: null,
    });
  });
});
