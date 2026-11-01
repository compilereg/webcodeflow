# Frontend Package for AI Review

This archive contains the ACPC frontend source prepared for external review. It intentionally excludes secrets and large artifact folders.

Contents included
- package.json
- src/ (all source files)
- public/ (static assets)
- README_FOR_AI.md
- .env.example

What I expect you to run
1. Install dependencies

```bash
npm install
```

2. Run in development

```bash
npm start
```

3. Build for production

```bash
npm run build
```

Node / environment notes
- Tested with Node 18+ and npm 9+. Use a recent LTS Node release.
- Do NOT provide a real `.env` file containing secrets. Use `.env.example` placeholders.

Local test account
- The app uses a backend for authentication. Provide a disposable test account for the AI or mock the backend endpoints.
- If mocking, provide sample JSON responses for:
  - `/api/main/session`
  - `/api/main/listProblem`
  - `/api/main/listlanguages`
  - `/api/team/submitRun`
  - `/api/team/listClarification`
  - `/api/main/scoreboard`
  - `/api/team/getrank`
  - `/api/team/listSubmitRuns`

Goals for the AI reviewer
- Verify the guided product-tour feature implementation (or implement it if requested).
- Run the app, exercise the Home → Clarifications → Judgments → Scoreboard flows.
- Provide a test plan and unit tests where appropriate.

What NOT to include
- Do not include `.env` with real tokens, `node_modules`, or build artifacts.

Contact and notes
- If you need a temporary backend mock, note it in an issue and include sample responses.


---
Generated for sharing with an external AI reviewer. Remove this file before publishing publicly if needed.
