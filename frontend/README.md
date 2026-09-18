# Fabbi Todo frontend

React/Vite frontend for the Todo assessment.

## Local development

```bash
npm ci
npm run dev
```

The development server uses `VITE_API_URL` from `.env` and expects the backend
at `http://localhost:8000` by default.

## Unit tests and quality checks

```bash
npm test
npm run lint
npm run build
```

## Playwright

Install the pinned Node dependencies and Chromium browser binary:

```bash
npm ci
npm run test:e2e:install
```

Run the Playwright suite headless, headed, or in UI mode:

```bash
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:ui
```

Playwright starts a dedicated Vite server on `http://127.0.0.1:4173` when no server is
already running. Set `PLAYWRIGHT_BASE_URL` to test an existing frontend; when
this variable is set, Playwright does not start its own Vite process:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
```

The smoke test validates the browser setup without backend data. Journey 1 uses
a unique disposable account to cover registration, logout/login, Todo creation,
editing, completion, deletion, and final logout against the backend at
`http://localhost:8000`. The Tier 2B cross-user isolation journey is still
pending.

Failure artifacts are written to `test-results/`. The HTML report is written to
`playwright-report/` and can be opened with:

```bash
npm run test:e2e:report
```
