import { useContestAssets } from "features/contest-brand";
import { timeParts } from "shared/lib/formatTime";
import { parseTeamDisplayName } from "shared/lib/teamDisplayName";
import { SidebarDisplayName } from "./SidebarDisplayName";

type ContestSidebarProps = {
  displayName: string | null;
  username?: string | null;
  rank: number | null;
  standingsIssue?: string | null;
  timeLeft: number;
  hasInitialData: boolean;
  progressRatio: number | null;
};

export function ContestSidebar({
  displayName,
  username,
  rank,
  standingsIssue = null,
  timeLeft,
  hasInitialData,
  progressRatio,
}: ContestSidebarProps) {
  const { logoSrc, contestTitle } = useContestAssets();
  const { h, m, sec } = timeParts(timeLeft);
  const { teamName, university } = parseTeamDisplayName(displayName);
  const shownName = teamName || username || "Team";
  const expired = timeLeft <= 0 && hasInitialData;
  const progressPct =
    progressRatio == null ? null : Math.round(progressRatio * 100);

  return (
    <aside
      data-tour="home-sidebar"
      className="flex h-full min-h-0 flex-col rounded-[1.5rem] bg-surface-raised p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-6 lg:min-h-[28rem]"
    >
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-foreground-muted">
        <BuildingIcon />
        <span className="truncate" title={university}>
          {university}
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-3 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between">
        <SidebarDisplayName name={shownName} />
        <div className="w-fit shrink-0 rounded-xl bg-brand-muted px-3.5 py-2.5 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">
            Rank
          </div>
          <div className="text-[1.35rem] font-extrabold leading-none text-brand">
            {rank != null ? `#${rank}` : "—"}
          </div>
        </div>
      </div>

      {standingsIssue && (
        <p
          className="mt-3 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-[11px] leading-snug text-foreground"
          role="status"
        >
          {standingsIssue}
        </p>
      )}

      <div data-tour="home-clock" className="mt-9">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-foreground-muted">
          Time Remaining
        </div>
        {hasInitialData ? (
          <div className="flex items-center gap-1.5">
            <TimeCell value={h} label="Hrs" expired={expired} />
            <span className="pb-4 text-xl font-bold text-foreground-subtle">
              :
            </span>
            <TimeCell value={m} label="Min" expired={expired} />
            <span className="pb-4 text-xl font-bold text-foreground-subtle">
              :
            </span>
            <TimeCell value={sec} label="Sec" expired={expired} />
          </div>
        ) : (
          <div className="rounded-xl bg-surface-muted px-3 py-5 text-center text-sm text-foreground-muted">
            Syncing clock…
          </div>
        )}

        {progressPct != null && (
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-progress-track">
            <div
              className="h-full rounded-full bg-progress-fill transition-[width] duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-1 items-center justify-center pt-8">
        <img
          src={logoSrc}
          alt={contestTitle || ""}
          className="h-auto w-full max-w-[13.5rem] object-contain opacity-95"
        />
      </div>
    </aside>
  );
}

function TimeCell({
  value,
  label,
  expired,
}: {
  value: string;
  label: string;
  expired: boolean;
}) {
  return (
    <div className="flex-1 rounded-xl bg-surface-muted px-2 py-3.5 text-center">
      <div
        className={`font-mono text-[1.7rem] font-bold tabular-nums leading-none ${
          expired ? "text-danger" : "text-foreground"
        }`}
      >
        {value}
      </div>
      <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground-muted">
        {label}
      </div>
    </div>
  );
}

function BuildingIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}
