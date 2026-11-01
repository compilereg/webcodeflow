import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContestRealtimeStub } from "features/contest-realtime";
import { QuickSubmitForm } from "../QuickSubmitForm";

const submitRun = vi.fn();
const collectKnownRunNumbers = vi.fn(async () => new Set<number>());
const resolveSubmissionIdAfterSubmit = vi.fn(async () => 99);

vi.mock("shared/api/runsApi", () => ({
  submitRun: (...args: unknown[]) => submitRun(...(args as [])),
  collectKnownRunNumbers: (...args: unknown[]) =>
    collectKnownRunNumbers(...(args as [])),
  resolveSubmissionIdAfterSubmit: (...args: unknown[]) =>
    resolveSubmissionIdAfterSubmit(...(args as [])),
}));

vi.mock("shared/lib/fileToBase64", () => ({
  fileToBase64: vi.fn(async () => "YmFzZTY0"),
  formatFileSize: () => "1 KB",
}));

vi.mock("../useContestCatalog", () => ({
  useContestCatalog: () => ({
    problems: [{ name: "Two Sum", shortName: "A" }],
    languages: [{ languageName: "Python" }],
    loadError: null,
  }),
}));

const wsValue = {
  socket: null,
  scoreboard: [],
  timeLeft: 3600,
  isRunning: true,
  ready: true,
  hasInitialData: true,
  elapsedSeconds: 0,
  contestLengthSeconds: 10800,
  notifications: [],
  hasUnread: false,
  setHasUnread: vi.fn(),
  setNotifications: vi.fn(),
};

function renderForm() {
  return render(
    <MemoryRouter>
      <ContestRealtimeStub value={wsValue}>
        <Routes>
          <Route path="*" element={<QuickSubmitForm />} />
        </Routes>
      </ContestRealtimeStub>
    </MemoryRouter>
  );
}

describe("QuickSubmitForm double-submit guard", () => {
  beforeEach(() => {
    submitRun.mockReset();
    collectKnownRunNumbers.mockClear();
    resolveSubmissionIdAfterSubmit.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends only one submitRun when the button is clicked twice quickly", async () => {
    let finishSubmit: (value: { status: number; data: { runNumber: number; message: string } }) => void =
      () => {};
    submitRun.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishSubmit = resolve;
        })
    );

    renderForm();

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "Two Sum" } });
    fireEvent.change(selects[1], { target: { value: "Python" } });

    const fileInput = document.querySelector(
      'input[type="file"]:not([multiple])'
    ) as HTMLInputElement;
    const file = new File(["print(1)"], "main.py", { type: "text/x-python" });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    const button = screen.getByRole("button", { name: /Submit Solution/i });
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(submitRun).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("button", { name: /Submitting/i })).toBeDisabled();

    // Still only one request after the in-flight call settles.
    await act(async () => {
      finishSubmit({
        status: 200,
        data: { runNumber: 42, message: "ok" },
      });
    });
    expect(submitRun).toHaveBeenCalledTimes(1);
  });
});
