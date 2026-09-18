# Bug Report and Issue Register

## Document control

| Field | Value |
|---|---|
| Assessment branch | `assessment/nguyen-dinh-duc` |
| Author | Nguyen Dinh Duc |
| Review date | `2026-09-18` |
| Application version/commit | `cba9e0d2e5aca2a8b722f29e6cc5f81c97928c05` plus pending infrastructure hardening |
| Overall status | Core remediation, required E2E journeys, and Tier 3B infrastructure hardening are implemented; remaining findings are tracked below |

## Purpose

This document is the source of truth for defects discovered during the assessment. Every finding must include a reproducible impact, a root cause, a scoped fix, and verification evidence. Update the status and evidence links in the same pull request that changes the behavior.

## Status definitions

| Status | Meaning |
|---|---|
| Open | Confirmed and not yet being fixed |
| In Progress | Implementation or verification is in progress |
| Fixed | Code change is complete but final evidence is pending |
| Verified | Regression and relevant integration tests pass |
| Deferred | Intentionally postponed with owner, reason, and risk acceptance |
| Rejected | Not reproducible or not a defect; include evidence |

No Critical or High issue may remain Deferred for final submission.

## Finding register

| ID | Area | Finding | Severity | Primary location | Status | Fix PR/commit | Verification |
|---|---|---|---|---|---|---|---|
| AUTH-001 | JWT | Expiration verification is disabled | Critical | `backend/app/core/security.py::verify_token` | Verified | `834bcf9` | `test_expired_access_token_is_rejected`; backend suite 19/19 passes |
| AUTH-002 | JWT | Access dependencies do not enforce token type | Critical | `backend/app/api/deps.py::get_current_user` | Verified | `834bcf9` | `test_refresh_token_cannot_authenticate_access_endpoint`; backend suite 19/19 passes |
| AUTH-003 | Session | Refresh rotation/revocation and logout are ineffective | High | `backend/app/api/v1/auth.py`, `backend/app/core/redis.py` | Verified | Working tree | `test_refresh_token_rotation_rejects_replay` and `test_logout_revokes_access_and_refresh_session`; Docker Python 3.12 suite 25/25 passes |
| AUTH-004 | Authentication | Login response enables user enumeration | Medium | `backend/app/api/v1/auth.py::login` | Verified | Working tree | `test_login_failure_does_not_reveal_whether_email_exists` verifies identical 401 body for unknown email and wrong password; Docker Python 3.12 suite 26/26 passes |
| AUTH-005 | Configuration | Default JWT secret can be used outside a safe local profile | High | `backend/app/core/config.py` | Verified | `de88674` | Sensitive settings have no source fallback; three parameterized regressions require database, Redis, and JWT configuration |
| TODO-001 | Authorization | Todo detail/update/delete are not owner-scoped | Critical | `backend/app/api/v1/todos.py` | Verified | `16cda47` | API regression and Playwright Journey 2 confirm cross-user GET/PUT/DELETE return 404 and owner data remains unchanged |
| TODO-002 | Update | `completed=false` is ignored | High | `backend/app/api/v1/todos.py::update_existing_todo` | Verified | `0ff4674` | `test_partial_update_can_set_completed_to_false`; backend suite 19/19 passes |
| TODO-003 | Update | An omitted description can be overwritten with `null` | High | `backend/app/api/v1/todos.py::update_existing_todo` | Verified | `0ff4674` | `test_partial_update_preserves_omitted_description`; backend suite 19/19 passes |
| CACHE-001 | Data isolation | Todo list cache key is shared across users and queries | Critical | `backend/app/api/v1/todos.py::list_todos` | Verified | `5816658` | Mock tests cover user/query variants; Journey 2 confirms user B's real-Redis list response and UI exclude user A's Todo |
| CACHE-002 | Consistency | Todo mutations do not invalidate list cache | High | `backend/app/api/v1/todos.py` | Verified | `5816658` | Mock regression passes; Playwright Journey 1 also observes fresh create/edit/complete/delete state against PostgreSQL and real Redis |
| CACHE-003 | Transactions | Cache invalidation is not coordinated with DB commit | High | `backend/app/api/v1/todos.py::commit_todo_mutation` | Verified | Working tree | Commit-order regressions prove failed commits leave Redis untouched and successful paths run `commit → invalidate`; Docker Python 3.12 suite 28/28 passes |
| DB-001 | Integrity | Email uniqueness is not enforced by the database | High | `backend/app/models/user.py`, `backend/alembic/versions/d4e6f8a0b2c3_add_users_email_unique_constraint.py` | Verified | Working tree | `test_user_email_is_unique_in_database` proves a duplicate insert raises `IntegrityError`; registration catches a concurrent constraint conflict; Docker Python 3.12 suite 29/29 passes |
| DB-002 | Pagination | Todo queries have no deterministic ordering | Medium | `backend/app/services/todo_service.py::get_todos` | Verified | `cb13a34` | Newest-first `created_at, id` order and `test_get_todos_orders_newest_first`; 23/23 backend tests pass |
| DB-003 | Performance | Todo list performs an additional user query per row | Medium | `backend/app/services/todo_service.py::get_todos` | Verified | Working tree | `test_todo_list_eager_loads_users_for_response` verifies every returned Todo has its user relationship eagerly loaded; Docker Python 3.12 suite 30/30 passes |
| DB-004 | Performance | Core Todo queries lack a measured composite-index strategy | Medium | `todos` table migrations | Verified | `cb13a34` | PostgreSQL 16.15, 1M Todo before/after evidence in `docs/PERFORMANCE_REPORT.md`; Q1/Q2 medians improve 397.2×/322.4× |
| API-001 | Resource control | Todo page size has no upper bound | Medium | `backend/app/api/v1/todos.py::list_todos` | Open | — | `<test/evidence>` |
| FE-001 | Data isolation | Todo React Query key omits user and pagination context | High | `frontend/src/features/todos/api/todos.ts` | Fixed | `d5fa690` | Node regression test confirms keys differ by user, page, and size; lint/build pass |
| FE-002 | Session | Logout/account change does not clear user-scoped query data | High | Auth hooks and query client | Fixed | `d5fa690` | Unit regression confirms token/query cleanup; Journey 1 confirms browser logout cleanup and Journey 2 confirms isolated sessions; same-context account switching remains unit-only |
| FE-003 | State | Optimistic update does not restore the snapshot on error | Medium | `frontend/src/features/todos/api/todos.ts` | Fixed | `d5fa690` | User-scoped snapshots are restored in `onError`; lint/build pass; component-level failure test pending |
| FE-004 | Authentication | Global 401 handling reloads login and can hide form errors | Medium | `frontend/src/lib/api.ts` | Open | — | `<test/evidence>` |
| FE-005 | Pagination | Frontend requests 10,000 Todos by default | Medium | `frontend/src/features/todos/api/todos.ts::useTodos` | Open | — | `<test/evidence>` |
| FE-006 | React | Todo rows use array indexes as keys | Low | `frontend/src/features/todos/components/TodoList.tsx` | Open | — | `<test/evidence>` |
| INFRA-001 | Startup | Compose has no dependency healthchecks/readiness conditions | High | `docker-compose.yml` | Verified | `de88674` | Cold start with `docker compose up -d --build --wait` gates backend on healthy PostgreSQL/Redis and frontend on healthy backend; all four services become healthy |
| INFRA-002 | Secrets | Development credentials are embedded in tracked configuration | High | Compose, settings, tracked `.env` files | Verified | `de88674` | Tracked `.env` files removed; Compose requires database, Redis, and JWT values from ignored local environment configuration |
| INFRA-003 | Network | PostgreSQL and unauthenticated Redis are published to the host | High | `docker-compose.yml` | Verified | `de88674` | `docker compose ps` shows only internal `5432/tcp` and `6379/tcp`; unauthenticated `redis-cli ping` returns `NOAUTH` |
| INFRA-004 | Containers | Images run as root and lack scoped `.dockerignore` files | Medium | Backend/frontend Dockerfiles | Verified | `de88674` | Backend runs as `uid=999(app)`, frontend as `uid=1000(node)`; scoped ignore files reduce contexts to application inputs and exclude nested caches |
| INFRA-005 | Build | Frontend build is not reproducible and runtime Vite env is ineffective | Medium | Frontend Dockerfile and Compose | Verified | `de88674` | Image build uses `npm ci`; `VITE_API_URL` is supplied as a build argument; production image build passes |
| TEST-001 | Coverage | Existing tests cover happy paths but not security boundaries | High | `backend/tests/` | Verified | `cea96fd`, `5816658`, working tree | Suite covers expiry, token type, refresh rotation/revocation, login enumeration, database email uniqueness, cross-user CRUD, cache isolation/invalidation/commit ordering, eager Todo users, partial updates, required secrets, and stable ordering; 30/30 pass |
| TEST-002 | Fidelity | SQLite and per-request Redis mocks do not validate production behavior | Medium | `backend/tests/conftest.py` | Open | — | Journeys 1/2 add PostgreSQL/real-Redis browser paths; a dedicated integration and concurrency suite is still pending |
| TEST-003 | Test maintenance | Custom async event-loop fixture is deprecated and will become an error | Low | `backend/tests/conftest.py:28` | Open | — | `pytest tests/ -v` emits `DeprecationWarning` from `pytest-asyncio` |
| CONFIG-001 | Backend compatibility | Pydantic class-based `Config` is deprecated before Pydantic v3 | Low | `backend/app/core/config.py` | Open | — | `pytest tests/ -v` emits `PydanticDeprecatedSince20` |
| DEP-001 | Frontend security | Production dependency tree contains 6 known vulnerabilities | High | `frontend/package-lock.json` | Open | — | `npm audit --omit=dev`: 5 High, 1 Moderate; direct packages include `axios@1.17.0` and `react-router-dom@7.17.0`; fixes are available and exploitability still requires triage |
| DEP-002 | Backend compatibility | Passlib/bcrypt stack emits an internal version lookup error during password hashing | Medium | `backend/requirements.txt`, `backend/app/db/seed.py` | Open | — | Seed succeeds but logs `AttributeError: module 'bcrypt' has no attribute '__about__'` with `passlib==1.7.4` and `bcrypt==4.3.0`; pytest also warns about deprecated `crypt` usage |
| QUALITY-001 | Backend quality | Required backend Black and Flake8 gates failed | Low | `backend/tests/conftest.py` | Verified | `24bba4d` | The five intentionally delayed imports document the database bootstrap requirement and use scoped `# noqa: E402`; `black --check .` and unfiltered `flake8 app tests` pass |
| FE-007 | Frontend performance | Production JavaScript bundle exceeds Vite's 500 kB warning threshold | Medium | Frontend production bundle | Open | — | `npm run build`: main JS is 521.53 kB (163.06 kB gzip); Vite recommends code splitting/manual chunks |
| FE-008 | Accessibility | Todo dialogs omit an accessible description | Low | `frontend/src/features/todos/components/TodoForm.tsx` | Open | — | Journey 1 passes but Radix logs `Missing Description or aria-describedby` whenever create/edit dialogs open |
| FE-009 | Error handling | Structured registration validation errors can crash React toast rendering | Medium | `frontend/src/features/auth/components/RegisterForm.tsx` | Open | — | Exploratory E2E run received a 422 detail array for a special-use email domain; the object was passed to the toast and React reported an invalid child |
| DOC-001 | Deliverables | `docs/` was ignored despite required assessment documents | Medium | `.gitignore` | Verified | `3d1936b` | Deliverables are tracked while `docs/ANSWER_KEY.md` remains ignored |

Add newly discovered issues before implementing their fixes. Do not silently omit a finding because it falls outside the minimum five fixes required by Tier 1.

## Detailed finding template

Copy this section once per finding or link the register row to the corresponding heading.

### `<ID>` — `<short title>`

- **Status:** Open
- **Severity:** Critical / High / Medium / Low
- **Category:** Security / Correctness / Performance / Infrastructure / Testing / Documentation
- **Location:** `<file:function or line>`
- **Requirement:** `<README tier/task or internal invariant>`
- **Observed behavior:** `<what currently happens>`
- **Expected behavior:** `<safe/correct result>`
- **Impact:** `<confidentiality, integrity, availability, UX, performance>`
- **Reproduction:**
  1. `<precondition>`
  2. `<action>`
  3. `<observable result>`
- **Root cause:** `<technical cause>`
- **Fix proposal:** `<minimal root-cause fix>`
- **Compatibility/tradeoffs:** `<API, migration, performance, operational impact>`
- **Regression test:** `<test name/path>`
- **Integration/manual evidence:** `<command, result, log, screenshot, benchmark>`
- **PR/commit:** `<link or SHA>`
- **Reviewer notes:** `<notes>`

## README traceability matrix

| Requirement | Planned artefact/change | Evidence | Status |
|---|---|---|---|
| Tier 1: report impactful findings | This document and final PR description | `<PR link>` | In Progress |
| Tier 1: at least five fixes, including two backend and one frontend | Finding register and implementation commits | AUTH-001/002, TODO-001/002/003, CACHE-001/002, FE-001/002/003 | Minimum implementation met; final PR evidence pending |
| Tier 2A: at least three backend critical scenarios | `backend/tests/` | 30/30 pass, including refresh rotation/revocation, login enumeration, security/correctness/cache, required-secret, and deterministic-order regressions | Complete |
| Tier 2B: two required Playwright scenarios | `frontend/e2e/` and `frontend/playwright.config.ts` | Lifecycle Journey 1 and cross-user isolation Journey 2 pass | Complete (2/2 journeys) |
| Tier 2C: manual test plan | `docs/TEST_PLAN.md` | Matrix and automated evidence updated; manual execution pending | In Progress |
| Tier 3A: Todo Sharing specification only | `docs/TODO_SHARING_SPEC.md` | Draft structure created; specification decisions pending | In Progress |
| Tier 3B: at least three infrastructure improvements | Compose/Docker changes | Healthy cold start; non-root UIDs; authenticated/internal-only data services; scoped build contexts | Complete (5 improvements) |
| Tier 3C: query analysis, migration, benchmark, tradeoffs | Migration and `docs/PERFORMANCE_REPORT.md` | PostgreSQL 16.15; 10k users/1M Todos; raw plans/timings; concurrent index migration and rollback evidence | Complete |
| Git workflow and PR submission | Atomic Conventional Commits and final PR | `<git log/PR>` | In Progress |
| AI disclosure | `docs/AI_USAGE.md` | Assistance log updated through backend/frontend remediation | In Progress |
| Tier 4 bonus | Tags, filters, bulk actions and tests | `<PR/test report>` | Not Started |

## Verification summary

| Check | Command/environment | Expected | Actual | Date | Evidence |
|---|---|---|---|---|---|
| Compose validation | `docker compose --env-file .env.example config -q` | Pass | Pass (exit 0) | `2026-09-18` | Required secret variables resolve from the documented template; rendered Compose is valid |
| Backend tests | `docker compose run --rm --no-deps backend pytest tests/ -v` | Pass | Pass in fresh non-root Python 3.12.14 image: 30/30; 3 deprecation warnings | `2026-09-18` | Includes refresh rotation/revocation, login-enumeration, database uniqueness, cache commit-ordering, eager Todo users, required-secret, and deterministic-order regressions; warnings linked to `TEST-003`, `CONFIG-001`, and `DEP-002` |
| Backend regression suite | `uv run --python 3.12 --isolated --no-project --with-requirements requirements.txt pytest tests/ -v` | Pass | Pass on Python 3.12.12: 19 collected, 19 passed; 3 deprecation warning groups | `2026-09-18` | Covers AUTH-001/002, TODO-001/002/003, CACHE-001/002; SQLite and stateful Redis mock only |
| Backend format/lint | `black --check .`; `flake8 app tests` | Pass | Black passes for all 28 Python files; unfiltered Flake8 completes without findings | `2026-09-18` | `QUALITY-001` verified after five documented, scoped `E402` suppressions |
| Backend dependencies | `docker compose exec -T backend pip check` | Pass | Pass: no broken requirements found | `2026-09-18` | Command exit 0; runtime warning remains tracked as `DEP-002` |
| Frontend install | `cd frontend && npm ci` | Pass | Pass: 287 packages installed/audited | `2026-09-18` | Command exit 0 |
| Frontend lint | `cd frontend && npm run lint` | Pass | Pass (exit 0) | `2026-09-18` | ESLint completed without findings |
| Frontend unit regression | `cd frontend && npm test` | Pass | Pass: 2/2 query-isolation and session-cleanup tests | `2026-09-18` | FE-001/FE-002 regression coverage; Node 20-compatible runner |
| Frontend build | `cd frontend && npm run build` | Pass | Pass with warning: main JS 521.53 kB (163.06 kB gzip) | `2026-09-18` | `FE-007` |
| Frontend dependency audit | `cd frontend && npm audit --omit=dev` | No known production vulnerabilities | Fail: 6 vulnerabilities (5 High, 1 Moderate) | `2026-09-18` | `DEP-001`; full audit reports 9 total (7 High, 2 Moderate) |
| Playwright | `cd frontend && npm run test:e2e` | Pass | Two consecutive headless runs pass 3/3; the second reset removes 3 prior fixture users before recreating them | `2026-09-18` | Deterministic retry-indexed accounts; current Vite 4173 and Docker backend/PostgreSQL/Redis |
| Playwright headed command | `cd frontend && npm run test:e2e:headed -- --list` | List configured tests | Pass: reset removes the 3 remaining fixture users and Playwright lists 3 Chromium tests | `2026-09-18` | Validates the documented headed script without opening a GUI during automated verification |
| PostgreSQL/Redis smoke | `pg_isready`; `redis-cli ping`; README seed command | Pass | Pass: PostgreSQL accepts connections, Redis returns `PONG`, seed created 100 users and 1,000 todos | `2026-09-18` | Counts verified directly in PostgreSQL |
| Service HTTP smoke | `curl http://localhost:8000/health`; `curl -I http://localhost:3000` | Pass | Pass: backend reports healthy; frontend returns HTTP 200 | `2026-09-18` | Both app services also report healthy through Compose healthchecks |
| Docker cold start | `docker compose up -d --build --wait` | All services start reliably | Pass: PostgreSQL/Redis became healthy before backend; frontend started after backend became healthy | `2026-09-18` | `INFRA-001` verified without a manual restart |
| Migration upgrade/downgrade | `alembic upgrade head`; `alembic current` against PostgreSQL | Pass | Upgrade/current pass at `d4e6f8a0b2c3 (head)`; performance index downgrade/re-upgrade also passed | `2026-09-18` | Email-uniqueness migration preflights duplicate data; concurrent-index rollback evidence is in `docs/PERFORMANCE_REPORT.md` |
| Container hardening | `docker compose exec -T {backend,frontend} id`; `docker compose ps`; Redis auth probes | Non-root; authenticated data services not host-published | Pass: app UIDs are 999/1000; DB/cache expose no host bindings; unauthenticated Redis returns `NOAUTH` and authenticated ping succeeds | `2026-09-18` | `INFRA-002`–`INFRA-005` verified |
| Performance benchmark | See `docs/PERFORMANCE_REPORT.md` | PostgreSQL evidence, migration, plans, timings, tradeoffs | Pass: 10k users/1M Todos; Q1 median 22.245→0.056 ms and Q2 20.471→0.064 ms; index is 56 MB; concurrent upgrade/downgrade/re-upgrade pass | `2026-09-18` | `DB-002`, `DB-004`; no SQLite evidence used |

## Residual risks and accepted limitations

| Risk | Severity | Reason not fixed | Mitigation | Owner | Review date |
|---|---|---|---|---|---|
| Redis behavior lacks a dedicated integration/concurrency suite | Medium | Journeys cover real-Redis lifecycle and cross-user isolation, not failure ordering or concurrent mutations | Keep `TEST-002` open and add focused integration coverage before final submission | Nguyen Dinh Duc | `2026-09-18` |
