import { mapRuns } from "./useJudgments";

describe("mapRuns", () => {
  it("uses a sequential table ID and keeps PC2 runNumber as submission ID", () => {
    const rows = mapRuns(
      [
        {
          runNumber: 42,
          problem: "Problem A",
          language: "Java",
          submissionTime: 120,
        },
        {
          runNumber: 105,
          problem: "Problem B",
          language: "C++",
          submissionTime: 240,
        },
      ],
      new Map()
    );

    expect(rows.map(({ id, submissionId }) => ({ id, submissionId }))).toEqual([
      { id: 2, submissionId: 105 },
      { id: 1, submissionId: 42 },
    ]);
  });

  it("does not treat a generic DTO id as the PC2 submission ID", () => {
    const [row] = mapRuns(
      [{ id: 99, problem: "Problem A", submissionTime: 10 }],
      new Map()
    );

    expect(row.id).toBe(1);
    expect(row.submissionId).toBeNull();
  });
});
