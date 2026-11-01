import type { RunDto } from "shared/api/types";

export type JudgmentStatus =
  | "Accepted"
  | "Wrong Answer"
  | "Compilation Error"
  | "Runtime Error"
  | "Time Limit"
  | "Memory Limit"
  | "No Output"
  | "Output Limit"
  | "Format Error"
  | "System Error"
  | "In Queue";

export type JudgmentAcronym =
  | "AC"
  | "CE"
  | "RTE"
  | "TLE"
  | "WA"
  | "MLE"
  | "NO"
  | "OLE";

const STATUS_ACRONYMS: Partial<
  Record<Exclude<JudgmentStatus, "In Queue">, JudgmentAcronym>
> = {
  Accepted: "AC",
  "Compilation Error": "CE",
  "Runtime Error": "RTE",
  "Time Limit": "TLE",
  "Wrong Answer": "WA",
  "Memory Limit": "MLE",
  "No Output": "NO",
  "Output Limit": "OLE",
};

function normalizeJudgementRaw(judgement: string): string {
  return judgement.trim().toLowerCase().replace(/\s+/g, " ");
}

function isPendingJudgement(judgement: string): boolean {
  const j = normalizeJudgementRaw(judgement);
  return j === "new" || j === "in queue" || j === "pending";
}

/** Map PC² / wwfapi judgement strings to canonical display status. */
export function mapJudgement(
  judgement: string | null | undefined
): JudgmentStatus {
  if (!judgement?.trim()) return "In Queue";

  const j = normalizeJudgementRaw(judgement);

  if (j === "yes" || j === "correct" || j === "accepted" || j === "ac") {
    return "Accepted";
  }

  if (j === "compiler error" || j.includes("compilation") || j === "ce") {
    return "Compilation Error";
  }

  if (
    j === "run error" ||
    j.includes("run-time") ||
    j.includes("runtime") ||
    j === "rte"
  ) {
    return "Runtime Error";
  }

  if (
    j === "timelimit" ||
    j.includes("time limit") ||
    j === "tle"
  ) {
    return "Time Limit";
  }

  if (
    j === "memorylimit" ||
    j.includes("memory limit") ||
    j === "mle"
  ) {
    return "Memory Limit";
  }

  if (j === "no output") {
    return "No Output";
  }

  if (
    j === "output limit" ||
    j.includes("excessive output") ||
    j === "ole"
  ) {
    return "Output Limit";
  }

  if (j.includes("format")) {
    return "Format Error";
  }

  if (
    j.includes("contact staff") ||
    j === "other" ||
    j.includes("system")
  ) {
    return "System Error";
  }

  if (
    j === "wrong answer" ||
    j.includes("wrong answer") ||
    j === "incomplete output" ||
    j === "undetermined" ||
    j === "wa"
  ) {
    return "Wrong Answer";
  }

  if (isPendingJudgement(j)) {
    return "In Queue";
  }

  // Judged but unrecognized PC² text — never keep as pending
  if (j.startsWith("no") || j.includes("error") || j.includes("limit")) {
    return "System Error";
  }

  return "In Queue";
}

export function getJudgmentAcronym(
  status: string
): JudgmentAcronym | null {
  return STATUS_ACRONYMS[status as Exclude<JudgmentStatus, "In Queue">] ?? null;
}

export function isKnownJudgement(
  judgement: string | null | undefined
): boolean {
  if (!judgement?.trim()) return false;
  return mapJudgement(judgement) !== "In Queue" || isPendingJudgement(judgement);
}

/** Resolve a run's display status from judgement, status, and solved flag. */
export function resolveSubmissionStatus(
  run: Pick<
    RunDto,
    "judgement" | "status" | "solved" | "finalJudged" | "preliminaryJudged"
  >
): JudgmentStatus {
  if (run.solved === true) return "Accepted";

  for (const raw of [run.judgement, run.status]) {
    if (!raw?.trim()) continue;
    const mapped = mapJudgement(raw);
    if (mapped !== "In Queue" || isPendingJudgement(raw)) {
      return mapped;
    }
  }

  if (run.finalJudged || run.preliminaryJudged) {
    return "System Error";
  }

  return "In Queue";
}

export const JUDGMENT_STATUS_OPTIONS: JudgmentStatus[] = [
  "Accepted",
  "Wrong Answer",
  "Compilation Error",
  "Runtime Error",
  "Time Limit",
  "Memory Limit",
  "No Output",
  "Output Limit",
  "Format Error",
  "System Error",
  "In Queue",
];
