import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useContestConnection } from "features/contest-realtime";
import { useContestDashboardContext } from "features/contest-dashboard";
import { HomeStatsRow } from "shared/ui";
import { getTeamName, getUsername } from "shared/auth/authStorage";
import { parseTeamDisplayName, universityForTeam } from "shared/lib/teamDisplayName";
import { findMyTeamRow } from "pages/home/runStats";
import type { ScoreboardProblem, ScoreboardRow } from "shared/api/types";
import { scoreboardCellClasses } from "shared/theme";
import { useScoreboard } from "./useScoreboard";

const PAGE_SIZE = 10;

export default function Scoreboard() {
  const { solved, pending, failed, rank } = useContestDashboardContext();
  const { scoreboard, ready } = useContestConnection();
  const { scoreboardData, lastUpdateRelative, hasData, loadError } =
    useScoreboard(scoreboard);

  const currentTeamName = getTeamName();
  const currentUsername = getUsername();
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [hideZeroSolves, setHideZeroSolves] = useState(false);
  const [universityFilter, setUniversityFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const myTeam = useMemo(
    () => findMyTeamRow(scoreboardData, currentTeamName, currentUsername),
    [scoreboardData, currentTeamName, currentUsername]
  );

  const problems =
    scoreboardData.length > 0 ? scoreboardData[0].problems || [] : [];
  const problemCount = problems.length;

  const universities = useMemo(() => {
    const set = new Set<string>();
    for (const team of scoreboardData) {
      const university = universityForTeam(team);
      if (university) set.add(university);
    }
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [scoreboardData]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const uni = universityFilter.trim().toLowerCase();
    return scoreboardData.filter((team) => {
      if (hideZeroSolves && (team.solved || 0) <= 0) return false;
      const { teamName } = parseTeamDisplayName(team.teamName);
      const university = universityForTeam(team);
      if (uni && university.toLowerCase() !== uni) return false;
      if (!q) return true;
      return (
        teamName.toLowerCase().includes(q) ||
        university.toLowerCase().includes(q) ||
        team.teamName.toLowerCase().includes(q)
      );
    });
  }, [scoreboardData, query, hideZeroSolves, universityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [query, hideZeroSolves, universityFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const showingFrom = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, filtered.length);

  const pageNumbers = useMemo(
    () => buildPageNumbers(page, totalPages),
    [page, totalPages]
  );

  return (
    <>
      <HomeStatsRow solved={solved} pending={pending} failed={failed} />

      <section
        data-tour="scoreboard-panel"
        className="rounded-[1.5rem] bg-surface-raised p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-8"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
              Live Standings
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground-muted">
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon />
                Last updated: {lastUpdateRelative}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 ${
                  ready || hasData ? "text-warning" : "text-foreground-muted"
                }`}
              >
                <SyncIcon />
                {ready || hasData ? "Auto-refresh active" : "Connecting…"}
              </span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative block w-full min-w-0 flex-1 sm:min-w-[14rem]">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted">
                <SearchIcon />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search team or university…"
                className="w-full rounded-full border-0 bg-surface-muted py-2.5 pl-10 pr-4 text-sm text-foreground outline-none ring-0 placeholder:text-foreground-subtle"
              />
            </label>
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-full border-0 px-5 py-2.5 text-sm font-semibold transition sm:w-auto ${
                filterOpen || hideZeroSolves || universityFilter
                  ? "bg-brand-muted text-brand"
                  : "bg-surface-muted text-foreground"
              }`}
            >
              <FilterIcon />
              Filter
            </button>
          </div>
        </div>

        <div
          data-tour="scoreboard-legend"
          className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-surface-muted/80 px-4 py-3 text-xs text-foreground"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted">
            Cell colors
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`inline-block h-4 w-6 rounded ${scoreboardCellClasses.firstSolve}`}
              aria-hidden
            />
            First solve
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`inline-block h-4 w-6 rounded ${scoreboardCellClasses.solved}`}
              aria-hidden
            />
            Solved
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`inline-block h-4 w-6 rounded ${scoreboardCellClasses.pending}`}
              aria-hidden
            />
            Pending
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`inline-block h-4 w-6 rounded ${scoreboardCellClasses.failed}`}
              aria-hidden
            />
            Failed
          </span>
        </div>

        {loadError && !hasData && (
          <p
            className="mt-4 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground"
            role="status"
          >
            {loadError}
          </p>
        )}

        {filterOpen && (
          <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-surface-muted/80 p-4 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={hideZeroSolves}
                onChange={(e) => setHideZeroSolves(e.target.checked)}
                className="h-4 w-4 rounded accent-[var(--color-brand)]"
              />
              Hide teams with 0 solves
            </label>
            <label className="flex min-w-[12rem] flex-1 flex-col gap-1.5 text-sm text-foreground">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted">
                University
              </span>
              <select
                value={universityFilter}
                onChange={(e) => setUniversityFilter(e.target.value)}
                className="rounded-xl border-0 bg-surface-raised px-3 py-2.5 text-sm text-foreground outline-none"
              >
                <option value="">All universities</option>
                {universities.map((uni) => (
                  <option key={uni} value={uni}>
                    {uni}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div
          data-tour="scoreboard-summary"
          className="team-summary mt-6 grid gap-3 sm:grid-cols-3"
        >
          <SummaryCard label="Your Position">
            <div className="text-3xl font-extrabold tabular-nums text-foreground">
              {rank != null ? `#${rank}` : myTeam ? `#${myTeam.rank}` : "—"}
            </div>
          </SummaryCard>
          <SummaryCard label="Solved">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tabular-nums text-foreground">
                {myTeam != null ? myTeam.solved : solved}
              </span>
              <span className="text-sm text-foreground-muted">
                / {problemCount || "—"} Problems
              </span>
            </div>
          </SummaryCard>          <SummaryCard label="Total Teams">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tabular-nums text-foreground">
                {scoreboardData.length}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm text-foreground-muted">
                <span className="h-2 w-2 rounded-full bg-success" />
                Active
              </span>
            </div>
          </SummaryCard>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="scoreboard-table w-full min-w-[36rem] border-collapse text-left text-sm md:min-w-[720px]">
            <thead>
              <tr className="bg-surface-muted/50 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted">
                <th className="px-3 py-3 font-bold">Rank</th>
                <th className="px-3 py-3 font-bold">Team &amp; University</th>
                <th className="px-3 py-3 text-center font-bold">Solved</th>
                <th className="px-3 py-3 text-center font-bold">Penalty</th>
                {problems.map((problem) => (
                  <th
                    key={problem.problemId}
                    className="px-2 py-3 text-center font-bold"
                  >
                    {problem.shortName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4 + problems.length}
                    className="px-4 py-12 text-center text-sm text-foreground-muted"
                  >
                    {scoreboardData.length === 0
                      ? "Waiting for scoreboard…"
                      : "No teams match this search."}
                  </td>
                </tr>
              ) : (
                pageRows.map((team) => (
                  <ScoreboardRowView
                    key={`${team.rank}-${team.teamName}`}
                    team={team}
                    isCurrent={
                      myTeam != null &&
                      team.teamName === myTeam.teamName
                    }                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          data-tour="scoreboard-pagination"
          className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-foreground-muted">
            Showing {showingFrom}-{showingTo} of {filtered.length} teams
          </p>
          <div className="flex max-w-full items-center gap-1.5 overflow-x-auto pb-1">
            <PageButton
              ariaLabel="Previous page"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </PageButton>
            {pageNumbers.map((n, i) =>
              n === "…" ? (
                <span
                  key={`ellipsis-${i}`}
                  className="shrink-0 px-1 text-foreground-muted"
                >
                  …
                </span>
              ) : (
                <PageButton
                  key={n}
                  active={n === page}
                  onClick={() => setPage(n)}
                >
                  {n}
                </PageButton>
              )
            )}
            <PageButton
              ariaLabel="Next page"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              ›
            </PageButton>
          </div>
        </div>
      </section>
    </>
  );
}

function ScoreboardRowView({
  team,
  isCurrent,
}: {
  team: ScoreboardRow;
  isCurrent: boolean;
}) {
  const { teamName } = parseTeamDisplayName(team.teamName);
  const university = universityForTeam(team);

  return (
    <tr
      className={`border-b border-border/25 last:border-b-0 ${
        isCurrent ? "bg-brand-muted/30" : ""
      }`}
    >
      <td className="px-3 py-3.5">
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold tabular-nums ${
            isCurrent
              ? "bg-brand text-white"
              : "bg-surface-muted text-foreground"
          }`}
        >
          {team.rank}
        </span>
      </td>
      <td className="max-w-[10rem] px-3 py-3.5 sm:max-w-[14rem] md:max-w-none">
        <div className="truncate font-bold text-foreground">
          {teamName}
          {isCurrent ? (
            <span className="ml-1 font-semibold text-brand">(You)</span>
          ) : null}
        </div>
        <div className="truncate text-xs text-foreground-muted">
          {university}
        </div>
      </td>
      <td className="px-3 py-3.5 text-center font-semibold tabular-nums text-foreground">
        {team.solved}
      </td>
      <td className="px-3 py-3.5 text-center tabular-nums text-foreground-muted">
        {team.penalty}
      </td>
      {(team.problems || []).map((problem) => (
        <td key={problem.problemId} className="px-2 py-3.5 text-center">
          <ProblemCell problem={problem} />
        </td>
      ))}
    </tr>
  );
}

function ProblemCell({ problem }: { problem: ScoreboardProblem }) {
  if (problem.solved) {
    const tone = problem.firstSolve
      ? scoreboardCellClasses.firstSolve
      : scoreboardCellClasses.solved;
    return (
      <div
        className={`mx-auto flex min-h-10 min-w-10 flex-col items-center justify-center rounded-lg px-1.5 py-1 text-[11px] font-bold leading-tight ${tone}`}
      >
        <span>+{problem.attempts || 1}</span>
        {problem.solutionTime != null && (
          <span className="font-medium opacity-80">{problem.solutionTime}</span>
        )}
      </div>
    );
  }

  if (problem.pending) {
    return (
      <div
        className={`mx-auto flex min-h-10 min-w-10 items-center justify-center rounded-lg px-1.5 py-1 text-[11px] font-bold ${scoreboardCellClasses.pending}`}
      >
        {problem.attempts > 0 ? `?${problem.attempts}` : "?"}
      </div>
    );
  }

  if ((problem.attempts || 0) > 0) {
    return (
      <div
        className={`mx-auto flex min-h-10 min-w-10 items-center justify-center rounded-lg px-1.5 py-1 text-[11px] font-bold ${scoreboardCellClasses.failed}`}
      >
        -{problem.attempts}
      </div>
    );
  }

  return (
    <div
      className={`mx-auto flex min-h-10 min-w-10 items-center justify-center rounded-lg text-[11px] font-bold ${scoreboardCellClasses.empty}`}
    >
      —
    </div>
  );
}

function SummaryCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface-muted/80 px-5 py-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-muted">
        {label}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function PageButton({
  children,
  onClick,
  disabled,
  active,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-30 ${
        active
          ? "bg-brand text-white shadow-sm"
          : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function buildPageNumbers(
  page: number,
  totalPages: number
): Array<number | "…"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  if (page <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (page >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }
  const sorted = [...pages].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const out: Array<number | "…"> = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
    out.push(sorted[i]);
  }
  return out;
}

function ClockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M21 12a9 9 0 0 0-15.5-6.4M3 4v5h5" />
      <path d="M3 12a9 9 0 0 0 15.5 6.4M21 20v-5h-5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
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
