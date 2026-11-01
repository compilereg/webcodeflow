export const endpoints = {
  session: "/api/main/session",
  login: "/api/main/login",
  logout: "/api/main/logout",
  contestInfo: "/api/main/contestinfo",
  wsPath: "/api/main/getwspath",
  listProblem: "/api/main/listProblem",
  listLanguages: "/api/main/listlanguages",
  submitRun: "/api/team/submitRun",
  scoreboard: "/api/main/scoreboard",
  getRank: "/api/team/getrank",
  listSubmitRuns: "/api/team/listSubmitRuns",
  listClarification: "/api/team/listClarification",
  submitClarification: "/api/team/submitClarification",
} as const;

export type EndpointKey = keyof typeof endpoints;
export type EndpointPath = (typeof endpoints)[EndpointKey];
