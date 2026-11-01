import type { ReactNode } from "react";

type HomeStatsRowProps = {
  solved: number;
  pending: number;
  failed: number;
  action?: ReactNode;
};

export function HomeStatsRow({
  solved,
  pending,
  failed,
  action,
}: HomeStatsRowProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 min-[480px]:grid-cols-3">
        <StatCard
          label="Accepted"
          value={String(solved)}
          tone="success"
          icon={<CheckIcon />}
        />
        <StatCard
          label="Pending"
          value={String(pending)}
          tone="warning"
          icon={<HourglassIcon />}
        />
        <StatCard
          label="Failed"
          value={String(failed)}
          tone="danger"
          icon={<XIcon />}
        />
      </div>
      {action}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "danger";
  icon: ReactNode;
}) {
  const tones = {
    success: "bg-success-muted text-success",
    warning: "bg-warning-muted text-warning",
    danger: "bg-danger-muted text-danger",
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-raised px-3 py-3 shadow-[0_4px_20px_rgba(15,23,42,0.04)] sm:gap-3.5 sm:px-5 sm:py-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 ${tones[tone]}`}
      >
        {icon}
      </div>
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="text-[1.35rem] font-extrabold leading-none tabular-nums text-foreground sm:text-[1.75rem]">
          {value}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-muted">
          {label}
        </span>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HourglassIcon() {
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
      <path d="M5 2h14M5 22h14M8 2v4l4 4 4-4V2M8 22v-4l4-4 4 4v4" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
