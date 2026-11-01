import { normalizeProblem } from "shared/api/normalize";
import { submitClarification } from "shared/api/clarificationsApi";
import { submitRun } from "shared/api/runsApi";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("submit payloads use PC² display name (getName)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("problem options keep display name separate from shortName", () => {
    const problem = normalizeProblem({
      name: "Sum of Integers",
      alphabte: "SOI",
      isDeleted: false,
    });
    expect(problem).toEqual({
      name: "Sum of Integers",
      shortName: "SOI",
      isDeleted: false,
    });
  });

  it("submitClarification sends ProblemName as display name", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          status: "Success",
          message: "Clarification submitted",
        }),
    });
    globalThis.fetch = fetchMock;

    await submitClarification({
      problemName: "Sum of Integers",
      question: "Is N large?",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      ProblemName: "Sum of Integers",
      Question: "Is N large?",
    });
  });

  it("submitRun sends problemName as display name", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          status: "Success",
          message: "Run submitted successfully",
        }),
    });
    globalThis.fetch = fetchMock;

    await submitRun({
      problemName: "Sum of Integers",
      languageName: "Java",
      mainFile: { fileName: "Main.java", fileContentBase64: "abc" },
      additionalFiles: [],
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body)).problemName).toBe("Sum of Integers");
  });
});
