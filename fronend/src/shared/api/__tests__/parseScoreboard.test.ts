import { describe, expect, it } from "vitest";
import { parseScoreboardResponse } from "../parseScoreboard";

describe("parseScoreboardResponse", () => {
  it("maps contestStandings.teamStanding from the live API shape", () => {
    const rows = parseScoreboardResponse({
      contestStandings: {
        teamStanding: [
          {
            teamName: "Unfortunately you are rejected (Fayoum)",
            teamGroupName: "Fayoum University",
            rank: 1,
            overallRank: 1,
            solved: 10,
            points: 930,
            problemSummaryInfo: [
              {
                fts: false,
                isSolved: true,
                index: 1,
                solutionTime: 31,
                isPending: false,
                shortName: "a",
                attempts: 1,
                points: 31,
              },
              {
                fts: true,
                isSolved: true,
                index: 7,
                solutionTime: 157,
                isPending: false,
                shortName: "g",
                attempts: 2,
                points: 177,
              },
              {
                fts: false,
                isSolved: false,
                index: 4,
                solutionTime: -1,
                isPending: true,
                shortName: "d",
                attempts: 1,
                points: 0,
              },
            ],
          },
        ],
      },
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      teamName: "Unfortunately you are rejected (Fayoum)",
      teamGroupName: "Fayoum University",
      rank: 1,
      solved: 10,
      penalty: 930,
    });
    expect(rows[0].problems[0]).toMatchObject({
      shortName: "A",
      solved: true,
      firstSolve: false,
      pending: false,
      attempts: 1,
      solutionTime: 31,
    });
    expect(rows[0].problems[1]).toMatchObject({
      shortName: "G",
      firstSolve: true,
      solved: true,
    });
    expect(rows[0].problems[2]).toMatchObject({
      shortName: "D",
      solved: false,
      pending: true,
      solutionTime: undefined,
    });
  });

  it("accepts a single teamStanding object (org.json one-child quirk)", () => {
    const rows = parseScoreboardResponse({
      contestStandings: {
        teamStanding: {
          teamName: "Solo Team",
          rank: 3,
          solved: 1,
          points: 20,
          problemSummaryInfo: {
            fts: false,
            isSolved: true,
            index: 1,
            shortName: "a",
            attempts: 1,
            solutionTime: 5,
            isPending: false,
            points: 5,
          },
        },
      },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].rank).toBe(3);
    expect(rows[0].problems).toHaveLength(1);
  });

  it("still accepts a ScoreboardRowDTO array", () => {
    const rows = parseScoreboardResponse([
      {
        teamName: "BMA (Al-Azhar)",
        rank: 277,
        solved: 2,
        penalty: 100,
        problems: [
          {
            problemId: 1,
            shortName: "A",
            solved: true,
            firstSolve: false,
            pending: false,
            attempts: 1,
            solutionTime: 10,
            penalty: 10,
          },
        ],
      },
    ]);
    expect(rows[0].teamName).toBe("BMA (Al-Azhar)");
    expect(rows[0].problems[0].shortName).toBe("A");
  });

  it("unwraps a stringified JSON body", () => {
    const rows = parseScoreboardResponse(
      JSON.stringify({
        contestStandings: {
          teamStanding: [
            { teamName: "T", rank: 2, solved: 0, points: 0, problemSummaryInfo: [] },
          ],
        },
      })
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].rank).toBe(2);
  });
});
