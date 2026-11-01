import type { NotificationKind } from "./types";

type NotificationStyle = {
  toast: string;
  cardAccent: string;
  label: string;
};

export const NOTIFICATION_KIND_STYLES: Record<
  NotificationKind,
  NotificationStyle
> = {
  judgment: {
    toast: "border-l-brand bg-brand-muted border-border",
    cardAccent: "border-l-brand",
    label: "Judgment",
  },
  clarification: {
    toast: "border-l-warning bg-warning-muted border-border",
    cardAccent: "border-l-warning",
    label: "Clarification",
  },
  announcement: {
    toast: "border-l-brand bg-brand-muted border-border",
    cardAccent: "border-l-brand",
    label: "Announcement",
  },
  session: {
    toast: "border-l-danger bg-danger-muted border-border",
    cardAccent: "border-l-danger",
    label: "Session",
  },
};
