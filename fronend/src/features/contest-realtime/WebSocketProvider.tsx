import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { resolveWsUrl, invalidateWsPath } from "./resolveWsUrl";
import { checkSessionWithRetry } from "shared/api/authApi";
import { listSubmitRuns } from "shared/api/runsApi";
import { parseScoreboardResponse } from "shared/api/parseScoreboard";
import {
  clearAuthenticationStorage,
  getTeamName,
  isLoggedInLocally,
  notifyAuthChanged,
} from "shared/auth/authStorage";
import { setPendingAuthError } from "shared/auth/pendingAuthError";
import {
  remainingRateLimitMs,
  setRateLimitBlock,
} from "shared/auth/rateLimitBlock";
import type {
  ContestNotification,
  ContestWsMessage,
  ScoreboardRow,
} from "./types";
import { NotificationToasts } from "./NotificationToasts";
import { showDesktopNotification } from "./desktopNotifications";
import { classifyWsClose } from "./wsClose";

type ConnectionValue = {
  socket: WebSocket | null;
  ready: boolean;
  scoreboard: ScoreboardRow[];
};

type ClockValue = {
  timeLeft: number;
  isRunning: boolean;
  hasInitialData: boolean;
  elapsedSeconds: number;
  contestLengthSeconds: number;
};

type NotificationsValue = {
  notifications: ContestNotification[];
  toasts: ContestNotification[];
  hasUnread: boolean;
  setHasUnread: React.Dispatch<React.SetStateAction<boolean>>;
  setNotifications: React.Dispatch<
    React.SetStateAction<ContestNotification[]>
  >;
  dismissToast: (id: number) => void;
};

const ConnectionContext = createContext<ConnectionValue | null>(null);
const ClockContext = createContext<ClockValue | null>(null);
const NotificationsContext = createContext<NotificationsValue | null>(null);

/**
 * Forced logout under HashRouter must go to "/" (login), not "/login".
 * Exported for tests.
 */
export function resolveForcedLogoutPath(): string {
  return "/";
}

export function handleLogoutRequired(code?: string): void {
  if (code) setPendingAuthError(code);
  clearAuthenticationStorage();
  notifyAuthChanged();
  window.location.hash = "#/";
}

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const reconnectAttemptsRef = useRef(0);
  const skipReconnectRef = useRef(false);
  const openedAtRef = useRef(0);
  /**
   * Generation counter for race guards. Incremented on cleanup and logout
   * to cancel in-flight async connection attempts.
   */
  const connectGenRef = useRef(0);
  /**
   * Prevents overlapping connection attempts while resolveWsUrl is pending.
   */
  const connectingRef = useRef(false);

  const [scoreboard, setScoreboard] = useState<ScoreboardRow[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [contestLengthSeconds, setContestLengthSeconds] = useState(0);
  const [ready, setReady] = useState(false);
  const [hasInitialData, setHasInitialData] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(isLoggedInLocally());
  const [notifications, setNotifications] = useState<ContestNotification[]>(
    []
  );
  const [toasts, setToasts] = useState<ContestNotification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const notificationIdRef = useRef(0);
  /** Wall-clock anchors so local ticks don't accumulate setInterval drift. */
  const clockSyncRef = useRef({
    syncedAtMs: 0,
    remainingAtSync: 0,
    elapsedAtSync: 0,
  });

  const applyClockFromServer = useCallback(
    (payload: {
      remainingSeconds?: number;
      elapsedSeconds?: number;
      contestLengthSeconds?: number;
      running?: boolean;
    }) => {
      const remaining = Number(payload.remainingSeconds || 0);
      const elapsed = Number(payload.elapsedSeconds || 0);
      clockSyncRef.current = {
        syncedAtMs: Date.now(),
        remainingAtSync: remaining,
        elapsedAtSync: elapsed,
      };
      setTimeLeft(remaining);
      setElapsedSeconds(elapsed);
      setIsRunning(Boolean(payload.running));
      if (payload.contestLengthSeconds != null) {
        setContestLengthSeconds(Number(payload.contestLengthSeconds || 0));
      }
      setHasInitialData(true);
    },
    []
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushNotification = useCallback(
    (notif: Omit<ContestNotification, "id" | "timestamp"> & {
      id?: number;
      timestamp?: number;
    }) => {
      notificationIdRef.current += 1;
      const full: ContestNotification = {
        id: notif.id ?? Date.now() + notificationIdRef.current,
        message: notif.message,
        link: notif.link,
        kind: notif.kind,
        timestamp: notif.timestamp ?? Date.now(),
      };

      setNotifications((prev) => [full, ...prev].slice(0, 20));
      setToasts((prev) => [...prev, full].slice(-4));
      setHasUnread(true);
      void showDesktopNotification(full);
    },
    []
  );

  useEffect(() => {
    const sync = () => setIsLoggedIn(isLoggedInLocally());
    window.addEventListener("authChanged", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("authChanged", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    const connectSocket = async () => {
      if (!isLoggedIn) return;
      if (socketRef.current) return;
      if (connectingRef.current) return;

      if (remainingRateLimitMs() > 0) {
        skipReconnectRef.current = true;
        setIsLoggedIn(false);
        handleLogoutRequired("AUTH_WS_RATE_LIMIT");
        return;
      }

      // Capture generation before async work
      const gen = connectGenRef.current;
      connectingRef.current = true;

      let wsUrl: string;
      try {
        wsUrl = await resolveWsUrl();
      } catch {
        connectingRef.current = false;
        return;
      }

      connectingRef.current = false;

      // Race guard: abort if generation changed (cleanup/logout occurred)
      // or if another socket was created, or if user logged out
      if (
        connectGenRef.current !== gen ||
        socketRef.current !== null ||
        !isLoggedIn
      ) {
        if (import.meta.env.DEV) {
          console.log("WS connection aborted: state changed during URL resolution");
        }
        return;
      }

      if (!wsUrl) {
        console.error("WebSocket URL could not be resolved");
        return;
      }

      if (import.meta.env.DEV) {
        console.log("Connecting WebSocket to:", wsUrl);
      }
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;
      setSocket(ws);
      openedAtRef.current = 0;

      ws.onopen = () => {
        if (import.meta.env.DEV) {
          console.log("WS Connected");
        }
        openedAtRef.current = Date.now();
        reconnectAttemptsRef.current = 0;
        setReady(true);
        ws.send(
          JSON.stringify({
            type: "JOIN",
            user: getTeamName(),
            requestState: true,
            time: Date.now(),
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as ContestWsMessage;
          if (import.meta.env.DEV) {
            console.log("WS RECEIVED:", msg);
          }

          switch (msg.type) {
            case "CLOCK_UPDATE": {
              applyClockFromServer(msg.payload || {});
              break;
            }
            case "SCOREBOARD_UPDATED": {
              const rows = parseScoreboardResponse(msg.payload?.rows ?? msg.payload);
              if (rows.length > 0) {
                setScoreboard(rows);
              }
              // Rank changes with standings — refresh getRank, do not poll.
              window.dispatchEvent(new Event("contest-rank-invalidate"));
              // Scoreboard page listens and refetches REST only if needed.
              window.dispatchEvent(new Event("contest-scoreboard-invalidate"));
              break;
            }
            case "standings": {
              // Legacy signal: dirty standings without row payload.
              window.dispatchEvent(new Event("contest-rank-invalidate"));
              window.dispatchEvent(new Event("contest-scoreboard-invalidate"));
              break;
            }
            case "RUN_JUDGED":
            case "RUN_UPDATED": {
              window.dispatchEvent(new Event("contest-runs-invalidate"));
              if (msg.type === "RUN_JUDGED") {
                const runNumber = msg.payload?.runNumber;
                if (runNumber != null) {
                  // Defense in depth for older APIs that broadcast private
                  // RUN_JUDGED events: notify only if this team's run exists.
                  void listSubmitRuns()
                    .then((runs) => {
                      const ownsRun = runs.some(
                        (run) =>
                          Number(run.runNumber ?? run.id) === Number(runNumber)
                      );
                      if (!ownsRun) return;
                      pushNotification({
                        message: `Submission #${runNumber} judged`,
                        link: "/judgments",
                        kind: "judgment",
                      });
                    })
                    .catch((error) => {
                      console.error("Unable to verify judged submission:", error);
                    });
                }
              }
              break;
            }
            case "CLARIFICATION_ANSWERED":
            case "CLARIFICATION_UPDATED":
            case "CLARIFICATION_UPDATE":
            case "NEW_CLARIFICATION":
            case "JUDGE_REPLY": {
              const payload = msg.payload;
              const isAnnouncement = payload?.broadcast === true;
              const announcementText = (
                payload?.answer ||
                payload?.question ||
                "New contest announcement"
              ).trim();
              const clarificationMessage = isAnnouncement
                ? announcementText
                : msg.type === "CLARIFICATION_ANSWERED"
                  ? "Clarification answered"
                  : msg.type === "JUDGE_REPLY"
                    ? "Judge replied to your clarification"
                    : "New clarification update";
              pushNotification({
                message: clarificationMessage,
                link: "/clarifications",
                kind: isAnnouncement ? "announcement" : "clarification",
              });
              window.dispatchEvent(
                new CustomEvent("contest-clarifications-invalidate", {
                  detail: payload ?? null,
                })
              );
              break;
            }
            case "LOGOUT_REQUIRED": {
              if (import.meta.env.DEV) {
                console.log("Forced logout:", msg.payload);
              }
              skipReconnectRef.current = true;
              setIsLoggedIn(false);
              if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
                setSocket(null);
              }
              handleLogoutRequired("AUTH_ADMIN_LOGOFF");
              break;
            }
            default:
              break;
          }
        } catch (err) {
          console.error("WS Parse Error:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("WS Error:", err);
      };

      ws.onclose = (event) => {
        if (import.meta.env.DEV) {
          console.log("WS Closed:", event.code, event.reason);
        }
        // Ignore closes from a previous socket after Strict Mode remount / reconnect.
        if (socketRef.current !== ws) {
          return;
        }

        // If the socket never opened (e.g., 403 on handshake due to wrong path),
        // invalidate the cached WS path so the next attempt fetches a fresh one.
        if (openedAtRef.current === 0) {
          if (import.meta.env.DEV) {
            console.log("WS never opened, invalidating cached path");
          }
          invalidateWsPath();
        }

        socketRef.current = null;
        setSocket(null);
        setReady(false);
        setHasInitialData(false);

        if (skipReconnectRef.current) {
          skipReconnectRef.current = false;
          return;
        }

        if (!isLoggedIn) return;

        const diedImmediately =
          openedAtRef.current > 0 && Date.now() - openedAtRef.current < 2000;
        const closeKind = classifyWsClose(event.code, event.reason || "", {
          diedImmediately,
          reconnectAttempts: reconnectAttemptsRef.current,
        });

        if (closeKind === "admin-logout") {
          skipReconnectRef.current = true;
          setIsLoggedIn(false);
          handleLogoutRequired("AUTH_ADMIN_LOGOFF");
          return;
        }

        if (closeKind === "rate-limit") {
          skipReconnectRef.current = true;
          setIsLoggedIn(false);
          setRateLimitBlock("ws");
          handleLogoutRequired("AUTH_WS_RATE_LIMIT");
          return;
        }

        if (closeKind === "auth") {
          // Session was removed (admin logoff). Do not sit on /home with a dead socket.
          skipReconnectRef.current = true;
          setIsLoggedIn(false);
          handleLogoutRequired("AUTH_ADMIN_LOGOFF");
          return;
        }

        const delay = Math.min(
          10000,
          1000 * Math.pow(2, reconnectAttemptsRef.current)
        );
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(() => {
          void checkSessionWithRetry({ attempts: 2, delayMs: 300 }).then(
            (session) => {
              if (session.unreachable) {
                // Keep trying the socket; do not treat API blips as logout.
                void connectSocket();
                return;
              }
              if (!session.authenticated) {
                skipReconnectRef.current = true;
                setIsLoggedIn(false);
                handleLogoutRequired("AUTH_ADMIN_LOGOFF");
                return;
              }
              void connectSocket();
            }
          );
        }, delay);
      };
    };

    if (!isLoggedIn) {
      // Bump generation to cancel any in-flight connection
      connectGenRef.current += 1;
      connectingRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setSocket(null);
      }
      setReady(false);
      setHasInitialData(false);
      setTimeLeft(0);
      setIsRunning(false);
      setElapsedSeconds(0);
      setContestLengthSeconds(0);
      setScoreboard([]);
      clockSyncRef.current = {
        syncedAtMs: 0,
        remainingAtSync: 0,
        elapsedAtSync: 0,
      };
      return;
    }

    void connectSocket();

    return () => {
      // Bump generation to cancel any in-flight connection
      connectGenRef.current += 1;
      connectingRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      // Prevent onclose from scheduling reconnect while React tears down /
      // Strict Mode remounts; close the live socket so we do not leak twins.
      skipReconnectRef.current = true;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setSocket(null);
      }
      setReady(false);
    };
  }, [isLoggedIn, pushNotification, applyClockFromServer]);

  useEffect(() => {
    if (!isRunning || !hasInitialData) return;

    const tick = () => {
      const { syncedAtMs, remainingAtSync, elapsedAtSync } =
        clockSyncRef.current;
      if (!syncedAtMs) return;
      const elapsedSinceSync = Math.floor((Date.now() - syncedAtMs) / 1000);
      setTimeLeft(Math.max(0, remainingAtSync - elapsedSinceSync));
      setElapsedSeconds(elapsedAtSync + elapsedSinceSync);
    };

    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [isRunning, hasInitialData]);

  // Split contexts so the 1s clock tick does not re-render socket/notification consumers.
  const connectionValue = useMemo(
    () => ({ socket, ready, scoreboard }),
    [socket, ready, scoreboard]
  );

  const clockValue = useMemo(
    () => ({
      timeLeft,
      isRunning,
      hasInitialData,
      elapsedSeconds,
      contestLengthSeconds,
    }),
    [timeLeft, isRunning, hasInitialData, elapsedSeconds, contestLengthSeconds]
  );

  const notificationsValue = useMemo(
    () => ({
      notifications,
      toasts,
      hasUnread,
      setHasUnread,
      setNotifications,
      dismissToast,
    }),
    [notifications, toasts, hasUnread, dismissToast]
  );

  return (
    <ConnectionContext.Provider value={connectionValue}>
      <ClockContext.Provider value={clockValue}>
        <NotificationsContext.Provider value={notificationsValue}>
          {children}
          <NotificationToasts toasts={toasts} dismissToast={dismissToast} />
        </NotificationsContext.Provider>
      </ClockContext.Provider>
    </ConnectionContext.Provider>
  );
}

function requireCtx<T>(ctx: T | null, name: string): T {
  if (!ctx) {
    throw new Error(`${name} must be used within WebSocketProvider`);
  }
  return ctx;
}

export function useContestConnection(): ConnectionValue {
  return requireCtx(useContext(ConnectionContext), "useContestConnection");
}

export function useContestClock(): ClockValue {
  return requireCtx(useContext(ClockContext), "useContestClock");
}

export function useContestNotifications(): NotificationsValue {
  return requireCtx(
    useContext(NotificationsContext),
    "useContestNotifications"
  );
}

/**
 * Combined hook for legacy call sites / tests that need everything.
 * Prefer the split hooks above to avoid unnecessary re-renders.
 */
export function useWebSocket() {
  return {
    ...useContestConnection(),
    ...useContestClock(),
    ...useContestNotifications(),
  };
}

/** Test helper: inject contest realtime values without opening a WebSocket. */
export function ContestRealtimeStub({
  value,
  children,
}: {
  value: Partial<ConnectionValue & ClockValue & NotificationsValue>;
  children: ReactNode;
}) {
  const connectionValue: ConnectionValue = {
    socket: value.socket ?? null,
    ready: value.ready ?? false,
    scoreboard: value.scoreboard ?? [],
  };
  const clockValue: ClockValue = {
    timeLeft: value.timeLeft ?? 0,
    isRunning: value.isRunning ?? false,
    hasInitialData: value.hasInitialData ?? false,
    elapsedSeconds: value.elapsedSeconds ?? 0,
    contestLengthSeconds: value.contestLengthSeconds ?? 0,
  };
  const notificationsValue: NotificationsValue = {
    notifications: value.notifications ?? [],
    toasts: value.toasts ?? [],
    hasUnread: value.hasUnread ?? false,
    setHasUnread: value.setHasUnread ?? (() => {}),
    setNotifications: value.setNotifications ?? (() => {}),
    dismissToast: value.dismissToast ?? (() => {}),
  };

  return (
    <ConnectionContext.Provider value={connectionValue}>
      <ClockContext.Provider value={clockValue}>
        <NotificationsContext.Provider value={notificationsValue}>
          {children}
        </NotificationsContext.Provider>
      </ClockContext.Provider>
    </ConnectionContext.Provider>
  );
}
