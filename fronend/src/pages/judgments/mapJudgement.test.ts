import {
  getJudgmentAcronym,
  isKnownJudgement,
  mapJudgement,
} from "pages/judgments/mapJudgement";

describe("mapJudgement", () => {
  it("maps accepted judgements", () => {
    expect(mapJudgement("yes")).toBe("Accepted");
    expect(mapJudgement("correct")).toBe("Accepted");
    expect(mapJudgement("Accepted")).toBe("Accepted");
    expect(mapJudgement("AC")).toBe("Accepted");
  });

  it("maps compilation and runtime errors", () => {
    expect(mapJudgement("compiler error")).toBe("Compilation Error");
    expect(mapJudgement("No - Compilation Error")).toBe("Compilation Error");
    expect(mapJudgement("run error")).toBe("Runtime Error");
    expect(mapJudgement("run-time error")).toBe("Runtime Error");
  });

  it("maps limit and output judgements", () => {
    expect(mapJudgement("timelimit")).toBe("Time Limit");
    expect(mapJudgement("time limit exceeded")).toBe("Time Limit");
    expect(mapJudgement("memory limit")).toBe("Memory Limit");
    expect(mapJudgement("no output")).toBe("No Output");
    expect(mapJudgement("output limit")).toBe("Output Limit");
  });

  it("maps wrong-answer variants to WA", () => {
    expect(mapJudgement("wrong answer")).toBe("Wrong Answer");
    expect(mapJudgement("Wrong Answer")).toBe("Wrong Answer");
    expect(mapJudgement("No - Wrong answer")).toBe("Wrong Answer");
    expect(mapJudgement("Incomplete output")).toBe("Wrong Answer");
    expect(mapJudgement("Undetermined")).toBe("Wrong Answer");
  });

  it("maps pending and empty judgements", () => {
    expect(mapJudgement("NEW")).toBe("In Queue");
    expect(mapJudgement(null)).toBe("In Queue");
    expect(mapJudgement("")).toBe("In Queue");
  });

  it("maps format/system and unrecognized judged verdicts as failed", () => {
    expect(mapJudgement("Format Error")).toBe("Format Error");
    expect(mapJudgement("Contact Staff")).toBe("System Error");
    expect(mapJudgement("memorylimit")).toBe("Memory Limit");
    expect(mapJudgement("No - Mysterious Failure")).toBe("System Error");
  });

  it("returns acronyms for canonical statuses", () => {
    expect(getJudgmentAcronym("Accepted")).toBe("AC");
    expect(getJudgmentAcronym("Wrong Answer")).toBe("WA");
    expect(getJudgmentAcronym("No Output")).toBe("NO");
    expect(getJudgmentAcronym("In Queue")).toBeNull();
  });

  it("recognizes known judgements from the contest table", () => {
    expect(isKnownJudgement("correct")).toBe(true);
    expect(isKnownJudgement("Undetermined")).toBe(true);
    expect(isKnownJudgement("NEW")).toBe(true);
    expect(isKnownJudgement("totally unknown")).toBe(false);
  });
});
