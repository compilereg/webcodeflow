import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fetchWsPath } from "../wsPathApi";

describe("fetchWsPath", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubEnv("DEV", false);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  function mockFetch(response: {
    ok: boolean;
    status?: number;
    body?: unknown;
  }) {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: response.ok,
      status: response.status ?? (response.ok ? 200 : 500),
      text: () => Promise.resolve(JSON.stringify(response.body ?? {})),
    });
  }

  describe("successful responses", () => {
    it("returns valid path from backend", async () => {
      mockFetch({ ok: true, body: { socketPath: "/ws/contest" } });
      const result = await fetchWsPath();
      expect(result).toBe("/ws/contest");
    });

    it("returns custom path from backend", async () => {
      mockFetch({ ok: true, body: { socketPath: "/ws/contest2" } });
      const result = await fetchWsPath();
      expect(result).toBe("/ws/contest2");
    });

    it("trims whitespace from path", async () => {
      mockFetch({ ok: true, body: { socketPath: "  /ws/contest  " } });
      const result = await fetchWsPath();
      expect(result).toBe("/ws/contest");
    });

    it("accepts paths with hyphens and underscores", async () => {
      mockFetch({ ok: true, body: { socketPath: "/ws/contest-v2_live" } });
      const result = await fetchWsPath();
      expect(result).toBe("/ws/contest-v2_live");
    });

    it("accepts paths with dots", async () => {
      mockFetch({ ok: true, body: { socketPath: "/ws/v1.0/contest" } });
      const result = await fetchWsPath();
      expect(result).toBe("/ws/v1.0/contest");
    });
  });

  describe("validation rejections", () => {
    it("rejects path without leading slash", async () => {
      mockFetch({ ok: true, body: { socketPath: "ws/contest" } });
      const result = await fetchWsPath();
      expect(result).toBeNull();
    });

    it("rejects full URL (http)", async () => {
      mockFetch({ ok: true, body: { socketPath: "http://evil.example/ws" } });
      const result = await fetchWsPath();
      expect(result).toBeNull();
    });

    it("rejects full URL (ws)", async () => {
      mockFetch({ ok: true, body: { socketPath: "ws://evil.example/ws" } });
      const result = await fetchWsPath();
      expect(result).toBeNull();
    });

    it("rejects null socketPath", async () => {
      mockFetch({ ok: true, body: { socketPath: null } });
      const result = await fetchWsPath();
      expect(result).toBeNull();
    });

    it("rejects undefined socketPath", async () => {
      mockFetch({ ok: true, body: {} });
      const result = await fetchWsPath();
      expect(result).toBeNull();
    });

    it("rejects empty string", async () => {
      mockFetch({ ok: true, body: { socketPath: "" } });
      const result = await fetchWsPath();
      expect(result).toBeNull();
    });

    it("rejects whitespace-only string", async () => {
      mockFetch({ ok: true, body: { socketPath: "   " } });
      const result = await fetchWsPath();
      expect(result).toBeNull();
    });

    it("rejects non-string values", async () => {
      mockFetch({ ok: true, body: { socketPath: 123 } });
      const result = await fetchWsPath();
      expect(result).toBeNull();
    });

    it("rejects paths with query strings", async () => {
      mockFetch({ ok: true, body: { socketPath: "/ws/contest?token=abc" } });
      const result = await fetchWsPath();
      expect(result).toBeNull();
    });

    it("rejects paths with hash fragments", async () => {
      mockFetch({ ok: true, body: { socketPath: "/ws/contest#section" } });
      const result = await fetchWsPath();
      expect(result).toBeNull();
    });
  });

  describe("error handling", () => {
    it("returns null on 404", async () => {
      mockFetch({ ok: false, status: 404, body: {} });
      const result = await fetchWsPath();
      expect(result).toBeNull();
    });

    it("returns null on 500", async () => {
      mockFetch({ ok: false, status: 500, body: {} });
      const result = await fetchWsPath();
      expect(result).toBeNull();
    });

    it("returns null on network error", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
      const result = await fetchWsPath();
      expect(result).toBeNull();
    });

    it("returns null on timeout", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError"));
      const result = await fetchWsPath();
      expect(result).toBeNull();
    });
  });
});
