import { normalizeApiBase } from "shared/config/env";
import { apiUrl } from "shared/api/apiUrl";
import {
  normalizeProblem,
  normalizeProblems,
  activeProblems,
} from "shared/api/normalize";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("normalizeApiBase", () => {
  it("returns empty string for blank input", () => {
    expect(normalizeApiBase("")).toBe("");
    expect(normalizeApiBase("   ")).toBe("");
    expect(normalizeApiBase(undefined)).toBe("");
  });

  it("strips trailing slash", () => {
    expect(normalizeApiBase("http://example.com:8888/")).toBe(
      "http://example.com:8888"
    );
  });

  it("prefixes host:port without protocol", () => {
    expect(normalizeApiBase("10.0.3.6:8888")).toBe("http://10.0.3.6:8888");
  });

  it("keeps https URLs", () => {
    expect(normalizeApiBase("https://api.example.com")).toBe(
      "https://api.example.com"
    );
  });
});

describe("apiUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("joins base and path", () => {
    vi.stubEnv("VITE_API_URL", "http://10.0.3.6:8888");
    expect(apiUrl("/api/main/session")).toBe(
      "http://10.0.3.6:8888/api/main/session"
    );
  });

  it("uses relative path when base is empty", () => {
    vi.stubEnv("VITE_API_URL", "");
    expect(apiUrl("/api/main/session")).toBe("/api/main/session");
  });
});

describe("problem normalization", () => {
  it("maps alphabte to shortName", () => {
    expect(
      normalizeProblem({ name: "Two Sum", alphabte: "A", isDeleted: false })
    ).toEqual({ name: "Two Sum", shortName: "A", isDeleted: false });
  });

  it("prefers shortName when already present", () => {
    expect(
      normalizeProblem({ name: "X", shortName: "B", alphabte: "A" })
    ).toEqual({ name: "X", shortName: "B", isDeleted: false });
  });

  it("filters deleted problems", () => {
    const list = normalizeProblems([
      { name: "A", alphabte: "A", isDeleted: false },
      { name: "B", alphabte: "B", isDeleted: true },
    ]);
    expect(activeProblems(list)).toHaveLength(1);
    expect(activeProblems(list)[0].shortName).toBe("A");
  });
});
