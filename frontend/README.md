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

Playwright starts a Vite server on `http://127.0.0.1:3000` when no server is
already running. Set `PLAYWRIGHT_BASE_URL` to test an existing frontend; when
this variable is set, Playwright does not start its own Vite process:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
```

The current smoke test validates the browser setup without backend data. Full
authentication and Todo journeys require the backend at `http://localhost:8000`
and deterministic disposable test accounts. Those Tier 2B journeys are not yet
implemented.

Failure artifacts are written to `test-results/`. The HTML report is written to
`playwright-report/` and can be opened with:

```bash
npm run test:e2e:report
```
