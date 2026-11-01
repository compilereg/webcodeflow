import { getTourSection } from "./tourSections";

export type TourReplayRange = {
  startIndex: number;
  endIndex: number;
};

const REPLAY_EVENT = "wcf:tour-replay";

let currentReplay: TourReplayRange | null = null;

export function getTourReplay(): TourReplayRange | null {
  return currentReplay;
}

export function startTourReplay(sectionId: string): boolean {
  const section = getTourSection(sectionId);
  if (!section) return false;
  currentReplay = {
    startIndex: section.startIndex,
    endIndex: section.endIndex,
  };
  window.dispatchEvent(new Event(REPLAY_EVENT));
  return true;
}

export function clearTourReplay(): void {
  if (currentReplay == null) return;
  currentReplay = null;
  window.dispatchEvent(new Event(REPLAY_EVENT));
}

export function subscribeTourReplay(listener: () => void): () => void {
  window.addEventListener(REPLAY_EVENT, listener);
  return () => window.removeEventListener(REPLAY_EVENT, listener);
}
