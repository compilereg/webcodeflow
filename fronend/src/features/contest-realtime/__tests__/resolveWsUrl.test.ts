import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Must mock before importing the module under test
vi.mock("shared/api/wsPathApi", () => ({
  fetchWsPath: vi.fn(),
}));

vi.mock("shared/config/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("shared/config/env")>();
  return {
    ...actual,
    getWsUrlOverride: vi.fn(() => ""),
    buildWsUrl: vi.fn((path: string) => `ws://test-host${path}`),
    getApiBase: vi.fn(() => ""),
  };
});

import { resolveWsUrl, invalidateWsPath } from "../resolveWsUrl";
import { fetchWsPath } from "shared/api/wsPathApi";
import { getWsUrlOverride, buildWsUrl } from "shared/config/env";

describe("resolveWsUrl", () => {
  beforeEach(() => {
    // Reset mocks and cache before each test
    vi.clearAllMocks();
    invalidateWsPath();
    vi.stubEnv("DEV", false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("override precedence", () => {
    it("uses VITE_WS_URL override when set", async () => {
      vi.mocked(getWsUrlOverride).mockReturnValue("ws://override:9000/custom");

      const result = await resolveWsUrl();

      expect(result).toBe("ws://override:9000/custom");
      expect(fetchWsPath).not.toHaveBeenCalled();
    });

    it("skips fetch when override is set", async () => {
      vi.mocked(getWsUrlOverride).mockReturnValue("wss://secure.example.com/ws");

      await resolveWsUrl();

      expect(fetchWsPath).not.toHaveBeenCalled();
    });
  });

  describe("backend fetch", () => {
    it("fetches path from backend when no override", async () => {
      vi.mocked(getWsUrlOverride).mockReturnValue("");
      vi.mocked(fetchWsPath).mockResolvedValue("/ws/contest");

      const result = await resolveWsUrl();

      expect(fetchWsPath).toHaveBeenCalledTimes(1);
      expect(buildWsUrl).toHaveBeenCalledWith("/ws/contest");
      expect(result).toBe("ws://test-host/ws/contest");
    });

    it("uses custom backend path", async () => {
      vi.mocked(getWsUrlOverride).mockReturnValue("");
      vi.mocked(fetchWsPath).mockResolvedValue("/ws/contest2");

      const result = await resolveWsUrl();

      expect(buildWsUrl).toHaveBeenCalledWith("/ws/contest2");
      expect(result).toBe("ws://test-host/ws/contest2");
    });
  });

  describe("caching", () => {
    it("caches successful backend fetch", async () => {
      vi.mocked(getWsUrlOverride).mockReturnValue("");
      vi.mocked(fetchWsPath).mockResolvedValue("/ws/contest");

      await resolveWsUrl();
      await resolveWsUrl();
      await resolveWsUrl();

      expect(fetchWsPath).toHaveBeenCalledTimes(1);
    });

    it("returns same URL on subsequent calls", async () => {
      vi.mocked(getWsUrlOverride).mockReturnValue("");
      vi.mocked(fetchWsPath).mockResolvedValue("/ws/cached");

      const result1 = await resolveWsUrl();
      const result2 = await resolveWsUrl();

      expect(result1).toBe(result2);
    });

    it("does not cache failed fetches", async () => {
      vi.mocked(getWsUrlOverride).mockReturnValue("");
      vi.mocked(fetchWsPath)
        .mockResolvedValueOnce(null) // First call fails
        .mockResolvedValueOnce("/ws/contest"); // Second call succeeds

      const result1 = await resolveWsUrl();
      const result2 = await resolveWsUrl();

      expect(fetchWsPath).toHaveBeenCalledTimes(2);
      expect(result1).toBe("ws://test-host/ws/contest"); // Fallback
      expect(result2).toBe("ws://test-host/ws/contest"); // Success
    });

    it("refetches after invalidateWsPath", async () => {
      vi.mocked(getWsUrlOverride).mockReturnValue("");
      vi.mocked(fetchWsPath).mockResolvedValue("/ws/original");

      await resolveWsUrl();
      expect(fetchWsPath).toHaveBeenCalledTimes(1);

      invalidateWsPath();

      vi.mocked(fetchWsPath).mockResolvedValue("/ws/updated");
      const result = await resolveWsUrl();

      expect(fetchWsPath).toHaveBeenCalledTimes(2);
      expect(result).toBe("ws://test-host/ws/updated");
    });
  });

  describe("fallback", () => {
    it("falls back to default path on fetch failure", async () => {
      vi.mocked(getWsUrlOverride).mockReturnValue("");
      vi.mocked(fetchWsPath).mockResolvedValue(null);

      const result = await resolveWsUrl();

      expect(buildWsUrl).toHaveBeenCalledWith("/ws/contest");
      expect(result).toBe("ws://test-host/ws/contest");
    });

    it("falls back to default path on fetch error", async () => {
      vi.mocked(getWsUrlOverride).mockReturnValue("");
      vi.mocked(fetchWsPath).mockRejectedValue(new Error("Network error"));

      const result = await resolveWsUrl();

      expect(result).toBe("ws://test-host/ws/contest");
    });
  });

  describe("concurrent calls", () => {
    it("deduplicates concurrent fetch calls", async () => {
      vi.mocked(getWsUrlOverride).mockReturnValue("");
      let resolveCount = 0;
      vi.mocked(fetchWsPath).mockImplementation(async () => {
        resolveCount++;
        await new Promise((r) => setTimeout(r, 10));
        return "/ws/contest";
      });

      const [result1, result2, result3] = await Promise.all([
        resolveWsUrl(),
        resolveWsUrl(),
        resolveWsUrl(),
      ]);

      expect(resolveCount).toBe(1);
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });
});

describe("invalidateWsPath", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateWsPath();
    vi.stubEnv("DEV", false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("clears cached result", async () => {
    vi.mocked(getWsUrlOverride).mockReturnValue("");
    vi.mocked(fetchWsPath).mockResolvedValue("/ws/first");

    await resolveWsUrl();
    invalidateWsPath();

    vi.mocked(fetchWsPath).mockResolvedValue("/ws/second");
    const result = await resolveWsUrl();

    expect(result).toBe("ws://test-host/ws/second");
  });

  it("can be called multiple times safely", () => {
    expect(() => {
      invalidateWsPath();
      invalidateWsPath();
      invalidateWsPath();
    }).not.toThrow();
  });
});
