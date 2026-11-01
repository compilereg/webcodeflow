import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useContestDashboardContext } from "features/contest-dashboard";
import type { ClarificationDto, Problem } from "shared/api/types";
import { formatTime } from "shared/lib/formatTime";
import { getTeamName } from "shared/auth/authStorage";
import { teamNameOnly } from "shared/lib/teamDisplayName";
import { HomeStatsRow } from "shared/ui";
import { questionText } from "./clarificationModel";
import { useClarifications } from "./useClarifications";

export default function Clarifications() {
  const { solved, pending, failed } = useContestDashboardContext();

  const {
    questions,
    announcements,
    genericServerClarifications,
    teamClarifications,
    loadError,
    sendClarification,
  } = useClarifications();

  const [type, setType] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [message, setMessage] = useState("");
  const [sendError, setSendError] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedClarification, setSelectedClarification] =
    useState<ClarificationDto | null>(null);

  const teamName = teamNameOnly(getTeamName()) || "your team";

  const shortNameByDisplay = useMemo(() => {
    const map = new Map<string, string>();
    for (const q of questions) {
      if (q.name) map.set(q.name, q.shortName || q.name);
    }
    return map;
  }, [questions]);

  useEffect(() => {
    if (!selectedClarification) return;
    const all = [
      ...announcements,
      ...genericServerClarifications,
      ...teamClarifications,
    ];
    const id = selectedClarification.ClarificationId;
    const updated =
      (id != null
        ? all.find((c) => c.ClarificationId === id)
        : undefined) ||
      all.find(
        (c) =>
          c.ProblemName === selectedClarification.ProblemName &&
          questionText(c) === questionText(selectedClarification)
      );
    if (!updated) return;
    if (
      updated.Answer !== selectedClarification.Answer ||
      updated.Status !== selectedClarification.Status ||
      updated.ClarificationId !== selectedClarification.ClarificationId
    ) {
      setSelectedClarification(updated);
    }
  }, [
    announcements,
    genericServerClarifications,
    teamClarifications,
    selectedClarification,
  ]);

  const handleTypeChange = (value: string) => {
    setType(value);
    setSelectedQuestion("");
    if (value !== "question" && value !== "generic") {
      setMessage("");
    }
  };

  const handleSend = async () => {
    if (sending) return;
    setSendError("");
    setSending(true);
    try {
      const result = await sendClarification({
        type,
        selectedQuestion,
        message,
      });
      if (result.ok) {
        setMessage("");
        setType("");
        setSelectedQuestion("");
      } else {
        setSendError(result.error);
      }
    } finally {
      setSending(false);
    }
  };

  const canWrite =
    type === "generic" || (type === "question" && Boolean(selectedQuestion));

  const canSend =
    (type === "generic" && Boolean(message.trim())) ||
    (type === "question" &&
      Boolean(selectedQuestion) &&
      Boolean(message.trim()));

  const selectClass =
    "w-full appearance-none rounded-xl border border-border bg-surface-muted py-3.5 pl-4 pr-10 text-sm font-medium text-foreground outline-none transition focus:border-brand focus:bg-surface-raised";

  return (
    <>
      <HomeStatsRow solved={solved} pending={pending} failed={failed} />

      <section
        data-tour="clarifications-form"
        className="rounded-[1.5rem] bg-surface-raised p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-8"
      >
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">
          Write Clarification
        </h2>

        {(loadError || sendError) && (
          <p className="mt-4 rounded-xl border border-danger/30 bg-danger-muted px-3 py-2 text-sm text-danger">
            {sendError || loadError}
          </p>
        )}

        <div className="mt-6 flex w-full flex-col gap-5">
          <label className="block w-full">
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-muted">
              Clarification Type
            </span>
            <div className="relative w-full">
              <select
                value={type}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  handleTypeChange(e.target.value)
                }
                className={selectClass}
              >
                <option value="">Select Type</option>
                <option value="generic">Generic</option>
                <option value="question">Question</option>
              </select>
              <ChevronIcon />
            </div>
          </label>

          {type === "question" && (
            <label className="block w-full">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-muted">
                Select Problem
              </span>
              <div className="relative w-full">
                <select
                  value={selectedQuestion}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setSelectedQuestion(e.target.value)
                  }
                  className={selectClass}
                >
                  <option value="">Select Problem</option>
                  {questions.map((q: Problem) => (
                    <option key={q.name} value={q.name}>
                      {q.name}
                    </option>
                  ))}
                </select>
                <ChevronIcon />
              </div>
            </label>
          )}

          <div className="w-full">
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-muted">
              Your Question
            </span>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end">
              <textarea
                rows={5}
                placeholder={
                  canWrite
                    ? "Type your clarification request here..."
                    : "Select a type and problem first..."
                }
                value={message}
                disabled={!canWrite}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setMessage(e.target.value)
                }
                className={`min-h-[8.5rem] min-w-0 flex-1 resize-y rounded-2xl border-2 border-dashed bg-dropzone px-4 py-3.5 text-sm text-foreground outline-none transition placeholder:text-foreground-subtle disabled:cursor-not-allowed disabled:opacity-50 ${
                  canWrite
                    ? "border-brand/40 focus:border-brand focus:bg-brand-muted/30"
                    : "border-brand/25"
                }`}
              />
              <button
                type="button"
                disabled={!canSend || sending}
                onClick={() => void handleSend()}
                className="w-full shrink-0 rounded-full bg-brand px-8 py-3.5 text-[12px] font-bold uppercase tracking-[0.1em] text-white shadow-sm transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-brand sm:w-auto"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-3">
        <AnnouncementTable
          rows={announcements}
          shortNameByDisplay={shortNameByDisplay}
          onRowClick={setSelectedClarification}
        />

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <ClarificationTable
          tourId="clarifications-general"
          title="General Clarifications"
          subtitle="Your general questions"
          rows={genericServerClarifications}
          shortNameByDisplay={shortNameByDisplay}
          onRowClick={setSelectedClarification}
        />

        <ClarificationTable
          tourId="clarifications-problems"
          title="Your Questions"
          subtitle={`Private to ${teamName}`}
          rows={teamClarifications}
          shortNameByDisplay={shortNameByDisplay}
          onRowClick={setSelectedClarification}
          emptyLabel="No clarifications from your team yet."
        />
        </div>
      </div>

      {selectedClarification && (
        <ClarificationDetailModal
          clarification={selectedClarification}
          shortNameByDisplay={shortNameByDisplay}
          onClose={() => setSelectedClarification(null)}
        />
      )}
    </>
  );
}

const SCROLL_AFTER_ROWS = 8;
/** Approx. header + 8 body rows so overflow scrolls cleanly. */
const TABLE_SCROLL_MAX = "max-h-[28rem]";

function AnnouncementTable({
  rows,
  shortNameByDisplay,
  onRowClick,
}: {
  rows: ClarificationDto[];
  shortNameByDisplay: Map<string, string>;
  onRowClick: (c: ClarificationDto) => void;
}) {
  const scrollable = rows.length > SCROLL_AFTER_ROWS;

  return (
    <section
      data-tour="clarifications-announcements"
      className="flex min-w-0 flex-col overflow-hidden rounded-[1.5rem] bg-surface-raised shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4">
        <h3 className="text-lg font-extrabold tracking-tight text-foreground">
          Announcements
        </h3>
        <span className="text-[11px] font-medium text-foreground-muted">
          Contest-wide updates from the judges
        </span>
      </div>

      <div
        className={`min-w-0 overflow-x-auto ${scrollable ? `overflow-y-auto ${TABLE_SCROLL_MAX}` : ""}`}
      >
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <colgroup>
            <col className="w-[10%]" />
            <col className="w-[15%]" />
            <col className="w-[18%]" />
            <col className="w-[57%]" />
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="bg-brand-muted/50 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted">
              <th className="px-4 py-3 font-bold">ID</th>
              <th className="px-3 py-3 font-bold">Time</th>
              <th className="px-3 py-3 font-bold">Problem</th>
              <th className="px-4 py-3 font-bold">Announcement</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-sm text-foreground-muted"
                >
                  No announcements yet.
                </td>
              </tr>
            ) : (
              rows.map((announcement) => {
                const text =
                  announcement.Answer ||
                  announcement.Question ||
                  announcement.question ||
                  "—";
                return (
                  <tr
                    key={
                      announcement.ClarificationId != null
                        ? `announcement-${announcement.ClarificationId}`
                        : `announcement-${announcement.ProblemName}-${text}`
                    }
                    role="button"
                    tabIndex={0}
                    onClick={() => onRowClick(announcement)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onRowClick(announcement);
                      }
                    }}
                    className="cursor-pointer border-t border-border/25 transition hover:bg-brand-muted/20"
                  >
                    <td className="truncate px-4 py-3.5 font-semibold tabular-nums text-foreground">
                      #{announcement.ClarificationId}
                    </td>
                    <td className="truncate px-3 py-3.5 font-mono text-[12px] tabular-nums text-foreground-muted">
                      {formatTime(announcement.ClarificationTime)}
                    </td>
                    <td className="overflow-hidden px-3 py-3.5">
                      <ProblemBadge
                        problemName={announcement.ProblemName}
                        shortNameByDisplay={shortNameByDisplay}
                      />
                    </td>
                    <td
                      className="px-4 py-3.5 font-medium text-foreground"
                      title={text}
                    >
                      <span className="line-clamp-2">{text}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ClarificationTable({
  tourId,
  title,
  subtitle,
  rows,
  shortNameByDisplay,
  onRowClick,
  emptyLabel = "No clarifications yet.",
}: {
  tourId?: string;
  title: string;
  subtitle: string;
  rows: ClarificationDto[];
  shortNameByDisplay: Map<string, string>;
  onRowClick: (c: ClarificationDto) => void;
  emptyLabel?: string;
}) {
  const scrollable = rows.length > SCROLL_AFTER_ROWS;

  return (
    <section
      data-tour={tourId}
      className="flex min-w-0 flex-col overflow-hidden rounded-[1.5rem] bg-surface-raised shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4">
        <h3 className="text-lg font-extrabold tracking-tight text-foreground">
          {title}
        </h3>
        <span className="text-[11px] font-medium text-foreground-muted">
          {subtitle}
        </span>
      </div>

      <div
        className={`min-w-0 overflow-x-auto ${scrollable ? `overflow-y-auto ${TABLE_SCROLL_MAX}` : ""}`}
      >
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm xl:table-fixed">
          <colgroup className="hidden xl:table-column-group">
            <col className="w-[11%]" />
            <col className="w-[15%]" />
            <col className="w-[18%]" />
            <col className="w-[28%]" />
            <col className="w-[28%]" />
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="bg-surface-muted text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted">
              <th className="px-3 py-3 font-bold">ID</th>
              <th className="px-2 py-3 font-bold">Time</th>
              <th className="px-2 py-3 pr-4 font-bold">Problem</th>
              <th className="px-4 py-3 font-bold">Question</th>
              <th className="px-3 py-3 font-bold">Answer</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-sm text-foreground-muted"
                >
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows.map((c) => {
                const questionText = c.Question || c.question || "—";
                const answerText = c.Answer || "";
                return (
                  <tr
                    key={
                      c.ClarificationId != null
                        ? `id-${c.ClarificationId}`
                        : `pending-${c.ProblemName}-${questionText}`
                    }
                    role="button"
                    tabIndex={0}
                    onClick={() => onRowClick(c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(c);
                      }
                    }}
                    className="cursor-pointer border-t border-border/25 transition hover:bg-surface-muted/50"
                  >
                    <td className="truncate px-3 py-3.5 font-semibold tabular-nums text-foreground">
                      #{c.ClarificationId}
                    </td>
                    <td className="truncate px-2 py-3.5 font-mono text-[12px] tabular-nums text-foreground-muted">
                      {formatTime(c.ClarificationTime)}
                    </td>
                    <td className="overflow-hidden px-2 py-3.5 pr-4">
                      <ProblemBadge
                        problemName={c.ProblemName}
                        shortNameByDisplay={shortNameByDisplay}
                      />
                    </td>
                    <td
                      className="truncate px-4 py-3.5 text-foreground"
                      title={questionText}
                    >
                      {questionText}
                    </td>
                    <td
                      className="truncate px-3 py-3.5 text-foreground-muted"
                      title={answerText || "Waiting…"}
                    >
                      {answerText || (
                        <span className="italic text-foreground-subtle">
                          Waiting…
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ClarificationDetailModal({
  clarification,
  shortNameByDisplay,
  onClose,
}: {
  clarification: ClarificationDto;
  shortNameByDisplay: Map<string, string>;
  onClose: () => void;
}) {
  const questionText =
    clarification.Question || clarification.question || "—";

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clarification-detail-title"
      >
        <div className="w-full max-w-lg rounded-2xl bg-surface-raised p-6 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3
                id="clarification-detail-title"
                className="text-lg font-extrabold text-foreground"
              >
                Clarification #{clarification.ClarificationId}
              </h3>
              <p className="mt-1 font-mono text-sm text-foreground-muted">
                {formatTime(clarification.ClarificationTime)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full flex h-9 w-9 items-center justify-center text-foreground-muted transition hover:bg-surface-muted hover:text-foreground"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted">
                Problem
              </div>
              <ProblemBadge
                problemName={clarification.ProblemName}
                shortNameByDisplay={shortNameByDisplay}
              />
            </div>

            <div>
              <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted">
                Question
              </div>
              <p className="whitespace-pre-wrap break-words rounded-xl bg-surface-muted px-4 py-3 text-sm leading-relaxed text-foreground">
                {questionText}
              </p>
            </div>

            <div>
              <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground-muted">
                Answer
              </div>
              <p className="whitespace-pre-wrap break-words rounded-xl bg-surface-muted px-4 py-3 text-sm leading-relaxed text-foreground">
                {clarification.Answer || (
                  <span className="italic text-foreground-subtle">
                    Waiting for a judge reply…
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-hover"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function ProblemBadge({
  problemName,
  shortNameByDisplay,
}: {
  problemName?: string;
  shortNameByDisplay: Map<string, string>;
}) {
  const name = (problemName || "").trim();
  const isGeneral =
    !name ||
    name.toLowerCase() === "general" ||
    name.toLowerCase() === "generic";

  if (isGeneral) {
    return (
      <span className="inline-flex rounded-md bg-surface-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-foreground-muted ring-1 ring-border/50">
        Generic
      </span>
    );
  }

  const short = (
    shortNameByDisplay.get(name) ||
    (name.length <= 3 ? name : name.charAt(0))
  ).toUpperCase();

  return (
    <span
      className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-brand-muted px-2 text-xs font-extrabold text-brand"
      title={name}
    >
      {short}
    </span>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-muted"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
