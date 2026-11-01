import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, act, waitFor } from "@testing-library/react";
import { StrictMode, useEffect, useState } from "react";

// Mock modules before importing WebSocketProvider
vi.mock("../resolveWsUrl", () => ({
  resolveWsUrl: vi.fn(),
  invalidateWsPath: vi.fn(),
}));

vi.mock("shared/api/authApi", () => ({
  checkSessionWithRetry: vi.fn().mockResolvedValue({ authenticated: true }),
}));

vi.mock("shared/auth/authStorage", () => ({
  isLoggedInLocally: vi.fn(() => true),
  getTeamName: vi.fn(() => "TestTeam"),
  clearAuthenticationStorage: vi.fn(),
  notifyAuthChanged: vi.fn(),
}));

vi.mock("shared/auth/pendingAuthError", () => ({
  setPendingAuthError: vi.fn(),
}));

vi.mock("shared/auth/rateLimitBlock", () => ({
  remainingRateLimitMs: vi.fn(() => 0),
  setRateLimitBlock: vi.fn(),
}));

import { WebSocketProvider, useContestConnection } from "../WebSocketProvider";
import { resolveWsUrl, invalidateWsPath } from "../resolveWsUrl";
import { isLoggedInLocally } from "shared/auth/authStorage";

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  onopen: (() => void) | null = null;
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;
  readyState = 0;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = 3;
  });

  simulateOpen() {
    this.readyState = 1;
    this.onopen?.();
  }

  simulateClose(code = 1000, reason = "") {
    this.readyState = 3;
    this.onclose?.({ code, reason });
  }

  static reset() {
    MockWebSocket.instances = [];
  }
}

describe("WebSocketProvider", () => {
  const originalWebSocket = globalThis.WebSocket;
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    MockWebSocket.reset();
    // @ts-expect-error - Mocking WebSocket
    globalThis.WebSocket = MockWebSocket;
    vi.stubEnv("DEV", false);

    // Setup default mocks
    vi.mocked(isLoggedInLocally).mockReturnValue(true);
    vi.mocked(resolveWsUrl).mockResolvedValue("ws://test.example.com/ws/contest");

    // Mock location hash
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, hash: "#/home" },
      writable: true,
    });
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
    vi.unstubAllEnvs();
  });

  function TestConsumer() {
    const { ready } = useContestConnection();
    return <div data-testid="ready">{ready ? "ready" : "not-ready"}</div>;
  }

  describe("URL resolution", () => {
    it("connects to URL from resolveWsUrl", async () => {
      vi.mocked(resolveWsUrl).mockResolvedValue("ws://custom.example.com/ws/custom");

      render(
        <WebSocketProvider>
          <TestConsumer />
        </WebSocketProvider>
      );

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      expect(MockWebSocket.instances[0].url).toBe("ws://custom.example.com/ws/custom");
    });

    it("calls resolveWsUrl on connect", async () => {
      render(
        <WebSocketProvider>
          <TestConsumer />
        </WebSocketProvider>
      );

      await waitFor(() => {
        expect(resolveWsUrl).toHaveBeenCalled();
      });
    });
  });

  describe("StrictMode handling", () => {
    it("opens only one socket under StrictMode", async () => {
      // Simulate slow URL resolution
      let resolveUrl: (url: string) => void;
      vi.mocked(resolveWsUrl).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveUrl = resolve;
          })
      );

      render(
        <StrictMode>
          <WebSocketProvider>
            <TestConsumer />
          </WebSocketProvider>
        </StrictMode>
      );

      // Wait for both StrictMode mounts to call resolveWsUrl
      await waitFor(() => {
        expect(resolveWsUrl).toHaveBeenCalled();
      });

      // Resolve the URL
      await act(async () => {
        resolveUrl!("ws://test.example.com/ws/contest");
        await new Promise((r) => setTimeout(r, 50));
      });

      // Should only have one socket despite StrictMode double mount
      expect(MockWebSocket.instances.length).toBe(1);
    });
  });

  describe("logout during resolution", () => {
    it("does not open socket if logged out during URL resolution", async () => {
      // Simulate slow URL resolution
      let resolveUrl: (url: string) => void;
      vi.mocked(resolveWsUrl).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveUrl = resolve;
          })
      );

      function LogoutDuringResolve() {
        const [loggedIn, setLoggedIn] = useState(true);

        useEffect(() => {
          // Simulate logout after a short delay
          const timeout = setTimeout(() => {
            vi.mocked(isLoggedInLocally).mockReturnValue(false);
            setLoggedIn(false);
            window.dispatchEvent(new Event("authChanged"));
          }, 10);
          return () => clearTimeout(timeout);
        }, []);

        if (!loggedIn) {
          return <div>logged out</div>;
        }

        return (
          <WebSocketProvider>
            <TestConsumer />
          </WebSocketProvider>
        );
      }

      render(<LogoutDuringResolve />);

      // Wait for logout to happen
      await waitFor(() => {
        expect(vi.mocked(isLoggedInLocally)).toHaveReturnedWith(false);
      });

      // Resolve URL after logout
      await act(async () => {
        resolveUrl!("ws://test.example.com/ws/contest");
        await new Promise((r) => setTimeout(r, 50));
      });

      // No socket should have been created
      expect(MockWebSocket.instances.length).toBe(0);
    });
  });

  describe("path invalidation on handshake failure", () => {
    it("calls invalidateWsPath when socket never opens", async () => {
      vi.mocked(resolveWsUrl).mockResolvedValue("ws://test.example.com/ws/wrong-path");

      render(
        <WebSocketProvider>
          <TestConsumer />
        </WebSocketProvider>
      );

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const socket = MockWebSocket.instances[0];

      // Simulate close without ever opening (handshake failure)
      await act(async () => {
        socket.simulateClose(1006, "");
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(invalidateWsPath).toHaveBeenCalled();
    });

    it("does not invalidate when socket opened successfully then closed", async () => {
      render(
        <WebSocketProvider>
          <TestConsumer />
        </WebSocketProvider>
      );

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      const socket = MockWebSocket.instances[0];

      // Open the socket first
      await act(async () => {
        socket.simulateOpen();
        await new Promise((r) => setTimeout(r, 50));
      });

      vi.clearAllMocks();

      // Then close it
      await act(async () => {
        socket.simulateClose(1000, "Normal closure");
        await new Promise((r) => setTimeout(r, 50));
      });

      // Should NOT invalidate since it had successfully opened
      expect(invalidateWsPath).not.toHaveBeenCalled();
    });
  });

  describe("ready state", () => {
    it("becomes ready after socket opens", async () => {
      const { getByTestId } = render(
        <WebSocketProvider>
          <TestConsumer />
        </WebSocketProvider>
      );

      expect(getByTestId("ready").textContent).toBe("not-ready");

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(1);
      });

      await act(async () => {
        MockWebSocket.instances[0].simulateOpen();
      });

      await waitFor(() => {
        expect(getByTestId("ready").textContent).toBe("ready");
      });
    });
  });
});
