import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTourController } from "../useTourController";
import { writeTourState } from "../tourStorage";
import { clearTourReplay } from "../tourReplay";

const resolveStepTarget = vi.fn();
const scrollStepTargetIntoView = vi.fn();

vi.mock("../targetResolver", () => ({
  resolveStepTarget: (...args: unknown[]) => resolveStepTarget(...args),
  scrollStepTargetIntoView: (...args: unknown[]) =>
    scrollStepTargetIntoView(...args),
}));

function Probe() {
  const tour = useTourController();
  return (
    <div>
      <span data-testid="step">{tour.step?.id ?? "none"}</span>
      <span data-testid="number">{tour.stepNumber}</span>
    </div>
  );
}

describe("tour missing targets (no auto-skip)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("teamName", "Team Test");
    writeTourState({ status: "not_started", stepIndex: 0 });
    resolveStepTarget.mockReturnValue(null);
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  });

  afterEach(() => {
    clearTourReplay();
    sessionStorage.clear();
    localStorage.clear();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("stays on the current step when the target never appears", async () => {
    render(
      <MemoryRouter initialEntries={["/home"]}>
        <Routes>
          <Route path="*" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("step")).toHaveTextContent("nav-home");
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });

    expect(screen.getByTestId("step")).toHaveTextContent("nav-home");
  });
});
