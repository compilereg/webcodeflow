# WCF — Web Code Flow (Team Contest Frontend)

Team-facing single-page application for collegiate programming contests. Contestants log in as a PC² team, submit solutions, ask clarifications, track judgments, and follow live standings.

This repo is the **WCF frontend** (`wwffrontend`). It talks exclusively to **[wwfapi](../wwfapi)** (Jetty/Jersey façade over PC²). It is intended to replace the classic PC² **Web Team Interface (WTI)** for teams.

| | |
|---|---|
| **Stack** | React 19 · Vite 6 · TypeScript · React Router 6 (`HashRouter`) · Tailwind CSS v4 · Vitest |
| **Backend** | wwfapi REST + WebSocket |
| **Auth** | HttpOnly JWT cookie (`awt_jwt`) + CSRF header (`X-CSRF-Token`) |
| **Package name** | `wcf` (`package.json`) |

---

## Features

- **Login** — team username / password against wwfapi; session validated via `GET /session`
- **Home** — contest clock, rank/solved stats, quick submit (main + additional files)
- **Clarifications** — announcements, general questions, and per-problem questions
- **Judgments** — team run history with filters and live updates
- **Scoreboard** — in-app live standings (REST + WebSocket), search/filter, color legend
- **Product tour** — first-login walkthrough + per-section replay on Tutorials
- **Realtime** — clock, scoreboard, run judged, clarifications, admin forced logout
- **Theme** — light/dark via semantic design tokens

---

## Prerequisites

- Node.js 20+ (LTS recommended)
- A running **wwfapi** instance with a connected PC² contest (local or lab network)
- npm (comes with Node)

---

## Quick start

```bash
git clone <repo-url> wwffrontend
cd wwffrontend
npm install
cp .env.example .env   # adjust VITE_PROXY_TARGET if needed
npm start              # http://localhost:3000
```

On `localhost:3000`, leave `VITE_API_URL` / `VITE_WS_URL` empty so the browser stays same-origin. Vite proxies `/api` and `/ws` to `VITE_PROXY_TARGET` (default `localhost:8888`). That keeps cookie auth working across the proxy.

Production builds should also leave those URLs empty (same-origin reverse proxy in front of the SPA + API).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` / `npm run dev` | Vite dev server on port **3000** |
| `npm run build` | Typecheck (`tsc --noEmit`) then production build → `build/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Vitest once (`vitest run`) |
| `npm run test:watch` | Vitest watch mode |
| `npm run typecheck` | TypeScript only |

---

## Environment

See [`.env.example`](./.env.example). Variables use the **`VITE_*`** prefix (Vite; not CRA `REACT_APP_*`).

| Variable | Role |
|----------|------|
| `VITE_API_URL` | Absolute API base. **Empty** for local proxy / production same-origin. |
| `VITE_WS_URL` | Optional override for WebSocket URL. **Empty** = fetch path from backend `GET /api/main/getwspath`. |
| `VITE_PROXY_TARGET` | Dev-only host:port for Vite proxy of `/api` and `/ws` (e.g. `localhost:8888`). |

### WebSocket URL resolution

The WebSocket path is controlled by the backend's `pc2v9.ini` setting `wwfWSPath` (default `/ws/contest`). The frontend fetches the path from `GET /api/main/getwspath` on connect and caches it. This allows operators to change the WebSocket path without rebuilding the frontend.

**Precedence:** `VITE_WS_URL` override → backend `/getwspath` → fallback `/ws/contest`.

**Dev proxy note:** Vite only forwards paths starting with `/ws`, so during local development the backend's `wwfWSPath` must start with `/ws/...`.

---

## Application routes

Hash routing (`#/...`):

| Route | Screen |
|-------|--------|
| `/` | Login |
| `/home` | Submit + contest clock |
| `/clarifications` | Ask / read clarifications |
| `/judgments` | Submission results |
| `/scoreboard` | Live standings |
| `/tutorials` | Replay product-tour sections |

---

## Architecture (short)

```text
src/
  app/                 # Router, providers, session guards
  pages/               # Route screens + colocated hooks
  features/
    contest-realtime/  # WebSocket + clock / notifications
    contest-dashboard/ # Shared rank / run stats for layout
    product-tour/      # First-login + Tutorials replay
    theme/             # Light / dark
  shared/
    api/               # HTTP client, endpoints, parsers
    auth/              # Session / identity storage helpers
    ui/                # Navbar, footer, shared chrome
    lib/               # Small pure helpers
    theme/             # Design tokens / scoreboard cell classes
```

Layering rules and API notes live in [`docs/architecture.md`](./docs/architecture.md).

### API surface (wwfapi)

| Concern | Endpoints / channel |
|---------|---------------------|
| Auth / session | `/api/main/login`, `/api/main/session`, logout |
| Catalog | `/api/main/listProblems`, languages |
| Runs | `/api/team/submitRun`, `/api/team/listSubmitRuns` |
| Clarifications | `/api/team/*Clarification*` |
| Scoreboard / rank | `/api/main/scoreboard`, `/api/team/getrank` |
| Realtime | WebSocket `/ws/contest` |

Error codes and operator messaging: [`docs/error-documentation.md`](./docs/error-documentation.md).

### Important contracts

- Submit and clarification **problem** fields use the PC² **display name** (`name`), not the short name (`alphabte` / `shortName`).
- Scoreboard REST/WS may arrive as DSA-style `{ contestStandings: { teamStanding: [...] } }`; the client normalizes via `shared/api/parseScoreboard.ts`.
- List endpoints that fail throw / surface UI errors; they must **not** be treated as an empty contest (`[]` only means a real empty payload).

---

## Documentation

| Doc | Contents |
|-----|----------|
| [`docs/architecture.md`](./docs/architecture.md) | Layout, boundaries, changelog |
| [`docs/tutorial.md`](./docs/tutorial.md) | Product tour steps and Tutorials tiles |
| [`docs/error-documentation.md`](./docs/error-documentation.md) | Login / API error codes |
| [`docs/app_colors.md`](./docs/app_colors.md) / [`docs/app_theme.md`](./docs/app_theme.md) | Visual tokens |
| [`docs/dark-mode.md`](./docs/dark-mode.md) | Theme behavior |

---

## Testing

```bash
npm test
npm run typecheck
```

Tests cover API parsers, auth storage, product-tour sections/replay, and page smoke where practical. Prefer characterization tests that lock API contracts (e.g. display-name submit values) over brittle UI snapshots.

---

## Production build & deploy

```bash
npm run build
```

Output directory: **`build/`** (kept for existing rsync / GitLab deploy paths). Serve the static files behind the same origin as wwfapi (or reverse-proxy `/api` and `/ws` to the API host).

---

## Security notes (operators)

- Session JWT is **HttpOnly**; do not store JWTs in `localStorage`.
- CSRF token is stored in browser storage and sent as `X-CSRF-Token`. Treat XSS on lab machines as high severity.
- Admin forced logout and WS rate-limit closes must be handled carefully so flaky networks do not false-logout teams (see contest-realtime `classifyWsClose`).

---

## Related repositories

- **wwfapi** — REST + WebSocket façade over PC² (required backend for this SPA)
- Classic PC² WTI — legacy team UI this product replaces

---

## License / ownership

Private contest infrastructure. Contact the contest systems team for access and deployment.
