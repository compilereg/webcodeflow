import { describe, expect, it } from "vitest";
import { extractApiError, networkErrorMessage } from "shared/api/apiError";

describe("extractApiError", () => {
  it("maps team-only 403 to AUTH_TEAM_ONLY", () => {
    expect(extractApiError({ error: "Only team accounts allowed" }, 403)).toBe(
      "AUTH_TEAM_ONLY"
    );
  });

  it("maps backend login catch-all 401 to a code", () => {
    expect(extractApiError({ error: "Login failed" }, 401)).toBe(
      "AUTH_INVALID_CREDENTIALS"
    );
  });

  it("maps HTML 404 to AUTH_UNREACHABLE", () => {
    expect(extractApiError("<!DOCTYPE html>", 404)).toBe("AUTH_UNREACHABLE");
  });
});

describe("networkErrorMessage", () => {
  it("maps fetch TypeError to AUTH_UNREACHABLE", () => {
    expect(networkErrorMessage(new TypeError("Failed to fetch"))).toBe(
      "AUTH_UNREACHABLE"
    );
  });
});
