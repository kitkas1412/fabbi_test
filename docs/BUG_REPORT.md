# Bug Report and Issue Register

## Document control

| Field | Value |
|---|---|
| Assessment branch | `assessment/nguyen-dinh-duc` |
| Author | Nguyen Dinh Duc |
| Review date | `2026-09-18` |
| Application version/commit | `c92fd72568b87dbc49d5f69293de1762ff66c175` |
| Overall status | Initial review complete; remediation not started |

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
| AUTH-001 | JWT | Expiration verification is disabled | Critical | `backend/app/core/security.py::verify_token` | Open | — | `<test/evidence>` |
| AUTH-002 | JWT | Access dependencies do not enforce token type | Critical | `backend/app/api/deps.py::get_current_user` | Open | — | `<test/evidence>` |
| AUTH-003 | Session | Refresh rotation/revocation and logout are ineffective | High | `backend/app/api/v1/auth.py` | Open | — | `<test/evidence>` |
| AUTH-004 | Authentication | Login response enables user enumeration | Medium | `backend/app/api/v1/auth.py::login` | Open | — | `<test/evidence>` |
| AUTH-005 | Configuration | Default JWT secret can be used outside a safe local profile | High | `backend/app/core/config.py` | Open | — | `<test/evidence>` |
| TODO-001 | Authorization | Todo detail/update/delete are not owner-scoped | Critical | `backend/app/api/v1/todos.py` | Open | — | `<test/evidence>` |
| TODO-002 | Update | `completed=false` is ignored | High | `backend/app/api/v1/todos.py::update_existing_todo` | Open | — | `<test/evidence>` |
| TODO-003 | Update | An omitted description can be overwritten with `null` | High | `backend/app/api/v1/todos.py::update_existing_todo` | Open | — | `<test/evidence>` |
| CACHE-001 | Data isolation | Todo list cache key is shared across users and queries | Critical | `backend/app/api/v1/todos.py::list_todos` | Open | — | `<test/evidence>` |
| CACHE-002 | Consistency | Todo mutations do not invalidate list cache | High | `backend/app/api/v1/todos.py` | Open | — | `<test/evidence>` |
| CACHE-003 | Transactions | Cache invalidation is not coordinated with DB commit | High | Todo mutation transaction boundary | Open | — | `<test/evidence>` |
| DB-001 | Integrity | Email uniqueness is not enforced by the database | High | User model and Alembic migrations | Open | — | `<test/evidence>` |
| DB-002 | Pagination | Todo queries have no deterministic ordering | Medium | `backend/app/services/todo_service.py::get_todos` | Open | — | `<test/evidence>` |
| DB-003 | Performance | Todo list performs an additional user query per row | Medium | `backend/app/api/v1/todos.py::list_todos` | Open | — | `<test/evidence>` |
| DB-004 | Performance | Core Todo queries lack a measured composite-index strategy | Medium | `todos` table migrations | Open | — | `<benchmark>` |
| API-001 | Resource control | Todo page size has no upper bound | Medium | `backend/app/api/v1/todos.py::list_todos` | Open | — | `<test/evidence>` |
| FE-001 | Data isolation | Todo React Query key omits user and pagination context | High | `frontend/src/features/todos/api/todos.ts` | Open | — | `<test/evidence>` |
| FE-002 | Session | Logout/account change does not clear user-scoped query data | High | Auth hooks and query client | Open | — | `<test/evidence>` |
| FE-003 | State | Optimistic update does not restore the snapshot on error | Medium | `frontend/src/features/todos/api/todos.ts` | Open | — | `<test/evidence>` |
| FE-004 | Authentication | Global 401 handling reloads login and can hide form errors | Medium | `frontend/src/lib/api.ts` | Open | — | `<test/evidence>` |
| FE-005 | Pagination | Frontend requests 10,000 Todos by default | Medium | `frontend/src/features/todos/api/todos.ts::useTodos` | Open | — | `<test/evidence>` |
| FE-006 | React | Todo rows use array indexes as keys | Low | `frontend/src/features/todos/components/TodoList.tsx` | Open | — | `<test/evidence>` |
| INFRA-001 | Startup | Compose has no dependency healthchecks/readiness conditions | High | `docker-compose.yml` | Open | — | `<cold-start evidence>` |
| INFRA-002 | Secrets | Development credentials are embedded in tracked configuration | High | Compose, settings, tracked `.env` files | Open | — | `<scan/evidence>` |
| INFRA-003 | Network | PostgreSQL and unauthenticated Redis are published to the host | High | `docker-compose.yml` | Open | — | `<config evidence>` |
| INFRA-004 | Containers | Images run as root and lack scoped `.dockerignore` files | Medium | Backend/frontend Dockerfiles | Open | — | `<image evidence>` |
| INFRA-005 | Build | Frontend build is not reproducible and runtime Vite env is ineffective | Medium | Frontend Dockerfile and Compose | Open | — | `<build evidence>` |
| TEST-001 | Coverage | Existing tests cover happy paths but not security boundaries | High | `backend/tests/` | Open | — | `<test report>` |
| TEST-002 | Fidelity | SQLite and per-request Redis mocks do not validate production behavior | Medium | `backend/tests/conftest.py` | Open | — | `<integration report>` |
| DOC-001 | Deliverables | `docs/` was ignored despite required assessment documents | Medium | `.gitignore` | Fixed | Pending commit | `git check-ignore` confirms deliverables are visible and `docs/ANSWER_KEY.md` remains ignored |

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
| Tier 1: at least five fixes, including two backend and one frontend | Finding register and implementation PRs | `<IDs/links>` | Not Started |
| Tier 2A: at least three backend critical scenarios | `backend/tests/` | `<pytest report>` | Not Started |
| Tier 2B: two required Playwright scenarios | `<e2e path>` | `<Playwright report>` | Not Started |
| Tier 2C: manual test plan | `docs/TEST_PLAN.md` | Initial test matrix created; execution pending | In Progress |
| Tier 3A: Todo Sharing specification only | `docs/TODO_SHARING_SPEC.md` | Draft structure created; specification decisions pending | In Progress |
| Tier 3B: at least three infrastructure improvements | Compose/Docker changes | `<validation>` | Not Started |
| Tier 3C: query analysis, migration, benchmark, tradeoffs | Migration and `docs/PERFORMANCE_REPORT.md` | `<plans/results>` | Not Started |
| Git workflow and PR submission | Atomic Conventional Commits and final PR | `<git log/PR>` | In Progress |
| AI disclosure | `docs/AI_USAGE.md` | Initial Codex assistance log recorded | In Progress |
| Tier 4 bonus | Tags, filters, bulk actions and tests | `<PR/test report>` | Not Started |

## Verification summary

| Check | Command/environment | Expected | Actual | Date | Evidence |
|---|---|---|---|---|---|
| Backend tests | `PYTHONPATH=backend python3 -m pytest backend/tests -p no:cacheprovider` | Pass | Blocked: system Python 3.14.7 has no `pytest` installed | `2026-09-18` | Terminal: `No module named pytest` |
| Backend format/lint | `cd backend && black --check . && flake8 app tests` | Pass | Not run; backend dependencies are not installed locally | `2026-09-18` | Baseline pending |
| Frontend lint | `cd frontend && npm run lint` | Pass | Not run; `npm ci` baseline is pending | `2026-09-18` | Baseline pending |
| Frontend build | `cd frontend && npm run build` | Pass | Not run; `npm ci` baseline is pending | `2026-09-18` | Baseline pending |
| Playwright | `npx playwright test` | Pass | Not configured in the repository | `2026-09-18` | Tier 2B pending |
| PostgreSQL/Redis integration | To be defined | Pass | Not run | `2026-09-18` | Integration harness pending |
| Docker cold start | `docker compose up --build` | Healthy | Not run; Docker 29.5.2 and Compose 5.1.4 are available | `2026-09-18` | Baseline pending |
| Migration upgrade/downgrade | To be defined against PostgreSQL | Pass | Not run | `2026-09-18` | Baseline pending |
| Performance benchmark | See `docs/PERFORMANCE_REPORT.md` | Improvement documented | Not run | `2026-09-18` | Benchmark environment pending |

## Residual risks and accepted limitations

| Risk | Severity | Reason not fixed | Mitigation | Owner | Review date |
|---|---|---|---|---|---|
| No risk accepted at initial review | — | Remediation decisions are pending verification | Keep all findings Open until tested and resolved | Nguyen Dinh Duc | `2026-09-18` |
