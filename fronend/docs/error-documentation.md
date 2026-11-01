# Error documentation

UI login/session failures show a **short code** (and the modal title `Login failed`). Look up the code here.

## Codes

| Code | When |
|------|------|
| `AUTH_INVALID_CREDENTIALS` | Login 401. Wrong username/password, or PC² rejected the login. |
| `AUTH_TEAM_ONLY` | Login 403. Account is not a team client. |
| `AUTH_RATE_LIMIT` | Login 429. Too many failed attempts; locked for **5 minutes** (`maincontroller.LOCK_TIME`). Wait, then open a new window and try again. |
| `AUTH_COOKIE_BLOCKED` | Login HTTP 200, then `/api/main/session` is unauthenticated. Browser did not store/send `awt_jwt`. |
| `AUTH_UNREACHABLE` | Network/CORS block, or request never reached the API (timeout/offline/wrong host). |
| `AUTH_TIMEOUT` | Login request aborted after the client timeout. |
| `AUTH_UNAVAILABLE` | API 503 (PC² / server warm-up). |
| `AUTH_SERVER` | API 5xx. |
| `AUTH_LOGIN_FAILED` | Login failed with no usable body. |
| `AUTH_ADMIN_LOGOFF` | PC² admin dropped the team connection. WS `LOGOUT_REQUIRED` and/or close `4001`. |
| `AUTH_WS_RATE_LIMIT` | WS close `1008` `Too many connection attempts` / `Too many messages`, or a proxy-stripped `1006` right after connect. Blocked for **1 minute** (`ContestSocket.WINDOW_MS`). Wait, then open a new window and log in again. |

## `AUTH_COOKIE_BLOCKED` (not CORS)

This is **cookies / SameSite**, not CORS.

Login `POST /api/main/login` already succeeded (JSON + `Set-Cookie`). The next `GET /api/main/session` has no `awt_jwt`, so the API returns 401.

Typical failure: UI `http://localhost:3000` calling the API at `http://10.0.3.6:8888` **directly**. Different sites. Chrome will not keep a non-`SameSite=None; Secure` cookie on that cross-site response.

**Local bypass:** leave `VITE_API_URL` / `VITE_WS_URL` empty and set `VITE_PROXY_TARGET`. Open **http://localhost:3000**. The browser talks only to localhost; Vite forwards `/api` and `/ws` to the live backend. The cookie is stored for `localhost` (same-site). Restart `npm start` after changing `.env`.

Production serves the SPA and API on **one host**, so the cookie is first-party and this code should not appear.

## Admin logoff (`AUTH_ADMIN_LOGOFF`)

`wwfapi` `LogoffUpdates.connectionDropped()` runs when PC² drops the team (admin logoff). It:

1. Removes the JWT from `maincontroller.sessions`
2. Sends WS `{ type: "LOGOUT_REQUIRED", payload: { reason, message } }`
3. Closes the socket with code **4001** (`PC2 admin forced logout`)

The SPA clears local auth and sends the team to login with this code.

If the JSON never arrives (backend closes the socket immediately after `sendStringByFuture`; Vite may turn `4001` into `1006`), the next WS connect is `1008 Unauthorized`. The SPA now treats that as the same logoff instead of staying on Home.

## Too many refreshes (`AUTH_WS_RATE_LIMIT`)

The Vite `/ws` proxy may strip the close reason. A `1008` with an empty reason is treated as this code so the UI does not sit connected-looking with a dead socket.

`ContestSocket` rate-limits **per client IP**:

- 5 WebSocket connects / 60 seconds
- 30 messages / 60 seconds

Reload/reconnect storms hit the cap; the server closes with `1008 Too many connection attempts`. Through Vite the close often arrives as `1006`. The SPA must **not** sit on Home and retry until the window slides — that looks “connected” again.

It logs the team out, stores a 60s block, and shows: blocked for 1 minute; wait; then open a **new window** and log in. Login is disabled until the countdown ends. A new tab opened too soon is still the same IP and will be rejected.

## CORS (wwfapi)

CORS only decides whether the **browser is allowed to read** a cross-origin response.

In `wwfapi` (`helpers.CorsConfig` + `mappers.CorsFilter`):

- `ALLOW_ANY_ORIGIN = true` → every `Origin` is allowed (CORS checks effectively off).
- `ALLOW_ANY_ORIGIN = false` → only the allowlist (localhost ports + `http://wwffrontend.aast.edu`).

`credentials: include` requires a **reflected** `Access-Control-Allow-Origin` (the request Origin), not `*`. The filter already echoes Origin.

| If you… | What you see |
|---------|----------------|
| Disable CORS allow-all **and** your UI origin is not on the list | Browser console CORS error; UI `AUTH_UNREACHABLE`. Login JSON never reaches JS. |
| Leave CORS open / origin allowed | Login JSON works. Session may still fail with `AUTH_COOKIE_BLOCKED`. |

You “disabled CORS” on the backend and still got `AUTH_COOKIE_BLOCKED` → the login response was readable, so CORS was **not** what blocked the session. The cookie was.

WebSocket `/ws/contest` uses the same cookie + `CorsConfig.isOriginAllowed` on the upgrade. Cookie missing → close `1008 Unauthorized`.

## Other HTTP (login)

Backend `POST /api/main/login` bodies:

| Status | Body |
|--------|------|
| 400 | `{"error":"Missing credentials"}` |
| 401 | `{"error":"Login failed"}` → UI `AUTH_INVALID_CREDENTIALS` |
| 403 | `{"error":"Only team accounts allowed"}` |
| 429 | `{"error":"Too many failed attempts. Try later."}` |
