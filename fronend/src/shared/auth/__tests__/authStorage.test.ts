import {
  clearAuthenticationStorage,
  getDisplayName,
  getUsername,
  isLoggedInLocally,
  setAuthSession,
} from "shared/auth/authStorage";

describe("authStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("clears auth keys from sessionStorage but preserves product-tour keys", () => {
    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("teamName", "Team A");
    sessionStorage.setItem("username", "team1");
    sessionStorage.setItem("displayName", "Team A");
    sessionStorage.setItem("csrfToken", "csrf");
    sessionStorage.setItem("token", "jwt");
    localStorage.setItem("acpc:product-tour:Team A:completed", "1");

    clearAuthenticationStorage();

    expect(sessionStorage.getItem("isLoggedIn")).toBeNull();
    expect(sessionStorage.getItem("teamName")).toBeNull();
    expect(sessionStorage.getItem("username")).toBeNull();
    expect(sessionStorage.getItem("displayName")).toBeNull();
    expect(sessionStorage.getItem("csrfToken")).toBeNull();
    expect(sessionStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("acpc:product-tour:Team A:completed")).toBe(
      "1"
    );
  });

  it("hydrates identity from localStorage into this tab without deleting the cache", () => {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("username", "team1");
    localStorage.setItem("csrfToken", "abc");

    expect(getUsername()).toBe("team1");
    expect(sessionStorage.getItem("username")).toBe("team1");
    expect(sessionStorage.getItem("csrfToken")).toBe("abc");
    expect(localStorage.getItem("username")).toBe("team1");
    expect(localStorage.getItem("csrfToken")).toBe("abc");
    expect(isLoggedInLocally()).toBe(false);
    expect(localStorage.getItem("isLoggedIn")).toBeNull();
  });

  it("setAuthSession writes identity to sessionStorage and a localStorage cache", () => {
    setAuthSession({
      username: "team1",
      displayName: "Team One",
      csrfToken: "abc",
    });
    expect(sessionStorage.getItem("isLoggedIn")).toBe("true");
    expect(sessionStorage.getItem("username")).toBe("team1");
    expect(sessionStorage.getItem("displayName")).toBe("Team One");
    expect(sessionStorage.getItem("teamName")).toBe("Team One");
    expect(sessionStorage.getItem("csrfToken")).toBe("abc");
    expect(localStorage.getItem("isLoggedIn")).toBeNull();
    expect(localStorage.getItem("username")).toBe("team1");
    expect(localStorage.getItem("displayName")).toBe("Team One");
    expect(localStorage.getItem("csrfToken")).toBe("abc");
    expect(getUsername()).toBe("team1");
    expect(getDisplayName()).toBe("Team One");
  });

  it("restores identity into an empty tab from the localStorage cache", () => {
    localStorage.setItem("username", "team1");
    localStorage.setItem("displayName", "Team One");
    localStorage.setItem("teamName", "Team One");
    localStorage.setItem("csrfToken", "abc");

    setAuthSession({});

    expect(sessionStorage.getItem("isLoggedIn")).toBe("true");
    expect(sessionStorage.getItem("username")).toBe("team1");
    expect(sessionStorage.getItem("displayName")).toBe("Team One");
    expect(sessionStorage.getItem("teamName")).toBe("Team One");
    expect(sessionStorage.getItem("csrfToken")).toBe("abc");
    expect(getDisplayName()).toBe("Team One");
  });

  it("clearAuthenticationStorage drops the cross-tab identity cache", () => {
    setAuthSession({
      username: "team1",
      displayName: "Team One",
      csrfToken: "abc",
    });
    clearAuthenticationStorage();
    expect(localStorage.getItem("username")).toBeNull();
    expect(localStorage.getItem("displayName")).toBeNull();
    expect(localStorage.getItem("csrfToken")).toBeNull();
    expect(getDisplayName()).toBeNull();
  });
});
