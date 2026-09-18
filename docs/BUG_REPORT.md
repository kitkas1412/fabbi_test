# Bug Report and Issue Register

## Document control

| Field | Value |
|---|---|
| Assessment branch | `assessment/nguyen-dinh-duc` |
| Author | Nguyen Dinh Duc |
| Review date | `2026-09-18` |
| Application version/commit | `d5fa69053fde87d879c751126af031441055073b` |
| Overall status | Core auth, Todo isolation/update/cache, and frontend session remediations implemented; remaining findings are tracked below |

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
| AUTH-003 | Session | Refresh rotation/revocation and logout are ineffective | High | `backend/app/api/v1/auth.py` | Open | — | `<test/evidence>` |
| AUTH-004 | Authentication | Login response enables user enumeration | Medium | `backend/app/api/v1/auth.py::login` | Open | — | `<test/evidence>` |
| AUTH-005 | Configuration | Default JWT secret can be used outside a safe local profile | High | `backend/app/core/config.py` | Open | — | `<test/evidence>` |
| TODO-001 | Authorization | Todo detail/update/delete are not owner-scoped | Critical | `backend/app/api/v1/todos.py` | Verified | `16cda47` | Parametrized cross-user GET/PUT/DELETE regression passes and confirms owner data is unchanged |
| TODO-002 | Update | `completed=false` is ignored | High | `backend/app/api/v1/todos.py::update_existing_todo` | Verified | `0ff4674` | `test_partial_update_can_set_completed_to_false`; backend suite 19/19 passes |
| TODO-003 | Update | An omitted description can be overwritten with `null` | High | `backend/app/api/v1/todos.py::update_existing_todo` | Verified | `0ff4674` | `test_partial_update_preserves_omitted_description`; backend suite 19/19 passes |
| CACHE-001 | Data isolation | Todo list cache key is shared across users and queries | Critical | `backend/app/api/v1/todos.py::list_todos` | Fixed | `5816658` | Stateful Redis-mock tests pass for user and pagination isolation; real Redis integration pending under `TEST-002` |
| CACHE-002 | Consistency | Todo mutations do not invalidate list cache | High | `backend/app/api/v1/todos.py` | Fixed | `5816658` | Create/update/delete invalidation regression passes with per-user cache versioning; real Redis integration pending |
| CACHE-003 | Transactions | Cache invalidation is not coordinated with DB commit | High | Todo mutation transaction boundary | Open | — | `<test/evidence>` |
| DB-001 | Integrity | Email uniqueness is not enforced by the database | High | User model and Alembic migrations | Open | — | `<test/evidence>` |
| DB-002 | Pagination | Todo queries have no deterministic ordering | Medium | `backend/app/services/todo_service.py::get_todos` | Open | — | `<test/evidence>` |
| DB-003 | Performance | Todo list performs an additional user query per row | Medium | `backend/app/api/v1/todos.py::list_todos` | Open | — | `<test/evidence>` |
| DB-004 | Performance | Core Todo queries lack a measured composite-index strategy | Medium | `todos` table migrations | Open | — | `<benchmark>` |
| API-001 | Resource control | Todo page size has no upper bound | Medium | `backend/app/api/v1/todos.py::list_todos` | Open | — | `<test/evidence>` |
| FE-001 | Data isolation | Todo React Query key omits user and pagination context | High | `frontend/src/features/todos/api/todos.ts` | Fixed | `d5fa690` | Node regression test confirms keys differ by user, page, and size; lint/build pass |
| FE-002 | Session | Logout/account change does not clear user-scoped query data | High | Auth hooks and query client | Fixed | `d5fa690` | Unit regression confirms token/query cleanup; cleanup is wired to logout, account changes, and 401 handling; browser E2E pending |
| FE-003 | State | Optimistic update does not restore the snapshot on error | Medium | `frontend/src/features/todos/api/todos.ts` | Fixed | `d5fa690` | User-scoped snapshots are restored in `onError`; lint/build pass; component-level failure test pending |
| FE-004 | Authentication | Global 401 handling reloads login and can hide form errors | Medium | `frontend/src/lib/api.ts` | Open | — | `<test/evidence>` |
| FE-005 | Pagination | Frontend requests 10,000 Todos by default | Medium | `frontend/src/features/todos/api/todos.ts::useTodos` | Open | — | `<test/evidence>` |
| FE-006 | React | Todo rows use array indexes as keys | Low | `frontend/src/features/todos/components/TodoList.tsx` | Open | — | `<test/evidence>` |
| INFRA-001 | Startup | Compose has no dependency healthchecks/readiness conditions | High | `docker-compose.yml` | Open | — | Cold start: backend exited with PostgreSQL `ConnectionRefusedError`; it started only after a manual restart once PostgreSQL was ready |
| INFRA-002 | Secrets | Development credentials are embedded in tracked configuration | High | Compose, settings, tracked `.env` files | Open | — | `<scan/evidence>` |
| INFRA-003 | Network | PostgreSQL and unauthenticated Redis are published to the host | High | `docker-compose.yml` | Open | — | `docker compose ps -a` shows host bindings on `0.0.0.0:5432` and `0.0.0.0:6379` |
| INFRA-004 | Containers | Images run as root and lack scoped `.dockerignore` files | Medium | Backend/frontend Dockerfiles | Open | — | `docker compose exec ... id` returns `uid=0(root)` for both images; no `.dockerignore` exists |
| INFRA-005 | Build | Frontend build is not reproducible and runtime Vite env is ineffective | Medium | Frontend Dockerfile and Compose | Open | — | `<build evidence>` |
| TEST-001 | Coverage | Existing tests cover happy paths but not security boundaries | High | `backend/tests/` | Verified | `cea96fd`, `5816658` | Suite now covers expiry, token type, cross-user CRUD, cache isolation/invalidation, and partial updates; 19/19 pass |
| TEST-002 | Fidelity | SQLite and per-request Redis mocks do not validate production behavior | Medium | `backend/tests/conftest.py` | Open | — | `<integration report>` |
| TEST-003 | Test maintenance | Custom async event-loop fixture is deprecated and will become an error | Low | `backend/tests/conftest.py:28` | Open | — | `pytest tests/ -v` emits `DeprecationWarning` from `pytest-asyncio` |
| CONFIG-001 | Backend compatibility | Pydantic class-based `Config` is deprecated before Pydantic v3 | Low | `backend/app/core/config.py` | Open | — | `pytest tests/ -v` emits `PydanticDeprecatedSince20` |
| DEP-001 | Frontend security | Production dependency tree contains 6 known vulnerabilities | High | `frontend/package-lock.json` | Open | — | `npm audit --omit=dev`: 5 High, 1 Moderate; direct packages include `axios@1.17.0` and `react-router-dom@7.17.0`; fixes are available and exploitability still requires triage |
| DEP-002 | Backend compatibility | Passlib/bcrypt stack emits an internal version lookup error during password hashing | Medium | `backend/requirements.txt`, `backend/app/db/seed.py` | Open | — | Seed succeeds but logs `AttributeError: module 'bcrypt' has no attribute '__about__'` with `passlib==1.7.4` and `bcrypt==4.3.0`; pytest also warns about deprecated `crypt` usage |
| QUALITY-001 | Backend quality | Required backend Black and Flake8 gates fail | Low | `backend/tests/conftest.py` | Open | — | Black now passes; unmodified module-order setup still requires five scoped `E402` suppressions or a test bootstrap refactor for unfiltered Flake8 |
| FE-007 | Frontend performance | Production JavaScript bundle exceeds Vite's 500 kB warning threshold | Medium | Frontend production bundle | Open | — | `npm run build`: main JS is 521.44 kB (163.02 kB gzip); Vite recommends code splitting/manual chunks |
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
| Tier 2A: at least three backend critical scenarios | `backend/tests/` | 19/19 pass, including ten security/correctness/cache regression cases | Complete |
| Tier 2B: two required Playwright scenarios | `<e2e path>` | `<Playwright report>` | Not Started |
| Tier 2C: manual test plan | `docs/TEST_PLAN.md` | Matrix and automated evidence updated; manual execution pending | In Progress |
| Tier 3A: Todo Sharing specification only | `docs/TODO_SHARING_SPEC.md` | Draft structure created; specification decisions pending | In Progress |
| Tier 3B: at least three infrastructure improvements | Compose/Docker changes | `<validation>` | Not Started |
| Tier 3C: query analysis, migration, benchmark, tradeoffs | Migration and `docs/PERFORMANCE_REPORT.md` | `<plans/results>` | Not Started |
| Git workflow and PR submission | Atomic Conventional Commits and final PR | `<git log/PR>` | In Progress |
| AI disclosure | `docs/AI_USAGE.md` | Assistance log updated through backend/frontend remediation | In Progress |
| Tier 4 bonus | Tags, filters, bulk actions and tests | `<PR/test report>` | Not Started |

## Verification summary

| Check | Command/environment | Expected | Actual | Date | Evidence |
|---|---|---|---|---|---|
| Compose validation | `docker compose config -q` | Pass | Pass (exit 0) | `2026-09-18` | Rendered Compose configuration is valid |
| Backend tests | `docker compose exec -T backend pytest tests/ -v` | Pass | Pass: 9 collected, 9 passed in 1.86s; 3 deprecation warnings | `2026-09-18` | Warnings linked to `TEST-003`, `CONFIG-001`, and `DEP-002` |
| Backend regression suite | `uv run --isolated --with-requirements requirements.txt pytest tests/ -v` | Pass | Pass: 19 collected, 19 passed; 2 warning groups | `2026-09-18` | Covers AUTH-001/002, TODO-001/002/003, CACHE-001/002 |
| Backend format/lint | `black --check .`; scoped `flake8` checks | Pass | Black passes for all 28 Python files; changed app/tests pass Flake8 when existing `conftest.py` `E402` findings are excluded | `2026-09-18` | Unfiltered `flake8 app tests` remains tracked as `QUALITY-001` |
| Backend dependencies | `docker compose exec -T backend pip check` | Pass | Pass: no broken requirements found | `2026-09-18` | Command exit 0; runtime warning remains tracked as `DEP-002` |
| Frontend install | `cd frontend && npm ci` | Pass | Pass: 287 packages installed/audited | `2026-09-18` | Command exit 0 |
| Frontend lint | `cd frontend && npm run lint` | Pass | Pass (exit 0) | `2026-09-18` | ESLint completed without findings |
| Frontend unit regression | `cd frontend && npm test` | Pass | Pass: 2/2 query-isolation and session-cleanup tests | `2026-09-18` | FE-001/FE-002 regression coverage; Node 20-compatible runner |
| Frontend build | `cd frontend && npm run build` | Pass | Pass with warning: main JS 521.44 kB (163.02 kB gzip) | `2026-09-18` | `FE-007` |
| Frontend dependency audit | `cd frontend && npm audit --omit=dev` | No known production vulnerabilities | Fail: 6 vulnerabilities (5 High, 1 Moderate) | `2026-09-18` | `DEP-001`; full audit reports 9 total (7 High, 2 Moderate) |
| Playwright | `npx playwright test` | Pass | Not configured in the repository | `2026-09-18` | Tier 2B pending |
| PostgreSQL/Redis smoke | `pg_isready`; `redis-cli ping`; README seed command | Pass | Pass: PostgreSQL accepts connections, Redis returns `PONG`, seed created 100 users and 1,000 todos | `2026-09-18` | Counts verified directly in PostgreSQL |
| Service HTTP smoke | `curl http://localhost:8000/health`; `curl -I http://localhost:3000` | Pass | Pass: backend reports healthy; frontend returns HTTP 200 | `2026-09-18` | Performed after manual backend restart |
| Docker cold start | `docker compose up --build -d` from stopped stack | All services start reliably | Fail: backend exited on initial PostgreSQL connection; all services healthy only after `docker compose start backend` | `2026-09-18` | `INFRA-001` |
| Migration upgrade/downgrade | `alembic upgrade head`; `alembic current` against PostgreSQL | Pass | Upgrade/current pass at `a0790c76a129 (head)`; downgrade intentionally not run against seeded baseline | `2026-09-18` | Migration was applied during backend startup |
| Container hardening | `docker compose exec -T {backend,frontend} id`; port inspection | Non-root; data services not host-published | Fail: both app containers run as root; PostgreSQL and Redis bind to all host interfaces | `2026-09-18` | `INFRA-003`, `INFRA-004` |
| Performance benchmark | See `docs/PERFORMANCE_REPORT.md` | Improvement documented | Not run | `2026-09-18` | Benchmark environment pending |

## Residual risks and accepted limitations

| Risk | Severity | Reason not fixed | Mitigation | Owner | Review date |
|---|---|---|---|---|---|
| Cache invalidation is not coordinated with DB commit | High | Transaction/cache boundary requires a dedicated design and real Redis concurrency evidence | Keep `CACHE-003` open; TTL limits stale-entry lifetime but is not the primary control | Nguyen Dinh Duc | `2026-09-18` |
| Redis behavior is covered only by a stateful mock | Medium | Real Redis integration suite is not yet configured | Keep `TEST-002` open and run integration coverage before final submission | Nguyen Dinh Duc | `2026-09-18` |
