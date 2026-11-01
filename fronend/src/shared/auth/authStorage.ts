/**
 * Authentication/session browser storage.
 *
 * `isLoggedIn` stays in sessionStorage (this tab only). Team identity
 * (username, display name, CSRF) is mirrored to localStorage so a new
 * tab can hydrate after the JWT cookie passes `GET /session`.
 *
 * Product-tour completion stays in localStorage under keys prefixed
 * with "acpc:product-tour:" so the same team does not see the
 * first-login tour again after logout.
 *
 * Do not call localStorage.clear() during logout or failed session checks.
 */
const AUTH_STORAGE_KEYS = [
  "isLoggedIn",
  "teamName",
  "username",
  "displayName",
  "csrfToken",
  // Legacy key from older builds; cleared on logout, never written.
  "token",
] as const;

/** Shared across tabs. Not `isLoggedIn` — the cookie + /session are the gate. */
const SHARED_IDENTITY_KEYS = [
  "teamName",
  "username",
  "displayName",
  "csrfToken",
] as const;

function removeAuthKeys(store: Storage): void {
  AUTH_STORAGE_KEYS.forEach((key) => {
    store.removeItem(key);
  });
}

/**
 * Copy team identity from localStorage into this tab's sessionStorage
 * when a field is missing. Keeps the localStorage cache so other tabs
 * can do the same. Drops a leftover `isLoggedIn` flag from older builds.
 */
function hydrateIdentityFromLocalStorage(): void {
  localStorage.removeItem("isLoggedIn");
  SHARED_IDENTITY_KEYS.forEach((key) => {
    if (sessionStorage.getItem(key) == null) {
      const cached = localStorage.getItem(key);
      if (cached != null) sessionStorage.setItem(key, cached);
    }
  });
}

function persistIdentityToLocalStorage(): void {
  localStorage.removeItem("isLoggedIn");
  SHARED_IDENTITY_KEYS.forEach((key) => {
    const value = sessionStorage.getItem(key);
    if (value != null) {
      localStorage.setItem(key, value);
    }
  });
}

export function clearAuthenticationStorage(): void {
  removeAuthKeys(sessionStorage);
  removeAuthKeys(localStorage);
}

export function setAuthSession({
  username,
  displayName,
  csrfToken,
}: {
  username?: string | null;
  displayName?: string | null;
  csrfToken?: string | null;
}): void {
  hydrateIdentityFromLocalStorage();
  sessionStorage.setItem("isLoggedIn", "true");
  if (username != null) {
    sessionStorage.setItem("username", username);
  }
  if (displayName != null) {
    sessionStorage.setItem("displayName", displayName);
    // Kept for scoreboard matching, product-tour keys, and older call sites.
    sessionStorage.setItem("teamName", displayName);
  }
  if (csrfToken != null) {
    sessionStorage.setItem("csrfToken", csrfToken);
  }
  persistIdentityToLocalStorage();
}

export function getCsrfToken(): string {
  hydrateIdentityFromLocalStorage();
  return sessionStorage.getItem("csrfToken") || "";
}

/** Login username (account id). */
export function getUsername(): string | null {
  hydrateIdentityFromLocalStorage();
  return sessionStorage.getItem("username");
}

/** Team display name shown in the contest UI / scoreboard. */
export function getDisplayName(): string | null {
  hydrateIdentityFromLocalStorage();
  return (
    sessionStorage.getItem("displayName") || sessionStorage.getItem("teamName")
  );
}

/** @deprecated Prefer getDisplayName(); alias kept for scoreboard / tour callers. */
export function getTeamName(): string | null {
  return getDisplayName();
}

export function isLoggedInLocally(): boolean {
  return sessionStorage.getItem("isLoggedIn") === "true";
}

export function notifyAuthChanged(): void {
  window.dispatchEvent(new Event("authChanged"));
}
