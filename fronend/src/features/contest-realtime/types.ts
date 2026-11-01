import type { ScoreboardRow } from "shared/api/types";

export type { ScoreboardRow };

export type ClockUpdatePayload = {
  running?: boolean;
  remainingSeconds?: number;
  elapsedSeconds?: number;
  contestLengthSeconds?: number;
  source?: string;
};

export type ScoreboardUpdatedPayload = {
  rows?: ScoreboardRow[];
  source?: string;
  siteNumber?: number;
  runNumber?: number;
};

export type RunJudgedPayload = {
  siteNumber?: number;
  runNumber?: number;
  problem?: string;
  language?: string;
  judgement?: string;
};

export type ClarificationEventPayload = {
  clarificationId?: number;
  clarificationTime?: number;
  teamname?: string;
  problem?: string;
  question?: string;
  answered?: boolean;
  broadcast?: boolean;
  answer?: string;
};

export type LogoutRequiredPayload = {
  reason?: string;
  message?: string;
};

export type ContestWsMessage =
  | { type: "WS_CONNECTED"; payload?: { message?: string } }
  | { type: "CLOCK_UPDATE"; payload: ClockUpdatePayload }
  | { type: "SCOREBOARD_UPDATED"; payload: ScoreboardUpdatedPayload }
  | { type: "standings"; id?: string }
  | { type: "RUN_JUDGED"; payload: RunJudgedPayload }
  | { type: "RUN_UPDATED"; payload: RunJudgedPayload }
  | { type: "RUN_DELETED"; payload: RunJudgedPayload }
  | { type: "CLARIFICATION_ANSWERED"; payload: ClarificationEventPayload }
  | { type: "CLARIFICATION_UPDATED"; payload?: ClarificationEventPayload }
  | { type: "CLARIFICATION_UPDATE"; payload?: ClarificationEventPayload }
  | { type: "NEW_CLARIFICATION"; payload?: ClarificationEventPayload }
  | { type: "JUDGE_REPLY"; payload?: ClarificationEventPayload }
  | { type: "LOGOUT_REQUIRED"; payload: LogoutRequiredPayload };

export type NotificationKind =
  | "judgment"
  | "clarification"
  | "announcement"
  | "session";

export type ContestNotification = {
  id: number;
  message: string;
  link: string;
  timestamp: number;
  kind: NotificationKind;
};
