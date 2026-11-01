/** Raw problem DTO from wwfapi (field typo is intentional on the backend). */
export type ProblemDtoRaw = {
  name: string;
  alphabte?: string;
  shortName?: string;
  isDeleted?: boolean;
};

/** Normalized problem used by the UI. */
export type Problem = {
  name: string;
  shortName: string;
  isDeleted: boolean;
};

export type Language = {
  languageName: string;
  title?: string;
};

export type SessionResponse = {
  authenticated: boolean;
  /** True when /session could not be reached (timeout/network). Not a logout. */
  unreachable?: boolean;
  message?: string;
  username?: string;
  displayName?: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  csrfToken?: string;
  username?: string;
  token?: string;
  displayName?: string;
  error?: string;
  message?: string;
};

/** GET /api/main/contestinfo */
export type ContestInfoResponse = {
  contestTitle?: string;
};

/** GET /api/main/getwspath */
export type WsPathResponse = {
  socketPath?: string | null;
};

export type SubmitRunRequest = {
  problemName: string;
  languageName: string;
  mainFile: { fileName: string; fileContentBase64: string };
  additionalFiles: { fileName: string; fileContentBase64: string }[];
};

export type SubmitRunResponse = {
  status?: string;
  message?: string;
  error?: string;
  runNumber?: number;
};

/** Clarification list item — backend uses PascalCase fields. */
export type ClarificationDto = {
  teamname?: string;
  ClarificationId?: number;
  ClarificationTime?: number;
  Status?: string;
  ProblemName?: string;
  Question?: string;
  Answer?: string;
  Site?: string;
  question?: string;
};

export type SubmitClarificationRequest = {
  ProblemName: string;
  Question: string;
};

export type RunDto = {
  siteNumber?: number;
  runNumber?: number;
  id?: number;
  problem?: string;
  problemName?: string;
  language?: string;
  languageName?: string;
  judgement?: string;
  status?: string;
  submissionTime?: number;
  finalJudged?: boolean;
  preliminaryJudged?: boolean;
  solved?: boolean;
  deleted?: boolean;
};

export type ScoreboardProblem = {
  problemId: number;
  problemName?: string;
  shortName: string;
  solved: boolean;
  /** Earliest accepted solve for this problem across all teams. */
  firstSolve?: boolean;
  /** Unjudged submission(s) and not yet solved. */
  pending?: boolean;
  attempts: number;
  solutionTime?: number;
  penalty?: number;
};

export type ScoreboardRow = {
  teamName: string;
  /** PC² site / group name when present on standings. */
  teamGroupName?: string;
  rank: number;
  solved: number;
  penalty: number;
  problems: ScoreboardProblem[];
};

/** Response from GET /api/team/getrank */
export type TeamRankResponse = {
  teamName?: string;
  teamRank?: number;
};

export type ApiErrorBody = {
  error?: string;
  message?: string;
};
