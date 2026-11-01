import {
  markFinished,
  markSkipped,
  readTourState,
  writeTourState,
} from "../tourStorage";

describe("tourStorage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("does not persist when this tab has no team name", () => {
    markFinished(14);
    expect(readTourState()).toMatchObject({
      status: "not_started",
      stepIndex: 0,
    });
    expect(
      localStorage.getItem("acpc:product-tour:v1:")
    ).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it("remembers finished/skipped per team across a new tab", () => {
    sessionStorage.setItem("teamName", "Team One");
    sessionStorage.setItem("displayName", "Team One");
    markFinished(14);

    const key = "acpc:product-tour:v1:Team One";
    expect(JSON.parse(localStorage.getItem(key) || "{}").status).toBe(
      "finished"
    );

    sessionStorage.clear();
    sessionStorage.setItem("teamName", "Team One");
    sessionStorage.setItem("displayName", "Team One");
    expect(readTourState().status).toBe("finished");
  });

  it("does not share completion across teams", () => {
    sessionStorage.setItem("displayName", "Team A");
    markSkipped(3);

    sessionStorage.setItem("displayName", "Team B");
    expect(readTourState().status).toBe("not_started");

    writeTourState({ status: "finished", stepIndex: 14 });
    sessionStorage.setItem("displayName", "Team A");
    expect(readTourState().status).toBe("skipped");
  });
});
