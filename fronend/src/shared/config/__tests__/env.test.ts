import { describe, expect, it, vi, afterEach } from "vitest";
import {
  buildWsUrl,
  DEFAULT_WS_PATH,
  getWsUrlOverride,
  normalizeApiBase,
} from "../env";

describe("DEFAULT_WS_PATH", () => {
  it("is /ws/contest", () => {
    expect(DEFAULT_WS_PATH).toBe("/ws/contest");
  });
});

describe("getWsUrlOverride", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns empty string when VITE_WS_URL is not set", () => {
    vi.stubEnv("VITE_WS_URL", "");
    expect(getWsUrlOverride()).toBe("");
  });

  it("returns trimmed value when set", () => {
    vi.stubEnv("VITE_WS_URL", "  ws://custom:8080/ws  ");
    expect(getWsUrlOverride()).toBe("ws://custom:8080/ws");
  });
});

describe("buildWsUrl", () => {
  const mockLocation = (protocol: string, host: string) => ({
    protocol,
    host,
  });

  describe("protocol mapping", () => {
    it("maps http to ws", () => {
      const url = buildWsUrl(
        "/ws/contest",
        "http://example.com:8080",
        mockLocation("https:", "localhost:3000")
      );
      expect(url).toBe("ws://example.com:8080/ws/contest");
    });

    it("maps https to wss", () => {
      const url = buildWsUrl(
        "/ws/contest",
        "https://secure.example.com",
        mockLocation("http:", "localhost:3000")
      );
      expect(url).toBe("wss://secure.example.com/ws/contest");
    });
  });

  describe("host selection", () => {
    it("uses apiBase host when apiBase is set", () => {
      const url = buildWsUrl(
        "/ws/test",
        "http://api.example.com:9000",
        mockLocation("https:", "frontend.example.com")
      );
      expect(url).toBe("ws://api.example.com:9000/ws/test");
    });

    it("uses location host when apiBase is empty", () => {
      const url = buildWsUrl(
        "/ws/contest",
        "",
        mockLocation("https:", "production.example.com")
      );
      expect(url).toBe("wss://production.example.com/ws/contest");
    });

    it("falls back to location on invalid apiBase URL", () => {
      const url = buildWsUrl(
        "/ws/contest",
        "not-a-valid-url",
        mockLocation("http:", "localhost:3000")
      );
      expect(url).toBe("ws://localhost:3000/ws/contest");
    });
  });

  describe("path handling", () => {
    it("adds leading slash if missing", () => {
      const url = buildWsUrl(
        "ws/contest",
        "http://example.com",
        mockLocation("http:", "localhost")
      );
      expect(url).toBe("ws://example.com/ws/contest");
    });

    it("removes trailing slashes", () => {
      const url = buildWsUrl(
        "/ws/contest///",
        "http://example.com",
        mockLocation("http:", "localhost")
      );
      expect(url).toBe("ws://example.com/ws/contest");
    });

    it("preserves paths with multiple segments", () => {
      const url = buildWsUrl(
        "/api/v2/ws/live",
        "http://example.com:8080",
        mockLocation("http:", "localhost")
      );
      expect(url).toBe("ws://example.com:8080/api/v2/ws/live");
    });
  });

  describe("same-origin scenarios", () => {
    it("builds correct URL for local development (http)", () => {
      const url = buildWsUrl(
        "/ws/contest",
        "",
        mockLocation("http:", "localhost:3000")
      );
      expect(url).toBe("ws://localhost:3000/ws/contest");
    });

    it("builds correct URL for production (https)", () => {
      const url = buildWsUrl(
        "/ws/contest",
        "",
        mockLocation("https:", "app.example.com")
      );
      expect(url).toBe("wss://app.example.com/ws/contest");
    });
  });
});

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
