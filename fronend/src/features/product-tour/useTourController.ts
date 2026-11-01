import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getTeamName, isLoggedInLocally } from "shared/auth/authStorage";
import { TOUR_STEPS } from "./tourConfig";
import {
  readTourState,
  markInProgress,
  markSkipped,
  markFinished,
} from "./tourStorage";
import {
  clearTourReplay,
  getTourReplay,
  subscribeTourReplay,
  type TourReplayRange,
} from "./tourReplay";
import { resolveStepTarget, scrollStepTargetIntoView } from "./targetResolver";
import type { TargetRect } from "./types";

const AUTHED_ROUTES = [
  "/home",
  "/clarifications",
  "/judgments",
  "/scoreboard",
  "/tutorials",
];
const TARGET_POLL_INTERVAL_MS = 300;

function activeRange(): TourReplayRange | null {
  return getTourReplay();
}

/**
 * Drives the first-login tour and optional section replays.
 * Replay range is read from tourReplay module state so Next/Skip
 * cannot fall back to the full first-login tour.
 */
export function useTourController() {
  const location = useLocation();
  const navigate = useNavigate();
  const locationRef = useRef(location.pathname);
  locationRef.current = location.pathname;

  const [isLoggedIn, setIsLoggedIn] = useState(isLoggedInLocally());
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [replayRange, setReplayRange] = useState<TourReplayRange | null>(
    getTourReplay
  );
  const [rect, setRect] = useState<TargetRect | null>(null);
  const pendingNavRef = useRef<string | null>(null);
  const replayRangeRef = useRef(replayRange);
  replayRangeRef.current = replayRange ?? getTourReplay();

  useEffect(() => {
    const onAuthChanged = () => setIsLoggedIn(isLoggedInLocally());
    window.addEventListener("authChanged", onAuthChanged);
    return () => window.removeEventListener("authChanged", onAuthChanged);
  }, []);

  useEffect(() => {
    return subscribeTourReplay(() => {
      const replay = getTourReplay();
      replayRangeRef.current = replay;
      setReplayRange(replay);
      if (!replay) {
        setStepIndex(null);
        return;
      }
      const step = TOUR_STEPS[replay.startIndex];
      if (!step) return;
      const path = locationRef.current;
      if (step.route !== "*" && step.route !== path) {
        pendingNavRef.current = step.route;
        navigate(step.route);
      }
      setStepIndex(replay.startIndex);
    });
  }, [navigate]);

  // First-login auto-start only when auth becomes true — not when a replay ends.
  useEffect(() => {
    if (!isLoggedIn) {
      setStepIndex(null);
      replayRangeRef.current = null;
      if (getTourReplay()) clearTourReplay();
      return;
    }
    if (getTourReplay()) return;
    if (locationRef.current === "/tutorials") return;
    // Tour state is keyed by team name. Do not start (and fail to
    // persist) before identity has been hydrated into this tab.
    if (!getTeamName()) return;
    const state = readTourState();
    if (state.status === "not_started") {
      setStepIndex(0);
      markInProgress(0);
    } else if (state.status === "in_progress") {
      setStepIndex(Math.min(state.stepIndex, TOUR_STEPS.length - 1));
    }
  }, [isLoggedIn]);

  const currentStep = stepIndex === null ? null : TOUR_STEPS[stepIndex];

  const goToStep = useCallback(
    (index: number, persist: boolean) => {
      const step = TOUR_STEPS[index];
      if (!step) return;
      if (step.route !== "*" && step.route !== locationRef.current) {
        pendingNavRef.current = step.route;
        navigate(step.route);
      }
      setStepIndex(index);
      if (persist) markInProgress(index);
    },
    [navigate]
  );

  const next = useCallback(() => {
    if (stepIndex === null) return;
    const range = activeRange();
    const last = range ? range.endIndex : TOUR_STEPS.length - 1;
    if (stepIndex >= last) {
      if (range) {
        clearTourReplay();
        return;
      }
      markFinished(stepIndex);
      setStepIndex(null);
      return;
    }
    goToStep(stepIndex + 1, !range);
  }, [stepIndex, goToStep]);

  const back = useCallback(() => {
    if (stepIndex === null) return;
    const range = activeRange();
    const first = range ? range.startIndex : 0;
    if (stepIndex <= first) return;
    goToStep(stepIndex - 1, !range);
  }, [stepIndex, goToStep]);

  const skip = useCallback(() => {
    if (stepIndex === null) return;
    if (activeRange()) {
      clearTourReplay();
      return;
    }
    markSkipped(stepIndex);
    setStepIndex(null);
  }, [stepIndex]);

  useEffect(() => {
    if (currentStep === null) return;
    if (activeRange()) return;

    if (pendingNavRef.current) {
      pendingNavRef.current = null;
      return;
    }
    if (currentStep.route === "*") return;
    if (currentStep.route === location.pathname) return;
    if (!AUTHED_ROUTES.includes(location.pathname)) return;
    if (location.pathname === "/tutorials") return;

    const firstMatchForRoute = TOUR_STEPS.findIndex(
      (s) => s.route === location.pathname
    );
    if (firstMatchForRoute !== -1 && firstMatchForRoute !== stepIndex) {
      setStepIndex(firstMatchForRoute);
      markInProgress(firstMatchForRoute);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Keep spotlight synced; do not auto-advance if the target is missing —
  // the team must press Next / Skip themselves.
  useEffect(() => {
    if (currentStep === null) return;

    let frame = 0;

    scrollStepTargetIntoView(currentStep);
    const scrollRetryId = window.setTimeout(() => {
      scrollStepTargetIntoView(currentStep);
    }, 120);

    const recompute = () => {
      frame = requestAnimationFrame(() => {
        setRect(resolveStepTarget(currentStep));
      });
    };

    recompute();
    const intervalId = setInterval(recompute, TARGET_POLL_INTERVAL_MS);

    const resizeObserver = new ResizeObserver(recompute);
    resizeObserver.observe(document.body);

    const mutationObserver = new MutationObserver(recompute);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    window.addEventListener("resize", recompute);
    window.addEventListener("scroll", recompute, true);

    return () => {
      cancelAnimationFrame(frame);
      clearInterval(intervalId);
      clearTimeout(scrollRetryId);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute, true);
    };
  }, [currentStep]);

  const range = replayRange ?? getTourReplay();
  const rangeStart = range?.startIndex ?? 0;
  const rangeEnd = range?.endIndex ?? TOUR_STEPS.length - 1;

  return useMemo(
    () => ({
      isActive: stepIndex !== null,
      step: currentStep,
      stepNumber: stepIndex === null ? 0 : stepIndex - rangeStart + 1,
      totalSteps: rangeEnd - rangeStart + 1,
      rect,
      next,
      back,
      skip,
      canGoBack: stepIndex !== null && stepIndex > rangeStart,
      isLastStep: stepIndex !== null && stepIndex === rangeEnd,
    }),
    [
      stepIndex,
      currentStep,
      rangeStart,
      rangeEnd,
      rect,
      next,
      back,
      skip,
    ]
  );
}
