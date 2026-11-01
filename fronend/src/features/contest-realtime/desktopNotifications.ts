import { getActiveContestIcon } from "features/contest-brand";
import { APP_NAME } from "shared/config/brand";
import { getUsername } from "shared/auth/authStorage";

import type { ContestNotification } from "./types";

const ENABLED_KEY = "wcf:desktopNotificationsEnabled";
const WORKER_URL = "/notification-sw.js";

export type DesktopNotificationState =
  | "unsupported"
  /** Page is not a secure context (plain HTTP). Browsers block OS alerts here. */
  | "insecure"
  | "default"
  | "enabled"
  | "disabled"
  | "denied";

function hasNotificationApi(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

function hasServiceWorker(): boolean {
  return typeof navigator !== "undefined" && "serviceWorker" in navigator;
}

/** HTTPS, localhost, or 127.0.0.1 — required by Chrome/Firefox for OS notifications. */
function isSecureEnough(): boolean {
  return typeof window !== "undefined" && window.isSecureContext === true;
}

function promptSeenKey(): string {
  const user = getUsername() || "anonymous";
  return `wcf:desktopNotificationsPrompted:${user}`;
}

export function getDesktopNotificationState(): DesktopNotificationState {
  if (!hasNotificationApi()) return "unsupported";
  // Prefer this over "denied" — Chrome often reports denied on plain HTTP.
  if (!isSecureEnough()) return "insecure";
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission === "default") return "default";
  return localStorage.getItem(ENABLED_KEY) === "true"
    ? "enabled"
    : "disabled";
}

/**
 * Soft prompt after first login. Browsers still require a click before the
 * native OS permission dialog — calling requestPermission() on page load is
 * blocked by Chrome/Firefox/Safari.
 *
 * Does not show on plain HTTP: OS notification APIs require a secure context.
 */
export function shouldShowDesktopNotificationPrompt(): boolean {
  if (!hasNotificationApi() || !isSecureEnough()) return false;
  if (Notification.permission !== "default") return false;
  return localStorage.getItem(promptSeenKey()) !== "true";
}

export function markDesktopNotificationPromptSeen(): void {
  localStorage.setItem(promptSeenKey(), "true");
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!hasServiceWorker()) return null;
  const existing = await navigator.serviceWorker.getRegistration();
  return existing || navigator.serviceWorker.register(WORKER_URL);
}

/**
 * Call only from a click handler. Browsers require a user gesture before
 * showing their native permission prompt.
 *
 * Service Worker is optional: when unavailable (or registration fails), we
 * still enable alerts via `new Notification()` on secure contexts.
 */
export async function enableDesktopNotifications(): Promise<DesktopNotificationState> {
  if (!hasNotificationApi()) return "unsupported";
  if (!isSecureEnough()) return "insecure";

  markDesktopNotificationPromptSeen();

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;

  if (permission !== "granted") {
    localStorage.removeItem(ENABLED_KEY);
    return permission === "denied" ? "denied" : "default";
  }

  try {
    await getRegistration();
  } catch (error) {
    // SW helps background delivery; Notification() still works without it.
    console.warn("Notification service worker unavailable; using Notification():", error);
  }

  localStorage.setItem(ENABLED_KEY, "true");
  return "enabled";
}

export function disableDesktopNotifications(): DesktopNotificationState {
  localStorage.removeItem(ENABLED_KEY);
  return getDesktopNotificationState();
}

export async function showDesktopNotification(
  notification: ContestNotification
): Promise<void> {
  if (getDesktopNotificationState() !== "enabled") return;

  // Keep the in-app toast while the team is actively looking at this tab.
  if (document.visibilityState === "visible" && document.hasFocus()) return;

  const brandIcon = getActiveContestIcon();
  const tag = `${notification.kind}-${notification.id}`;
  const options: NotificationOptions = {
    body: notification.message,
    icon: brandIcon,
    badge: brandIcon,
    tag,
  };

  try {
    const registration = await getRegistration();
    if (registration) {
      const appUrl = new URL(window.location.href);
      appUrl.hash = `#${notification.link}`;
      await registration.showNotification(APP_NAME, {
        ...options,
        data: { url: appUrl.toString() },
      });
      return;
    }

    const n = new Notification(APP_NAME, options);
    n.onclick = () => {
      window.focus();
      window.location.hash = `#${notification.link}`;
      n.close();
    };
  } catch (error) {
    console.error("Unable to show desktop notification:", error);
  }
}
