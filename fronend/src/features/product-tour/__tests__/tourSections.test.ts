import { TOUR_STEPS } from "../tourConfig";
import {
  getTourSection,
  sectionsCoverAllSteps,
  TOUR_SECTIONS,
} from "../tourSections";
import { getTourReplay, startTourReplay, clearTourReplay } from "../tourReplay";

describe("TOUR_SECTIONS", () => {
  it("covers every first-login step exactly once", () => {
    expect(TOUR_STEPS).toHaveLength(19);
    expect(sectionsCoverAllSteps()).toBe(true);
  });

  it("maps clarifications to steps 8–12 (indexes 7–11)", () => {
    const section = getTourSection("clarifications");
    expect(section).toMatchObject({ startIndex: 7, endIndex: 11 });
    expect(TOUR_STEPS[7].id).toBe("nav-clarifications");
    expect(TOUR_STEPS[9].id).toBe("clarifications-announcements");
    expect(TOUR_STEPS[10].id).toBe("clarifications-general");
    expect(TOUR_STEPS[11].id).toBe("clarifications-problems");
  });

  it("maps scoreboard to steps 15–19 (indexes 14–18)", () => {
    const section = getTourSection("scoreboard");
    expect(section).toMatchObject({ startIndex: 14, endIndex: 18 });
    expect(TOUR_STEPS[16].id).toBe("scoreboard-colors");
  });
});

describe("startTourReplay", () => {
  afterEach(() => {
    clearTourReplay();
  });

  it("starts clarifications on step 8 and ends after step 12", () => {
    expect(startTourReplay("clarifications")).toBe(true);
    expect(getTourReplay()).toEqual({ startIndex: 7, endIndex: 11 });
  });

  it("rejects unknown sections", () => {
    expect(startTourReplay("missing")).toBe(false);
    expect(getTourReplay()).toBeNull();
  });

  it("defines five tiles", () => {
    expect(TOUR_SECTIONS.map((s) => s.id)).toEqual([
      "general",
      "submission",
      "clarifications",
      "judgments",
      "scoreboard",
    ]);
  });
});
