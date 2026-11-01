import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSessionStatus } from "./useSessionStatus";

type RouteGuardProps = {
  children: ReactNode;
};

function SessionLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface text-foreground">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-brand border-t-transparent"
          aria-hidden
        />
        <p className="text-sm text-foreground-muted">Loading…</p>
      </div>
    </div>
  );
}

export function PrivateRoute({ children }: RouteGuardProps) {
  const status = useSessionStatus();

  if (status === "checking") return <SessionLoading />;

  if (status === "unauthenticated") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function PublicRoute({ children }: RouteGuardProps) {
  const status = useSessionStatus();

  if (status === "checking") return <SessionLoading />;

  if (status === "authenticated") {
    return <Navigate to="/home" replace />;
  }

  return children;
}

/**
 * Unknown paths: authenticated teams → /home, everyone else → login.
 */
export function AuthCatchAll() {
  const status = useSessionStatus();

  if (status === "checking") return <SessionLoading />;

  if (status === "authenticated") {
    return <Navigate to="/home" replace />;
  }

  return <Navigate to="/" replace />;
}
