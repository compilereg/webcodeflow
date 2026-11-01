import {
  classifyWsClose,
  handleLogoutRequired,
  resolveForcedLogoutPath,
  WS_AMBIGUOUS_CLOSE_RETRY_LIMIT,
} from "features/contest-realtime";
import { clearAuthenticationStorage } from "shared/auth/authStorage";
import { consumePendingAuthError } from "shared/auth/pendingAuthError";

describe("forced logout routing", () => {
  it("resolves to hash login path /", () => {
    expect(resolveForcedLogoutPath()).toBe("/");
    expect(resolveForcedLogoutPath()).not.toBe("/login");
  });

  it("clears full auth storage and sets hash to #/", () => {
    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("teamName", "Team");
    sessionStorage.setItem("csrfToken", "x");
    sessionStorage.setItem("token", "t");

    handleLogoutRequired();

    expect(sessionStorage.getItem("isLoggedIn")).toBeNull();
    expect(sessionStorage.getItem("csrfToken")).toBeNull();
    expect(window.location.hash).toBe("#/");
  });

  it("exports clearAuthenticationStorage for forced logout", () => {
    sessionStorage.setItem("isLoggedIn", "true");
    clearAuthenticationStorage();
    expect(sessionStorage.getItem("isLoggedIn")).toBeNull();
  });

  it("stores AUTH_ADMIN_LOGOFF for the login page", () => {
    handleLogoutRequired("AUTH_ADMIN_LOGOFF");
    expect(consumePendingAuthError()).toBe("AUTH_ADMIN_LOGOFF");
    expect(consumePendingAuthError()).toBeNull();
  });
});

describe("classifyWsClose", () => {
  it("treats 4001 as admin logout", () => {
    expect(classifyWsClose(4001, "PC2 admin forced logout")).toBe(
      "admin-logout"
    );
  });

  it("treats Too many connection attempts as rate-limit", () => {
    expect(classifyWsClose(1008, "Too many connection attempts")).toBe(
      "rate-limit"
    );
  });

  it("treats 1008 Unauthorized as auth (session already gone)", () => {
    expect(classifyWsClose(1008, "Unauthorized")).toBe("auth");
  });

  it("retries bare 1008 so proxy-stripped closes do not false-logout", () => {
    expect(classifyWsClose(1008, "")).toBe("retry");
  });

  it("retries early 1006 instead of logging out", () => {
    expect(
      classifyWsClose(1006, "", { diedImmediately: true })
    ).toBe("retry");
  });

  it("retries 1006 after a couple reconnects", () => {
    expect(
      classifyWsClose(1006, "", { reconnectAttempts: 2, diedImmediately: true })
    ).toBe("retry");
  });

  it("escalates ambiguous immediate closes after many reconnects", () => {
    expect(
      classifyWsClose(1008, "", {
        diedImmediately: true,
        reconnectAttempts: WS_AMBIGUOUS_CLOSE_RETRY_LIMIT,
      })
    ).toBe("rate-limit");
    expect(
      classifyWsClose(1006, "", {
        diedImmediately: true,
        reconnectAttempts: WS_AMBIGUOUS_CLOSE_RETRY_LIMIT,
      })
    ).toBe("rate-limit");
  });

  it("retries normal closes so transient network blips can recover", () => {
    expect(classifyWsClose(1001, "Going Away")).toBe("retry");
    expect(classifyWsClose(1005, "")).toBe("retry");
  });
});
