import { describe, expect, it } from "vitest";
import {
  aggregateRunStats,
  contestProgressRatio,
  findMyTeamRow,
} from "pages/home/runStats";
import {
  mapJudgement,
  resolveSubmissionStatus,
} from "pages/judgments/mapJudgement";
import type { RunDto, ScoreboardRow } from "shared/api/types";

describe("resolveSubmissionStatus", () => {
  it("uses status when judgement is empty", () => {
    expect(
      resolveSubmissionStatus({ judgement: undefined, status: "Accepted" })
    ).toBe("Accepted");
  });

  it("does not treat empty judgement as blocking status fallback", () => {
    expect(
      resolveSubmissionStatus({
        judgement: "",
        status: "No - Wrong Answer",
      })
    ).toBe("Wrong Answer");
  });

  it("prefers solved flag", () => {
    expect(
      resolveSubmissionStatus({
        solved: true,
        judgement: "NEW",
      })
    ).toBe("Accepted");
  });

  it("does not keep a judged run as pending when the name is empty", () => {
    expect(
      resolveSubmissionStatus({
        judgement: "",
        finalJudged: true,
      })
    ).toBe("System Error");
  });
});

describe("aggregateRunStats", () => {
  it("counts solved, pending, and failed from runs", () => {
    const runs: RunDto[] = [
      { judgement: undefined },
      { judgement: "yes" },
      { judgement: "No - Wrong Answer" },
      { judgement: "No - Compilation Error" },
      { status: "In Queue" },
      { judgement: "Accepted" },
    ];
    expect(aggregateRunStats(runs)).toEqual({
      solved: 2,
      pending: 2,
      failed: 2,
    });
  });

  it("handles empty list", () => {
    expect(aggregateRunStats([])).toEqual({
      solved: 0,
      pending: 0,
      failed: 0,
    });
  });

  it("sums to total submission count", () => {
    const runs: RunDto[] = [
      { judgement: "NEW" },
      { judgement: "yes" },
      { judgement: "memory limit" },
      { judgement: "wrong answer" },
    ];
    const stats = aggregateRunStats(runs);
    expect(stats.solved + stats.pending + stats.failed).toBe(runs.length);
  });
});

describe("mapJudgement", () => {
  it("maps accepted variants", () => {
    expect(mapJudgement("Accepted")).toBe("Accepted");
    expect(mapJudgement("yes")).toBe("Accepted");
  });
});

describe("findMyTeamRow", () => {
  const rows: ScoreboardRow[] = [
    { teamName: "Alpha", rank: 1, solved: 3, penalty: 10, problems: [] },
    { teamName: "Team Test", rank: 4, solved: 5, penalty: 100, problems: [] },
  ];

  it("matches team name case-insensitively", () => {
    expect(findMyTeamRow(rows, "team test")?.rank).toBe(4);
  });

  it("matches display name with university suffix", () => {
    const withUni: ScoreboardRow[] = [
      {
        teamName: "BMA (Al-Azhar)",
        rank: 277,
        solved: 2,
        penalty: 100,
        problems: [],
      },
    ];
    expect(findMyTeamRow(withUni, "BMA (Al-Azhar)")?.solved).toBe(2);
    expect(findMyTeamRow(withUni, "BMA")?.rank).toBe(277);
  });

  it("returns null when missing", () => {
    expect(findMyTeamRow(rows, "Nobody")).toBeNull();
    expect(findMyTeamRow(rows, null)).toBeNull();
  });
});

describe("contestProgressRatio", () => {
  it("returns null when length unknown", () => {
    expect(contestProgressRatio(100, 0)).toBeNull();
  });

  it("clamps between 0 and 1", () => {
    expect(contestProgressRatio(5400, 10800)).toBe(0.5);
    expect(contestProgressRatio(20000, 10800)).toBe(1);
    expect(contestProgressRatio(-10, 10800)).toBe(0);
  });
});
