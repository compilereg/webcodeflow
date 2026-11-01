import { describe, expect, it } from "vitest";
import {
  getContestPhase,
  isContestRunning,
  shouldFetchContestCatalog,
} from "../contestStatus";

describe("getContestPhase", () => {
  it("returns unknown before the first clock update", () => {
    expect(
      getContestPhase({ isRunning: true, timeLeft: 100, hasInitialData: false })
    ).toBe("unknown");
  });

  it("returns finished when time is up", () => {
    expect(
      getContestPhase({ isRunning: true, timeLeft: 0, hasInitialData: true })
    ).toBe("finished");
    expect(getContestPhase({ isRunning: false, timeLeft: 0 })).toBe("finished");
  });

  it("returns paused when the clock is stopped with time left", () => {
    expect(
      getContestPhase({ isRunning: false, timeLeft: 60, hasInitialData: true })
    ).toBe("paused");
  });

  it("returns running when the clock is active with time left", () => {
    expect(
      getContestPhase({ isRunning: true, timeLeft: 60, hasInitialData: true })
    ).toBe("running");
  });
});

describe("isContestRunning / shouldFetchContestCatalog", () => {
  it("is true only while running with time left", () => {
    expect(isContestRunning({ isRunning: true, timeLeft: 10 })).toBe(true);
    expect(isContestRunning({ isRunning: false, timeLeft: 10 })).toBe(false);
    expect(isContestRunning({ isRunning: true, timeLeft: 0 })).toBe(false);
  });

  it("gates catalog fetches the same way", () => {
    expect(
      shouldFetchContestCatalog({
        isRunning: true,
        timeLeft: 10,
        hasInitialData: true,
      })
    ).toBe(true);
    expect(
      shouldFetchContestCatalog({
        isRunning: false,
        timeLeft: 10,
        hasInitialData: true,
      })
    ).toBe(false);
    expect(
      shouldFetchContestCatalog({
        isRunning: true,
        timeLeft: 10,
        hasInitialData: false,
      })
    ).toBe(false);
  });
});
