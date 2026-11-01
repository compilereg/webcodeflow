import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { TargetRect, TourStep } from "./types";

const GAP = 14;
const MARGIN = 12;

type TooltipSize = { width: number; height: number };
type TooltipPos = { top: number; left: number };

function computePosition(
  rect: TargetRect | null,
  tooltipSize: TooltipSize
): TooltipPos | null {
  if (!tooltipSize.width || !tooltipSize.height) {
    return null;
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // No spotlight target yet — center the tip so Next/Skip stay available.
  if (!rect) {
    return {
      top: Math.max(MARGIN, (vh - tooltipSize.height) / 2),
      left: Math.max(MARGIN, (vw - tooltipSize.width) / 2),
    };
  }

  const spaceBelow = vh - rect.bottom;
  const spaceAbove = rect.top;
  const spaceRight = vw - rect.right;

  let placement: "bottom" | "top" | "right" = "bottom";

  if (spaceBelow < tooltipSize.height + GAP && spaceAbove > spaceBelow) {
    placement = "top";
  }

  if (
    placement === "top" &&
    spaceAbove < tooltipSize.height + GAP &&
    spaceRight > tooltipSize.width + GAP
  ) {
    placement = "right";
  }

  let top: number;
  let left: number;

  if (placement === "bottom") {
    top = rect.bottom + GAP;
    left = rect.left + rect.width / 2 - tooltipSize.width / 2;
  } else if (placement === "top") {
    top = rect.top - tooltipSize.height - GAP;
    left = rect.left + rect.width / 2 - tooltipSize.width / 2;
  } else {
    top = rect.top + rect.height / 2 - tooltipSize.height / 2;
    left = rect.right + GAP;
  }

  const maximumLeft = Math.max(MARGIN, vw - tooltipSize.width - MARGIN);
  const maximumTop = Math.max(MARGIN, vh - tooltipSize.height - MARGIN);

  left = Math.min(Math.max(left, MARGIN), maximumLeft);
  top = Math.min(Math.max(top, MARGIN), maximumTop);

  return { top, left };
}

type TourTooltipProps = {
  step: TourStep | null;
  rect: TargetRect | null;
  stepNumber: number;
  totalSteps: number;
  canGoBack: boolean;
  isLastStep: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
};

export default function TourTooltip({
  step,
  rect,
  stepNumber,
  totalSteps,
  canGoBack,
  isLastStep,
  onNext,
  onBack,
  onSkip,
}: TourTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState<TooltipSize>({ width: 0, height: 0 });
  const [pos, setPos] = useState<TooltipPos | null>(null);

  const isVisible = Boolean(step);

  useEffect(() => {
    if (!isVisible || !ref.current) {
      return undefined;
    }

    const element = ref.current;

    const measure = () => {
      const { width, height } = element.getBoundingClientRect();

      if (width <= 0 || height <= 0) {
        return;
      }

      setSize((currentSize) => {
        if (currentSize.width === width && currentSize.height === height) {
          return currentSize;
        }
        return { width, height };
      });
    };

    measure();

    let resizeObserver: ResizeObserver | undefined;

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(element);
    }

    return () => {
      resizeObserver?.disconnect();
    };
  }, [isVisible, step]);

  useEffect(() => {
    if (!isVisible) {
      setPos(null);
      return;
    }

    setPos(computePosition(rect, size));
  }, [isVisible, rect, size]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    ref.current?.focus();
  }, [isVisible, step]);

  if (!isVisible || !step) {
    return null;
  }

  const tooltipStyle: CSSProperties = pos
    ? {
        top: pos.top,
        left: pos.left,
        opacity: 1,
      }
    : {
        top: 100,
        left: "50%",
        transform: "translateX(-50%)",
        opacity: 1,
      };

  return (
    <div
      ref={ref}
      className="acpc-tour-tooltip"
      style={tooltipStyle}
      role="dialog"
      aria-labelledby="acpc-tour-title"
      aria-describedby="acpc-tour-body"
      tabIndex={-1}
    >
      <div className="acpc-tour-eyebrow">
        Step {stepNumber} of {totalSteps}
      </div>

      <h3 id="acpc-tour-title" className="acpc-tour-title">
        {step.title}
      </h3>

      <p id="acpc-tour-body" className="acpc-tour-body">
        {step.body}
        {!rect ? (
          <span className="mt-2 block text-foreground-muted">
            This control is not on screen right now — use Next when you are
            ready, or Skip to leave the tour.
          </span>
        ) : null}
      </p>

      <div className="acpc-tour-actions">
        <button type="button" className="acpc-tour-skip" onClick={onSkip}>
          Skip
        </button>

        <div className="acpc-tour-nav-buttons">
          {canGoBack && (
            <button type="button" className="acpc-tour-back" onClick={onBack}>
              Back
            </button>
          )}

          <button type="button" className="acpc-tour-next" onClick={onNext}>
            {isLastStep ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
