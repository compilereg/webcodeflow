import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  useContestClock,
  useContestNotifications,
} from "features/contest-realtime";
import { NOTIFICATION_KIND_STYLES } from "features/contest-realtime/notificationStyles";
import {
  disableDesktopNotifications,
  enableDesktopNotifications,
  getDesktopNotificationState,
  type DesktopNotificationState,
} from "features/contest-realtime/desktopNotifications";
import { useContestAssets } from "features/contest-brand";
import { useTheme } from "features/theme";
import { logout as logoutRequest } from "shared/api/authApi";
import { getDisplayName, getUsername } from "shared/auth/authStorage";
import { APP_SHORT_NAME } from "shared/config/brand";
import { formatNotificationTime } from "shared/lib/formatNotificationTime";
import { teamNameOnly } from "shared/lib/teamDisplayName";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { logoSrc, iconSrc, contestTitle } = useContestAssets();

  const { timeLeft, isRunning, hasInitialData } = useContestClock();
  const {
    notifications,
    hasUnread,
    setHasUnread,
    setNotifications,
  } = useContestNotifications();

  const [openNotif, setOpenNotif] = useState(false);
  const [desktopNotifications, setDesktopNotifications] =
    useState<DesktopNotificationState>(getDesktopNotificationState());
  const [username, setUsername] = useState<string | null>(
    getUsername() || teamNameOnly(getDisplayName())
  );

  useEffect(() => {
    const updateName = () =>
      setUsername(getUsername() || teamNameOnly(getDisplayName()));
    updateName();
    window.addEventListener("authChanged", updateName);
    return () => window.removeEventListener("authChanged", updateName);
  }, []);

  const logout = async () => {
    await logoutRequest();
    navigate("/", { replace: true });
  };

  const linkClass = (path: string) => {
    const active = location.pathname.startsWith(path);
    return `shrink-0 rounded-lg px-2 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] transition lg:px-3 lg:tracking-[0.08em] xl:px-4 xl:py-2 xl:text-[12px] xl:tracking-[0.1em] ${
      active
        ? "bg-brand text-white shadow-sm"
        : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
    }`;
  };

  const clearNotifications = () => {
    setNotifications([]);
    setHasUnread(false);
  };

  const toggleNotifications = () => {
    setOpenNotif((prev) => {
      const next = !prev;
      if (!next) clearNotifications();
      else {
        setHasUnread(false);
        setDesktopNotifications(getDesktopNotificationState());
      }
      return next;
    });
  };

  const enableSystemAlerts = async () => {
    setDesktopNotifications(await enableDesktopNotifications());
  };

  const disableSystemAlerts = () => {
    setDesktopNotifications(disableDesktopNotifications());
  };

  const handleNotificationClick = (id: number, link: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    navigate(link);
    setOpenNotif(false);
  };

  let statusLabel = "Connecting";
  let badgeClass = "border-border bg-surface-muted text-foreground-muted";
  let statusDot = "bg-foreground-subtle";
  if (hasInitialData) {
    if (timeLeft <= 0) {
      statusLabel = "Contest Finished";
      badgeClass = "border-danger/30 bg-danger-muted text-danger";
      statusDot = "bg-danger";
    } else if (isRunning) {
      statusLabel = "Contest Running";
      badgeClass = "border-warning/30 bg-warning-muted text-foreground";
      statusDot = "bg-warning";
    } else {
      statusLabel = "Contest Paused";
      badgeClass = "border-border bg-surface-muted text-foreground-muted";
      statusDot = "bg-foreground-subtle";
    }
  }

  const initial = (username || "T").trim().charAt(0).toUpperCase();

  return (
    <header className="navbar sticky top-0 z-30 overflow-x-clip overflow-y-visible border-b border-border/40 bg-navbar">
      <div className="mx-auto grid h-14 max-w-[1440px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 sm:gap-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <img
            className="h-10 w-auto max-w-[6.5rem] shrink-0 object-contain object-left sm:h-11 sm:max-w-[8rem]"
            src={logoSrc}
            alt={contestTitle || APP_SHORT_NAME}
          />
          <div
            className={`inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em] sm:gap-2 sm:px-3 sm:text-[11px] ${badgeClass}`}
            title={statusLabel}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot}`} />
            <span className="truncate">{statusLabel}</span>
          </div>
        </div>

        <nav className="mx-auto hidden max-w-full items-center justify-center gap-0.5 lg:gap-1 md:flex">
          <Link to="/home" className={linkClass("/home")}>
            Home
          </Link>
          <Link to="/clarifications" className={linkClass("/clarifications")}>
            Clarifications
          </Link>
          <Link to="/judgments" className={linkClass("/judgments")}>
            Judgments
          </Link>
          <Link to="/scoreboard" className={linkClass("/scoreboard")}>
            Scoreboard
          </Link>
          <Link to="/tutorials" className={linkClass("/tutorials")}>
            Tutorials
          </Link>
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground-muted transition hover:bg-surface-muted hover:text-foreground sm:h-10 sm:w-10"
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={toggleNotifications}
              data-tour="nav-bell"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted transition hover:bg-surface-muted hover:text-foreground sm:h-10 sm:w-10"
              aria-label="Notifications"
            >
              <BellIcon />
              {hasUnread && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-navbar" />
              )}
            </button>

            {openNotif && (
              <div className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-xl">
                <div className="border-b border-border px-4 py-3 text-sm font-bold text-foreground">
                  Notifications
                </div>
                <DesktopNotificationControl
                  state={desktopNotifications}
                  onEnable={() => void enableSystemAlerts()}
                  onDisable={disableSystemAlerts}
                />
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-foreground-muted">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        className={`block w-full border-b border-border border-l-4 px-4 py-3 text-left transition hover:bg-surface-muted ${NOTIFICATION_KIND_STYLES[n.kind].cardAccent}`}
                        onClick={() => handleNotificationClick(n.id, n.link)}
                      >
                        <div className="text-sm text-foreground">{n.message}</div>
                        <div className="mt-1.5 text-xs text-foreground-subtle">
                          {formatNotificationTime(n.timestamp)}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden min-w-0 items-center gap-2 lg:flex">
            <div
              className="max-w-[6.5rem] truncate text-sm font-bold text-foreground xl:max-w-[8rem]"
              title={username || "Team"}
            >
              {username || "Team"}
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted">
              <img
                src={iconSrc}
                alt=""
                className="h-8 w-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement!.textContent = initial;
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              data-tour="nav-logout"
              className="shrink-0 rounded-full bg-danger px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition hover:opacity-90 xl:px-4"
            >
              Logout
            </button>
          </div>

          <button
            type="button"
            onClick={() => void logout()}
            data-tour="nav-logout"
            className="shrink-0 rounded-full bg-danger px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white lg:hidden"
          >
            Logout
          </button>
        </div>
      </div>

      <nav className="flex gap-0.5 overflow-x-auto border-t border-border/40 px-2 py-2 md:hidden">
        <Link to="/home" className={linkClass("/home")}>
          Home
        </Link>
        <Link to="/clarifications" className={linkClass("/clarifications")}>
          Clarifications
        </Link>
        <Link to="/judgments" className={linkClass("/judgments")}>
          Judgments
        </Link>
        <Link to="/scoreboard" className={linkClass("/scoreboard")}>
          Scoreboard
        </Link>
        <Link to="/tutorials" className={linkClass("/tutorials")}>
          Tutorials
        </Link>
      </nav>
    </header>
  );
}

function DesktopNotificationControl({
  state,
  onEnable,
  onDisable,
}: {
  state: DesktopNotificationState;
  onEnable: () => void;
  onDisable: () => void;
}) {
  if (state === "unsupported") return null;

  const enabled = state === "enabled";
  const denied = state === "denied";
  const insecure = state === "insecure";

  return (
    <div className="border-b border-border bg-surface-muted/40 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold text-foreground">
            Desktop alerts
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-foreground-muted">
            {insecure
              ? "Browsers block OS alerts on plain HTTP. Serve this site over HTTPS (or localhost) to enable them. In-app bell and toasts still work."
              : denied
                ? "Blocked by your browser. Enable notifications in site settings."
                : enabled
                  ? "Judgments and replies can appear over other windows when this tab is in the background."
                  : "Get judgments and clarification replies when this tab is in the background."}
          </p>
        </div>
        {!denied && !insecure && (
          <button
            type="button"
            onClick={enabled ? onDisable : onEnable}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
              enabled
                ? "bg-surface-raised text-foreground-muted hover:text-foreground"
                : "bg-brand text-white hover:bg-brand-hover"
            }`}
          >
            {enabled ? "Disable" : "Enable"}
          </button>
        )}
      </div>
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
