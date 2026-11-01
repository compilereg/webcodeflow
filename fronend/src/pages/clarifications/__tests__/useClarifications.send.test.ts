import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useClarifications } from "../useClarifications";

const listProblems = vi.fn(async () => [{ name: "Two Sum", shortName: "A" }]);
const listClarifications = vi.fn(async () => []);
const submitClarification = vi.fn();

vi.mock("shared/api/problemsApi", () => ({
  listProblems: (...args: unknown[]) => listProblems(...(args as [])),
}));

vi.mock("shared/api/clarificationsApi", () => ({
  listClarifications: (...args: unknown[]) =>
    listClarifications(...(args as [])),
  submitClarification: (...args: unknown[]) =>
    submitClarification(...(args as [])),
}));

describe("useClarifications send failures", () => {
  beforeEach(() => {
    sessionStorage.setItem("username", "team1");
    listProblems.mockClear();
    listClarifications.mockClear();
    submitClarification.mockReset();
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.useRealTimers();
  });

  it("returns a visible error when submitClarification fails (not silent)", async () => {
    submitClarification.mockResolvedValue({
      ok: false,
      status: 400,
      data: { message: "Category/Problem 'SOI' not found." },
    });

    const { result } = renderHook(() => useClarifications());

    await waitFor(() => {
      expect(listClarifications).toHaveBeenCalled();
    });

    let response: Awaited<ReturnType<typeof result.current.sendClarification>> =
      { ok: true };
    await act(async () => {
      response = await result.current.sendClarification({
        type: "generic",
        selectedQuestion: "",
        message: "What time does lunch start?",
      });
    });

    expect(response).toEqual({
      ok: false,
      error: "Category/Problem 'SOI' not found.",
    });
    expect(submitClarification).toHaveBeenCalledTimes(1);
  });

  it("explains paused contest on 403", async () => {
    submitClarification.mockResolvedValue({
      ok: false,
      status: 403,
      data: {},
    });

    const { result } = renderHook(() => useClarifications());
    await waitFor(() => expect(listClarifications).toHaveBeenCalled());

    let response: Awaited<ReturnType<typeof result.current.sendClarification>> =
      { ok: true };
    await act(async () => {
      response = await result.current.sendClarification({
        type: "question",
        selectedQuestion: "Two Sum",
        message: "Is N up to 1e5?",
      });
    });

    expect(response).toEqual({
      ok: false,
      error: expect.stringMatching(/paused or stopped/i),
    });
  });

  it("refetches on contest-clarifications-invalidate without needing a page WS listener", async () => {
    const { result } = renderHook(() => useClarifications());
    await waitFor(() => expect(listClarifications).toHaveBeenCalledTimes(1));

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent("contest-clarifications-invalidate", {
          detail: {
            problem: "Two Sum",
            question: "Bounds?",
            answer: "1e5",
          },
        })
      );
    });

    await waitFor(() => {
      expect(listClarifications.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
    expect(result.current.loadError).toBeNull();
  });
});
