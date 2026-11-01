import { TOUR_STEPS } from "./tourConfig";

export type TourSectionId =
  | "general"
  | "submission"
  | "clarifications"
  | "judgments"
  | "scoreboard";

export type TourSection = {
  id: TourSectionId;
  title: string;
  description: string;
  /** Inclusive index into TOUR_STEPS. */
  startIndex: number;
  /** Inclusive index into TOUR_STEPS. */
  endIndex: number;
};

export const TOUR_SECTIONS: TourSection[] = [
  {
    id: "general",
    title: "General",
    description: "Navbar, notifications, logout, team name, and the contest clock.",
    startIndex: 0,
    endIndex: 4,
  },
  {
    id: "submission",
    title: "Submission",
    description: "Choose a problem and language, then upload and submit a solution.",
    startIndex: 5,
    endIndex: 6,
  },
  {
    id: "clarifications",
    title: "Clarifications",
    description:
      "Ask the judges, then learn announcements, general questions, and problem questions.",
    startIndex: 7,
    endIndex: 11,
  },
  {
    id: "judgments",
    title: "Judgments",
    description: "Find the judgments page and read your submission results.",
    startIndex: 12,
    endIndex: 13,
  },
  {
    id: "scoreboard",
    title: "Scoreboard",
    description:
      "Open standings, read your summary, learn cell colors, browse the board, and switch pages.",
    startIndex: 14,
    endIndex: 18,
  },
];

export function getTourSection(id: string): TourSection | undefined {
  return TOUR_SECTIONS.find((section) => section.id === id);
}

export function sectionStepCount(section: TourSection): number {
  return section.endIndex - section.startIndex + 1;
}

/** True when every TOUR_STEPS index belongs to exactly one section. */
export function sectionsCoverAllSteps(): boolean {
  const covered = new Set<number>();
  for (const section of TOUR_SECTIONS) {
    if (section.startIndex < 0 || section.endIndex >= TOUR_STEPS.length) {
      return false;
    }
    if (section.startIndex > section.endIndex) return false;
    for (let i = section.startIndex; i <= section.endIndex; i += 1) {
      if (covered.has(i)) return false;
      covered.add(i);
    }
  }
  return covered.size === TOUR_STEPS.length;
}
