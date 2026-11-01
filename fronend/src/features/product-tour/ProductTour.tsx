import { useTourController } from "./useTourController";
import TourOverlay from "./TourOverlay";
import TourTooltip from "./TourTooltip";
import "./productTour.css";

/**
 * Mount once, as a sibling of <Routes>, inside <WebSocketProvider>.
 * Renders nothing until a step is active. Missing targets still show a
 * centered tip (no auto-skip).
 */
export function ProductTour() {
  const {
    isActive,
    step,
    rect,
    stepNumber,
    totalSteps,
    canGoBack,
    isLastStep,
    next,
    back,
    skip,
  } = useTourController();

  if (!isActive) return null;

  return (
    <>
      <TourOverlay rect={rect} />
      <TourTooltip
        step={step}
        rect={rect}
        stepNumber={stepNumber}
        totalSteps={totalSteps}
        canGoBack={canGoBack}
        isLastStep={isLastStep}
        onNext={next}
        onBack={back}
        onSkip={skip}
      />
    </>
  );
}
