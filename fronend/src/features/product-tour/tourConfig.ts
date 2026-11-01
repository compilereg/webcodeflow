/**
 * The first-login tour, in display order.
 *
 * Every `target` below is a real selector confirmed against the
 * audited source — nothing here is guessed. See targetResolver.ts
 * for how `target` is resolved based on `selectorStrategy`.
 *
 * `route`: "*" means the step applies wherever the user currently is
 * and never triggers navigation.
 */

import type { TourStep } from "./types";

export const TOUR_STEPS: TourStep[] = [
  {
    id: "nav-home",
    route: "*",
    selectorStrategy: "text",
    target: { root: "header.navbar", text: "Home" },
    title: "Home",
    body: "Submit solutions and check the contest clock here.",
  },
  {
    id: "nav-bell",
    route: "*",
    selectorStrategy: "css",
    target: "[data-tour='nav-bell']",
    title: "Notifications",
    body: "New clarification replies and judgment results show up here.",
  },
  {
    id: "nav-logout",
    route: "*",
    selectorStrategy: "css",
    target: "[data-tour='nav-logout']",
    title: "Logout",
    body: "Sign out of your team's session from here whenever you're done.",
  },
  {
    id: "home-welcome",
    route: "/home",
    selectorStrategy: "css",
    target: "[data-tour='home-team-name']",
    title: "Welcome",
    body: "This confirms which team you're logged in as.",
  },
  {
    id: "home-clock",
    route: "/home",
    selectorStrategy: "css",
    target: "[data-tour='home-clock']",
    title: "Contest clock",
    body: "Time left in the contest. Submissions stop being accepted at zero.",
  },
  {
    id: "home-dropdowns",
    route: "/home",
    selectorStrategy: "css",
    target: "[data-tour='home-dropdowns']",
    title: "Choose problem and language",
    body: "Pick the problem you're solving and the language you wrote it in before uploading a file.",
  },
  {
    id: "home-submit",
    route: "/home",
    selectorStrategy: "css",
    target: ["[data-tour='home-uploads']", "[data-tour='home-submit-btn']"],
    title: "Submit your solution",
    body: "Drop your main solution file here, attach any supporting files, then submit.",
  },
  {
    id: "nav-clarifications",
    route: "/clarifications",
    selectorStrategy: "text",
    target: { root: "header.navbar", text: "Clarifications" },
    title: "Clarifications",
    body: "Ask the judges about a problem, or check answers other teams already got.",
  },
  {
    id: "clarifications-ask",
    route: "/clarifications",
    selectorStrategy: "css",
    target: "[data-tour='clarifications-form'] select",
    title: "Ask a question",
    body: "Ask something general, or pick a specific problem — a second dropdown appears once you do.",
  },
  {
    id: "clarifications-announcements",
    route: "/clarifications",
    selectorStrategy: "css",
    target: "[data-tour='clarifications-announcements']",
    title: "Announcements",
    body: "Judges broadcast contest-wide messages here. Everyone sees the same announcements.",
  },
  {
    id: "clarifications-general",
    route: "/clarifications",
    selectorStrategy: "css",
    target: "[data-tour='clarifications-general']",
    title: "General clarifications",
    body: "Non-problem questions from your team (type Generic) show up in this box with their answers.",
  },
  {
    id: "clarifications-problems",
    route: "/clarifications",
    selectorStrategy: "css",
    target: "[data-tour='clarifications-problems']",
    title: "Problem questions",
    body: "Questions about a specific problem stay private to your team in this box.",
  },
  {
    id: "nav-judgments",
    route: "/judgments",
    selectorStrategy: "text",
    target: { root: "header.navbar", text: "Judgments" },
    title: "Judgments",
    body: "Track the result of every submission you send in.",
  },
  {
    id: "judgments-table",
    route: "/judgments",
    selectorStrategy: "css",
    target: ".judgments-table",
    title: "Your submissions",
    body: "Every file you've submitted, with its current judgment. Filter by problem or status as needed.",
  },
  {
    id: "nav-scoreboard",
    route: "/scoreboard",
    selectorStrategy: "text",
    target: { root: "header.navbar", text: "Scoreboard" },
    title: "Scoreboard",
    body: "Open the live contest standings from here.",
  },
  {
    id: "scoreboard-summary",
    route: "/scoreboard",
    selectorStrategy: "css",
    target: "[data-tour='scoreboard-summary']",
    title: "Your summary",
    body: "Your position, solves, and how many teams are on the board — updated as the contest runs.",
  },
  {
    id: "scoreboard-colors",
    route: "/scoreboard",
    selectorStrategy: "css",
    target: "[data-tour='scoreboard-legend']",
    title: "Problem cell colors",
    body: "Dark green is first solve, light green is solved, purple is pending judgment, and red is failed attempts.",
  },
  {
    id: "scoreboard-table",
    route: "/scoreboard",
    selectorStrategy: "css",
    target: ".scoreboard-table",
    title: "The board",
    body: "Full standings by rank. Find your team and track everyone else's solves here.",
  },
  {
    id: "scoreboard-pagination",
    route: "/scoreboard",
    selectorStrategy: "css",
    target: "[data-tour='scoreboard-pagination']",
    title: "Switch pages",
    body: "Use the page numbers (1, 2, 3, …) to move through the full standings when there are more teams than fit on one page.",
  },
];
