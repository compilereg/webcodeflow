import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../targetResolver", () => ({
  resolveStepTarget: () => ({
    top: 0,
    left: 0,
    right: 10,
    bottom: 10,
    width: 10,
    height: 10,
  }),
  scrollStepTargetIntoView: () => {},
}));

import { useTourController } from "../useTourController";
import { startTourReplay, clearTourReplay } from "../tourReplay";
import { writeTourState, readTourState } from "../tourStorage";

function Probe() {
  const tour = useTourController();
  return (
    <div>
      <span data-testid="step">{tour.step?.id ?? "none"}</span>
      <span data-testid="number">{tour.stepNumber}</span>
      <span data-testid="total">{tour.totalSteps}</span>
      <button type="button" onClick={tour.next}>
        Next
      </button>
    </div>
  );
}

describe("tour section replay", () => {
  beforeEach(() => {
    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("teamName", "Team Test");
    writeTourState({ status: "finished", stepIndex: 14 });
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
    vi.unstubAllGlobals();
  });

  it("replays clarifications from step 8 and stops after step 12", async () => {
    render(
      <MemoryRouter initialEntries={["/tutorials"]}>
        <Routes>
          <Route path="*" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    );

    act(() => {
      startTourReplay("clarifications");
    });

    await waitFor(() => {
      expect(screen.getByTestId("step")).toHaveTextContent(
        "nav-clarifications"
      );
    });
    expect(screen.getByTestId("number")).toHaveTextContent("1");
    expect(screen.getByTestId("total")).toHaveTextContent("5");

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByTestId("step")).toHaveTextContent("clarifications-ask");

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByTestId("step")).toHaveTextContent(
      "clarifications-announcements"
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByTestId("step")).toHaveTextContent(
      "clarifications-general"
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByTestId("step")).toHaveTextContent(
      "clarifications-problems"
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByTestId("step")).toHaveTextContent("none");
    expect(readTourState().status).toBe("finished");
  });

  it("keeps the original first-login tour at 19 steps on home", async () => {
    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("teamName", "Team Test");
    writeTourState({ status: "not_started", stepIndex: 0 });

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
    expect(screen.getByTestId("total")).toHaveTextContent("19");
    expect(screen.getByTestId("number")).toHaveTextContent("1");
  });

  it("does not auto-start the first-login tour after it was finished", async () => {
    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("displayName", "Team Test");
    writeTourState({ status: "finished", stepIndex: 14 });

    render(
      <MemoryRouter initialEntries={["/home"]}>
        <Routes>
          <Route path="*" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("step")).toHaveTextContent("none");
    });
    expect(readTourState().status).toBe("finished");
  });

  it("does not resume the 19-step first-login tour after a section replay", async () => {
    writeTourState({ status: "in_progress", stepIndex: 2 });
    render(
      <MemoryRouter initialEntries={["/tutorials"]}>
        <Routes>
          <Route path="*" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("step")).toHaveTextContent("none");

    act(() => {
      startTourReplay("judgments");
    });

    await waitFor(() => {
      expect(screen.getByTestId("step")).toHaveTextContent("nav-judgments");
    });
    expect(screen.getByTestId("total")).toHaveTextContent("2");
    expect(screen.getByTestId("number")).toHaveTextContent("1");

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByTestId("step")).toHaveTextContent("judgments-table");
    expect(screen.getByTestId("total")).toHaveTextContent("2");

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByTestId("step")).toHaveTextContent("none");
    expect(readTourState().status).toBe("in_progress");
    expect(readTourState().stepIndex).toBe(2);
  });
});
