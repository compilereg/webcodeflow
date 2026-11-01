import { useEffect, useState } from "react";

import {
  enableDesktopNotifications,
  markDesktopNotificationPromptSeen,
  shouldShowDesktopNotificationPrompt,
} from "./desktopNotifications";

/**
 * Soft prompt after login. The browser OS dialog only opens when the team
 * clicks Allow — silent permission requests are blocked by modern browsers.
 */
export function DesktopNotificationPrompt() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!shouldShowDesktopNotificationPrompt()) return;

    // Let Home/tour settle first so this is the intentional post-login ask.
    const timer = window.setTimeout(() => {
      if (shouldShowDesktopNotificationPrompt()) setOpen(true);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, []);

  if (!open) return null;

  const dismiss = () => {
    markDesktopNotificationPromptSeen();
    setOpen(false);
  };

  const allow = async () => {
    await enableDesktopNotifications();
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[90] border-0 bg-black/50"
        aria-label="Dismiss desktop alerts prompt"
        onClick={dismiss}
      />
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="desktop-alerts-title"
      >
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface-raised p-6 shadow-xl">
          <h2
            id="desktop-alerts-title"
            className="text-lg font-extrabold tracking-tight text-foreground"
          >
            Stay notified during the contest
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
            Allow desktop alerts so judgments and clarification replies can
            appear over other windows when this tab is in the background. Your
            browser will ask once — we cannot send OS alerts without that
            permission.
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={dismiss}
              className="rounded-full bg-surface-muted px-5 py-2.5 text-sm font-bold text-foreground-muted transition hover:text-foreground"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={() => void allow()}
              className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-hover"
            >
              Allow alerts
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
