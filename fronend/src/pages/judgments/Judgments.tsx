import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useContestConnection } from "features/contest-realtime";
import type { ContestWsMessage } from "features/contest-realtime";
import { useContestDashboardContext } from "features/contest-dashboard";
import { HomeStatsRow } from "shared/ui";
import {
  JUDGMENT_STATUS_OPTIONS,
  resolveSubmissionStatus,
} from "./mapJudgement";
import { useJudgments, type JudgmentRow } from "./useJudgments";

const PAGE_SIZE = 5;

export default function Judgments() {
  const { solved, pending, failed } = useContestDashboardContext();
  const { submissions, setSubmissions, problems, loadError } = useJudgments();
  const { socket, ready } = useContestConnection();

  const [filterOpen, setFilterOpen] = useState(false);
  const [problemFilter, setProblemFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!socket || !ready) return;

    const handler = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as ContestWsMessage;

        if (msg.type === "RUN_JUDGED") {
          const data = msg.payload;

          setSubmissions((prev) => {
            const updated = prev.map((sub) => {
              const runKey = data.runNumber;
              const matches =
                runKey != null &&
                String(sub.submissionId) === String(runKey);
              if (!matches) return sub;

              return {
                ...sub,
                status: resolveSubmissionStatus({
                  judgement: data.judgement,
                }),
                lang: data.language || sub.lang,
              };
            });

            return updated.sort((a, b) => Number(b.id) - Number(a.id));
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    socket.addEventListener("message", handler);
    return () => socket.removeEventListener("message", handler);
  }, [socket, ready, setSubmissions]);

  const problemOptions = useMemo(() => {
    // Prefer full contest catalog so filters list every problem, not only submitted ones.
    if (problems.length > 0) {
      return [...problems].sort((a, b) => {
        const as = a.shortName || a.name;
        const bs = b.shortName || b.name;
        return as.localeCompare(bs, undefined, { numeric: true });
      });
    }
    const names = new Set<string>();
    for (const s of submissions) names.add(s.problem);
    return [...names]
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ name, shortName: "" }));
  }, [problems, submissions]);

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      if (problemFilter && s.problem !== problemFilter) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      return true;
    });
  }, [submissions, problemFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [problemFilter, statusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const showingFrom = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, filtered.length);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const start = Math.max(1, Math.min(page - 2, totalPages - maxButtons + 1));
    return Array.from({ length: maxButtons }, (_, i) => start + i);
  }, [page, totalPages]);

  return (
    <>
      <HomeStatsRow solved={solved} pending={pending} failed={failed} />

      <section
        data-tour="judgments-panel"
        className="rounded-[1.5rem] bg-surface-raised p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
              Submission Judgments
            </h1>
            <p className="mt-1 text-sm text-foreground-muted">
              View your recent submission results
            </p>
            {loadError && submissions.length === 0 && (
              <p className="mt-2 rounded-xl border border-danger/30 bg-danger-muted px-3 py-2 text-sm text-danger">
                {loadError}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className={`rounded-full inline-flex items-center gap-2 border-0 px-5 py-2.5 text-sm font-semibold transition ${
              filterOpen || problemFilter || statusFilter
                ? "bg-brand-muted text-brand"
                : "bg-surface-muted text-foreground hover:bg-surface-muted/80"
            }`}
          >
            <FilterIcon />
            Filter
          </button>
        </div>

        {filterOpen && (
          <div className="mt-5 grid gap-3 rounded-2xl bg-surface-muted/80 p-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted">
                Problem
              </span>
              <select
                value={problemFilter}
                onChange={(e) => setProblemFilter(e.target.value)}
                className="w-full appearance-none rounded-2xl border-0 bg-surface-raised px-4 py-2.5 text-sm text-foreground outline-none ring-0 focus:border-0 focus:ring-0"
              >
                <option value="">All problems</option>
                {problemOptions.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.shortName ? `${p.shortName} — ${p.name}` : p.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted">
                Status
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none rounded-2xl border-0 bg-surface-raised px-4 py-2.5 text-sm text-foreground outline-none ring-0 focus:border-0 focus:ring-0"
              >
                <option value="">All statuses</option>
                {JUDGMENT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {statusFilterLabel(status)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="mt-6 overflow-x-auto">
          <table className="judgments-table w-full min-w-[44rem] border-collapse text-left text-sm sm:min-w-[860px]">
            <thead>
              <tr className="bg-surface-muted/50 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted">
                <th className="px-4 py-3 font-bold">ID</th>
                <th className="px-4 py-3 font-bold">Submission ID</th>
                <th className="px-4 py-3 font-bold">Problem</th>
                <th className="px-4 py-3 font-bold">Time</th>
                <th className="px-4 py-3 font-bold">Language</th>
                <th className="px-4 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-foreground-muted"
                  >
                    {submissions.length === 0
                      ? "No submissions yet..."
                      : "No submissions match these filters."}
                  </td>
                </tr>
              ) : (
                pageRows.map((sub) => (
                  <JudgmentRowView
                    key={`${sub.submissionId ?? "row"}-${sub.id}`}
                    sub={sub}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground-muted">
            Showing {showingFrom} to {showingTo} of {filtered.length} entries
          </p>

          <div className="flex max-w-full items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground-muted transition hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
            >
              ‹
            </button>
            {pageNumbers.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                  n === page
                    ? "bg-brand text-white shadow-sm"
                    : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              aria-label="Next page"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground-muted transition hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
            >
              ›
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function JudgmentRowView({ sub }: { sub: JudgmentRow }) {
  return (
    <tr className="border-b border-border/25 last:border-b-0">
      <td className="whitespace-nowrap px-4 py-4 font-medium tabular-nums text-foreground-muted">
        #{sub.id}
      </td>
      <td className="whitespace-nowrap px-4 py-4 font-medium tabular-nums text-foreground-muted">
        {sub.submissionId != null ? `#${sub.submissionId}` : "—"}
      </td>
      <td className="px-4 py-4 font-medium text-foreground">
        {sub.problemLabel}
      </td>
      <td className="whitespace-nowrap px-4 py-4 font-mono text-[13px] tabular-nums text-foreground-muted">
        {sub.time}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-foreground-muted">
        {sub.lang}
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={sub.status} />
      </td>
    </tr>
  );
}

function statusFilterLabel(status: string): string {
  return statusDisplayName(status);
}

function statusDisplayName(status: string): string {
  if (status === "Time Limit") return "Time Limit Exceeded";
  return status;
}

function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);
  const label = statusDisplayName(status);
  return (
    <span
      className={`inline-flex max-w-[11rem] items-center gap-1.5 truncate rounded-full border px-2.5 py-1.5 text-xs font-bold sm:max-w-none sm:gap-2 sm:whitespace-nowrap sm:px-3.5 sm:py-2 sm:text-sm ${tone.className}`}
    >
      {tone.icon}
      <span className="truncate">{label}</span>
    </span>
  );
}

function statusTone(status: string): { className: string; icon: ReactNode } {
  switch (status) {
    case "Accepted":
      return {
        className: "border-success/40 bg-success-muted text-success",
        icon: <CheckIcon />,
      };
    case "Wrong Answer":
      return {
        className: "border-danger/40 bg-danger-muted text-danger",
        icon: <XIcon />,
      };
    case "Compilation Error":
      return {
        className: "border-warning/40 bg-warning-muted text-warning",
        icon: <DotIcon />,
      };
    case "Runtime Error":
      return {
        className: "border-danger/50 bg-danger-muted text-danger",
        icon: <DotIcon />,
      };
    case "Time Limit":
      return {
        className: "border-danger/30 bg-danger-muted/70 text-danger",
        icon: <ClockIcon />,
      };
    case "Memory Limit":
    case "Output Limit":
    case "No Output":
    case "Format Error":
    case "System Error":
      return {
        className: "border-danger/30 bg-danger-muted text-danger",
        icon: <DotIcon />,
      };
    case "In Queue":
      return {
        className:
          "border-border bg-surface-muted text-foreground-muted",
        icon: <DotIcon />,
      };
    default:
      return {
        className:
          "border-border bg-surface-muted text-foreground-muted",
        icon: <DotIcon />,
      };
  }
}

function FilterIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DotIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="4.5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
