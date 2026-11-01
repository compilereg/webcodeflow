# Product tutorial

The contest SPA has a **19-step first-login walkthrough** and a **Tutorials** page that replays slices of those same steps. Source: `src/features/product-tour/`.

## When it runs

| Trigger | What happens |
|---------|----------------|
| Team logs in and has never finished or skipped the tour **on this browser** | Full 19-step tour starts at step 1. |
| Same team logs in again (or after logout) | Tour does **not** auto-start. |
| Refresh mid-tour (`status: in_progress`) | Resumes at the stored step. |
| Navbar **Tutorials** → a tile | Replays only that section. Does not rewrite first-login storage. |
| `/tutorials` with no tile click | First-login tour does not auto-start on this route. |

The first-login tour is **once per team per browser**, not once per login session.

## Once-per-team flag (localStorage)

Completion is stored in **localStorage** (survives logout and tab close). The key uses the team display name, which a new tab hydrates from the identity cache after `GET /session` succeeds.

Key:

```
acpc:product-tour:v1:<team display name>
```

`<team display name>` is `getTeamName()` / `getDisplayName()` (the name written at login). Example: `acpc:product-tour:v1:Team Test`.

Value (JSON):

```json
{
  "status": "not_started | in_progress | skipped | finished",
  "stepIndex": 0,
  "updatedAt": 1710000000000
}
```

| `status` | Auto-start first-login? |
|----------|-------------------------|
| missing / `not_started` | Yes |
| `in_progress` | Resume, do not restart from step 1 |
| `skipped` | No |
| `finished` | No |

Skip or Finish writes `skipped` / `finished` and stops the overlay. Logout must **not** delete `acpc:product-tour:*` keys (`clearAuthenticationStorage` only removes auth keys).

A different team on the same machine gets a different key, so they still see the first-login tour. The same team on another browser or machine also sees it (nothing is stored on the server).

Bump `STORAGE_VERSION` in `tourStorage.ts` (currently `v1`) to force every team to see the tour again after a redesign.

**Force a re-run locally:** DevTools → Application → Local Storage → delete the `acpc:product-tour:v1:…` key for that team, then log in again.

Replay from Tutorials is in-memory only (`tourReplay.ts`). Next / Skip / Finish on a replay must not change the first-login `status`.

## First-login steps (1–19)

`route: *` stays on the current page. Any other `route` navigates there before the spotlight.

| # | id | Page | Spotlight | Copy |
|---|----|------|-----------|------|
| 1 | `nav-home` | any | Navbar **Home** | Submit solutions and check the contest clock here. |
| 2 | `nav-bell` | any | `[data-tour='nav-bell']` | New clarification replies and judgment results show up here. |
| 3 | `nav-logout` | any | `[data-tour='nav-logout']` | Sign out of your team's session from here whenever you're done. |
| 4 | `home-welcome` | `/home` | `[data-tour='home-team-name']` | This confirms which team you're logged in as. |
| 5 | `home-clock` | `/home` | `[data-tour='home-clock']` | Time left in the contest. Submissions stop being accepted at zero. |
| 6 | `home-dropdowns` | `/home` | `[data-tour='home-dropdowns']` | Pick the problem you're solving and the language you wrote it in before uploading a file. |
| 7 | `home-submit` | `/home` | uploads + submit button | Drop your main solution file here, attach any supporting files, then submit. |
| 8 | `nav-clarifications` | `/clarifications` | Navbar **Clarifications** | Ask the judges about a problem, or check answers other teams already got. |
| 9 | `clarifications-ask` | `/clarifications` | ask-form select | Ask something general, or pick a specific problem — a second dropdown appears once you do. |
| 10 | `clarifications-announcements` | `/clarifications` | announcements box | Judges broadcast contest-wide messages here. |
| 11 | `clarifications-general` | `/clarifications` | general box | Non-problem (Generic) questions from your team. |
| 12 | `clarifications-problems` | `/clarifications` | your questions box | Problem-specific questions private to your team. |
| 13 | `nav-judgments` | `/judgments` | Navbar **Judgments** | Track the result of every submission you send in. |
| 14 | `judgments-table` | `/judgments` | `.judgments-table` | Every file you've submitted, with its current judgment. Filter by problem or status as needed. |
| 15 | `nav-scoreboard` | `/scoreboard` | Navbar **Scoreboard** | Open the live contest standings from here. |
| 16 | `scoreboard-summary` | `/scoreboard` | `[data-tour='scoreboard-summary']` | Your position, solves, and how many teams are on the board — updated as the contest runs. |
| 17 | `scoreboard-colors` | `/scoreboard` | `[data-tour='scoreboard-legend']` | Dark green = first solve, light green = solved, purple = pending, red = failed. |
| 18 | `scoreboard-table` | `/scoreboard` | `.scoreboard-table` | Full standings by rank. Find your team and track everyone else's solves here. |
| 19 | `scoreboard-pagination` | `/scoreboard` | `[data-tour='scoreboard-pagination']` | Use the page numbers (1, 2, 3, …) to move through the full standings when there are more teams than fit on one page. |

Scoreboard steps target the in-app **Live Standings** table (`Scoreboard.tsx`), fed by WebSocket + `/api/main/scoreboard`. Sidebar rank uses `/api/team/getrank` (with scoreboard-row fallback).

### Missing targets (no auto-skip)

If a step’s DOM target cannot be found, the tour **does not** advance by itself. The overlay dims the page, the tip is centered, and a short note asks the team to press **Next** or **Skip**. That keeps the walkthrough under user control when a control is off-screen or not mounted yet (e.g. pagination with only one page).

## Tutorials page (`#/tutorials`)

Five tiles. Each replays a contiguous slice of the table above.

| Tile | Steps | Indexes in `TOUR_STEPS` |
|------|-------|-------------------------|
| General | 1–5 | 0–4 |
| Submission | 6–7 | 5–6 |
| Clarifications | 8–12 | 7–11 |
| Judgments | 13–14 | 12–13 |
| Scoreboard | 15–19 | 14–18 |

The overlay counter is local to the slice (Clarifications shows `1 / 5`, not `8 / 19`). After the last step of a replay, the overlay closes and first-login state is left as it was.

## Files

| File | Role |
|------|------|
| `tourConfig.ts` | The 19 steps |
| `tourSections.ts` | Tutorials tiles / index ranges |
| `tourStorage.ts` | Per-team localStorage flag |
| `tourReplay.ts` | In-memory section replay |
| `useTourController.ts` | Auto-start, Next/Back/Skip, navigation |
| `targetResolver.ts` | CSS / navbar-text targeting |
| `ProductTour.tsx` | Overlay + tooltip mount in `App.tsx` |
| `pages/tutorials/Tutorials.tsx` | Tile UI |
