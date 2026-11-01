import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { formatNotificationTime } from "shared/lib/formatNotificationTime";

import { NOTIFICATION_KIND_STYLES } from "./notificationStyles";
import type { ContestNotification } from "./types";

const TOAST_VISIBLE_MS = 7000;
const TOAST_FADE_MS = 400;

function ToastItem({
  notification,
  onDismiss,
}: {
  notification: ContestNotification;
  onDismiss: (id: number) => void;
}) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const styles = NOTIFICATION_KIND_STYLES[notification.kind];

  useEffect(() => {
    const fadeTimer = window.setTimeout(
      () => setVisible(false),
      TOAST_VISIBLE_MS - TOAST_FADE_MS
    );
    const removeTimer = window.setTimeout(
      () => onDismiss(notification.id),
      TOAST_VISIBLE_MS
    );

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, [notification.id, onDismiss]);

  const handleClick = () => {
    onDismiss(notification.id);
    navigate(notification.link);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`pointer-events-auto w-full max-w-sm rounded-xl border border-l-4 bg-surface-raised p-3 text-left shadow-lg transition-opacity duration-300 ${styles.toast} ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        {styles.label}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">
        {notification.message}
      </div>
      <div className="mt-2 text-xs text-foreground-subtle">
        {formatNotificationTime(notification.timestamp)}
      </div>
    </button>
  );
}

type NotificationToastsProps = {
  toasts: ContestNotification[];
  dismissToast: (id: number) => void;
};

export function NotificationToasts({
  toasts,
  dismissToast,
}: NotificationToastsProps) {
  const handleDismiss = useCallback(
    (id: number) => {
      dismissToast(id);
    },
    [dismissToast]
  );

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-3 top-[6.75rem] z-[100] flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:top-4 sm:max-w-sm md:top-4"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((notification) => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
}
