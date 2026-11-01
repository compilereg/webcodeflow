import {
  collectKnownRunNumbers,
  resolveSubmissionIdAfterSubmit,
} from "shared/api/runsApi";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("resolveSubmissionIdAfterSubmit", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the new run number matching problem and language", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify([
            { runNumber: 1, problem: "Sum of Integers", language: "Python" },
            { runNumber: 2, problem: "Sum of Integers", language: "Python" },
          ]),
      });
    globalThis.fetch = fetchMock;

    const id = await resolveSubmissionIdAfterSubmit(
      "Sum of Integers",
      "Python",
      new Set([1])
    );

    expect(id).toBe(2);
  });

  it("when several new matches exist, picks the smallest new id", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([
          { runNumber: 10, problem: "A", language: "C++" },
          { runNumber: 12, problem: "A", language: "C++" },
          { runNumber: 11, problem: "A", language: "C++" },
        ]),
    });

    const id = await resolveSubmissionIdAfterSubmit("A", "C++", new Set([10]));
    expect(id).toBe(11);
  });

  it("collectKnownRunNumbers builds a set of ids", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([{ runNumber: 5 }, { runNumber: 9, id: 10 }]),
    });

    const known = await collectKnownRunNumbers();
    expect(known.has(5)).toBe(true);
    expect(known.has(9)).toBe(true);
  });
});
