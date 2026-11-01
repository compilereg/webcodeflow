import { render, waitFor } from "@testing-library/react";
import { useSessionStatus } from "app/useSessionStatus";
import { getDisplayName, getUsername } from "shared/auth/authStorage";
import { vi } from "vitest";

function Probe({ onStatus }: { onStatus: (status: string) => void }) {
  const status = useSessionStatus();
  onStatus(status);
  return <div>{status}</div>;
}

describe("useSessionStatus", () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("hydrates team identity into a new tab when the cookie session is valid", async () => {
    localStorage.setItem("username", "team1");
    localStorage.setItem("displayName", "Team One");
    localStorage.setItem("teamName", "Team One");
    localStorage.setItem("csrfToken", "abc");

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          authenticated: true,
          message: "Session is valid.",
          username: "team1",
          displayName: "Team One (Cairo University)",
        }),
    });

    const seen: string[] = [];
    render(<Probe onStatus={(status) => seen.push(status)} />);

    await waitFor(() => {
      expect(seen[seen.length - 1]).toBe("authenticated");
    });
    expect(sessionStorage.getItem("isLoggedIn")).toBe("true");
    expect(getUsername()).toBe("team1");
    expect(getDisplayName()).toBe("Team One (Cairo University)");
    expect(sessionStorage.getItem("csrfToken")).toBe("abc");
  });

  it("keeps a local session when /session is unreachable (no false logout)", async () => {
    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("username", "team1");
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    const seen: string[] = [];
    render(<Probe onStatus={(status) => seen.push(status)} />);

    await waitFor(
      () => {
        expect(seen[seen.length - 1]).toBe("authenticated");
      },
      { timeout: 5000 }
    );
    expect(sessionStorage.getItem("isLoggedIn")).toBe("true");
    expect(globalThis.fetch).toHaveBeenCalled();
  });

  it("clears auth when the server explicitly says unauthenticated", async () => {
    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("username", "team1");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ authenticated: false }),
    });

    const seen: string[] = [];
    render(<Probe onStatus={(status) => seen.push(status)} />);

    await waitFor(() => {
      expect(seen[seen.length - 1]).toBe("unauthenticated");
    });
    expect(sessionStorage.getItem("isLoggedIn")).toBeNull();
  });
});
