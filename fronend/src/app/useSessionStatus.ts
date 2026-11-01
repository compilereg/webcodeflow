import { useEffect, useState } from "react";
import { checkSessionWithRetry } from "shared/api/authApi";
import {
  clearAuthenticationStorage,
  isLoggedInLocally,
  notifyAuthChanged,
  setAuthSession,
} from "shared/auth/authStorage";

export type SessionStatus = "checking" | "authenticated" | "unauthenticated";

/**
 * Shared session check for PrivateRoute / PublicRoute.
 * Network blips retry; only an explicit unauthenticated response clears auth.
 */
export function useSessionStatus(): SessionStatus {
  const [status, setStatus] = useState<SessionStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    const validate = async () => {
      const session = await checkSessionWithRetry({ attempts: 3, delayMs: 400 });

      if (cancelled) return;

      if (session.unreachable) {
        // API briefly unreachable: keep local session if present so teams are
        // not kicked mid-contest by a transient outage.
        if (isLoggedInLocally()) {
          setStatus("authenticated");
          return;
        }
        setStatus("unauthenticated");
        return;
      }

      if (!session.authenticated) {
        clearAuthenticationStorage();
        notifyAuthChanged();
        setStatus("unauthenticated");
        return;
      }

      setAuthSession({
        username:
          session.username && session.username !== "N/A"
            ? session.username
            : undefined,
        displayName:
          session.displayName && session.displayName !== "N/A"
            ? session.displayName
            : undefined,
      });
      notifyAuthChanged();
      setStatus("authenticated");
    };

    void validate();

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
