# Manual Test Plan

## Document control

| Field | Value |
|---|---|
| Scope/version | HEAD `33bac3fe43bbeb0c67becd8e45d00cd1d119dcae` plus pending Journey 1 worktree |
| Author | Nguyen Dinh Duc |
| Test window | `2026-09-18` – automated remediation and Journey 1 retest complete; manual/Journey 2 execution pending |
| Environment | macOS 26.6.2; Docker 29.5.2 / Compose 5.1.4; Compose application stack |
| Overall result | Backend/frontend regressions and lifecycle Journey 1 pass; cross-user Journey 2, manual cases, and remaining infrastructure work are pending |

## 1. Objective

Verify authentication, authorization, Todo CRUD, caching, frontend session isolation, infrastructure readiness, and optional Tier 4 behavior. This plan complements automated tests; it does not replace pytest, integration tests, or Playwright.

## 2. Scope

### In scope

- Registration, login, refresh, logout, and token rejection.
- User-to-user authorization boundaries.
- Todo create/read/update/delete and partial updates.
- Backend Redis cache isolation and invalidation.
- Frontend query/cache behavior across account changes.
- Docker cold-start and service health.
- Tag, filtering, and bulk-action behavior when Tier 4 is implemented.

### Out of scope

- Todo Sharing implementation; Tier 3A requires specification only.
- Third-party penetration testing.
- Production load testing outside the documented benchmark environment.

## 3. Test environment and prerequisites

| Component | Version/configuration | Status |
|---|---|---|
| Browser | Playwright 1.63.0 / Chromium 153.0.8010.12 | Suite 2/2 passes; required lifecycle Journey 1 complete and cross-user Journey 2 pending |
| Frontend | Host Node 24.17.0 / npm 11.13.0; Playwright Vite `http://127.0.0.1:4173` | Unit regressions 2/2, Playwright 2/2, lint, and production build pass |
| Backend | Container Python 3.12; isolated host Python 3.12.12 test environment; `http://localhost:8000` | Regression suite 19/19, Black, and unfiltered Flake8 pass; Compose baseline still requires a manual backend restart |
| PostgreSQL | Compose image `postgres:16-alpine` | Running; migration at head; 100 users and 1,000 todos seeded |
| Redis | Compose image `redis:7` | Running; `PING` returns `PONG` |
| Docker | Docker 29.5.2 / Compose 5.1.4 | Stack running; cold-start readiness defect reproduced |
| OS | macOS 26.6.2 (Build 25G83) | Ready |
| Commit | `33bac3fe43bbeb0c67becd8e45d00cd1d119dcae` plus pending Journey 1 worktree | Automated remediation and lifecycle browser retests executed |

Required test identities:

| Account | Purpose | Setup method |
|---|---|---|
| User A | Owner of private Todo/tag data | Journey 1 generates a unique disposable registration per run |
| User B | Cross-user authorization checks | Planned API/fixture setup; account not created |
| Revoked/deleted user | Token lifecycle checks | Planned fixture; account not created |

Do not record real passwords or tokens in this document. Use disposable local test credentials supplied through test configuration.

## 4. Entry criteria

- [x] Target commit is identified.
- [x] Required services are healthy after the documented manual backend restart.
- [x] Database migrations completed successfully at `a0790c76a129 (head)`.
- [ ] Test data can be reset deterministically.
- [x] Backend automated tests were executed after remediation: 19/19 passed.
- [x] Backend Black and unfiltered Flake8 gates pass on the remediated tree.
- [x] Frontend query-isolation/session-cleanup unit tests were executed: 2/2 passed.
- [x] Frontend lint and production build pass; the bundle-size warning remains tracked as `FE-007`.
- [x] Playwright Chromium suite passes 2/2, including required lifecycle Journey 1.
- [x] No production credentials or data are used in assessment verification; tracked values are development placeholders.

## 5. Exit criteria

- [ ] All Critical and High cases pass.
- [ ] No cross-user data is visible in API, UI, logs, or caches.
- [ ] Failed cases have linked defects in `docs/BUG_REPORT.md`.
- [ ] Actual Result, Status, executor, and date are filled for every executed case.
- [ ] Retest and regression results are recorded after fixes.

## 6. Test case matrix

| ID | Area | Scenario | Preconditions | Steps | Expected result | Priority / Severity | Actual result | Status |
|---|---|---|---|---|---|---|---|---|
| AUTH-01 | Registration | Register a new valid user | Email is unused | Submit valid registration form | User is created and valid tokens/session are returned | High / Major | Journey 1 receives 201, reaches the dashboard, and displays the registered email | Pass (E2E) |
| AUTH-02 | Registration | Register duplicate email concurrently | Email is unused; two clients ready | Submit two registrations at the same time | Exactly one user is created; the other request gets a stable conflict response | High / Critical | `<actual>` | Not Run |
| AUTH-03 | Login | Invalid email and invalid password do not enumerate users | One known user | Try unknown email, then known email with wrong password | Both produce the same public status/message | High / Security | `<actual>` | Not Run |
| AUTH-04 | JWT | Expired access token is rejected | Expired token available | Call `/auth/me` and `/todos` | Both return 401 without protected data | High / Critical | Automated regression confirms `/auth/me` returns 401; `/todos` manual check remains | Partial (Automated) |
| AUTH-05 | JWT | Tampered token is rejected | Valid token available | Modify payload/signature and call protected API | Request returns 401 | High / Critical | `<actual>` | Not Run |
| AUTH-06 | JWT | Refresh token cannot act as access token | Valid refresh token | Call protected Todo endpoint with refresh token | Request returns 401 | High / Critical | Automated regression confirms access-only `/auth/me` rejects the refresh token; Todo endpoint manual check remains | Partial (Automated) |
| AUTH-07 | Refresh | Refresh token rotates once | Valid refresh token | Refresh, then reuse old token | New pair is issued; old refresh token is rejected | High / Critical | `<actual>` | Not Run |
| AUTH-08 | Logout | Logout revokes the refresh session | Logged-in user | Logout, then try refresh | Refresh is rejected | High / Critical | `<actual>` | Not Run |
| AUTH-09 | Login | Registered user can log in with valid credentials | Journey 1 account exists and is logged out | Submit the registered email/password | Login returns 200 and the dashboard displays the account | High / Major | Journey 1 logs out after registration, logs back in, and reaches the authenticated dashboard | Pass (E2E) |
| TODO-01 | CRUD | Owner completes full Todo lifecycle | User A logged in | Create, read, update, delete a Todo | Every operation succeeds and final read is 404 | High / Major | Journey 1 creates, edits, completes, and deletes through the UI; a final authenticated GET returns 404 | Pass (E2E) |
| TODO-02 | Authorization | User B cannot read User A's Todo | User A owns Todo X; User B logged in | B requests `GET /todos/X` | 404 without data disclosure | High / Critical | Cross-user GET returns 404 and owner can still read the unchanged Todo | Pass (Automated) |
| TODO-03 | Authorization | User B cannot update User A's Todo | Same as above | B updates X | 404; Todo remains unchanged | High / Critical | Cross-user PUT returns 404; owner title and completion state remain unchanged | Pass (Automated) |
| TODO-04 | Authorization | User B cannot delete User A's Todo | Same as above | B deletes X | 404; Todo still exists for A | High / Critical | Cross-user DELETE returns 404 and owner can still retrieve the Todo | Pass (Automated) |
| TODO-05 | Update | Toggle completed from true to false | Todo is completed | Submit `completed=false`, reload Todo | Persisted value is false | High / Major | API regression confirms response and subsequent GET persist `false` | Pass (Automated) |
| TODO-06 | Update | Partial title update preserves description | Todo has title and description | Update only title, then reload | Description is unchanged | High / Major | API regression confirms response and subsequent GET preserve description | Pass (Automated) |
| TODO-07 | Pagination | Pagination is bounded and deterministic | Multiple Todos, including equal timestamps | Request sequential pages and oversized page | Stable order, no duplicates/omissions, oversized request rejected/capped | Medium / Major | `<actual>` | Not Run |
| CACHE-01 | Isolation | User cache entries are isolated | A and B own different Todos | A loads list, then B loads list | B sees only B's data | High / Critical | Stateful Redis-mock regression confirms each user receives only their own Todo | Pass (Mock) |
| CACHE-02 | Query scope | Pagination/filter changes cache identity | Cached list exists | Change page, size, filter, sort | Correct query-specific result is returned | High / Major | Page/size variants return distinct pages; filters/sort are not implemented in current API | Pass for current query contract (Mock) |
| CACHE-03 | Invalidation | Create/update/delete invalidates stale list | User has cached list | Perform each mutation, reload list | Latest committed data is returned immediately | High / Major | Mock regression passes; Journey 1 observes fresh create/edit/complete/delete state against PostgreSQL and real Redis | Pass (Integration) |
| FE-01 | Session | Logout clears user-scoped client data | User A has loaded Todos | Logout; log in as B | No A data flashes or remains in cache/UI | High / Critical | Unit regression passes; Journey 1 confirms both tokens are cleared after logout, while cross-user browser verification remains pending | Partial (Unit + E2E) |
| FE-02 | Error UX | Invalid login shows error without hard reload | Login page open | Submit wrong credentials | Stable error is shown; form remains usable | Medium / Major | `<actual>` | Not Run |
| FE-03 | Optimistic UI | Failed update rolls back | Simulate update failure | Toggle/edit Todo | UI restores previous value and reports failure | Medium / Major | `<actual>` | Not Run |
| FE-04 | Query isolation | Todo query identity includes account and pagination | Query key factory available | Compare keys for different users, pages, and sizes | Every response-changing input produces a distinct key | High / Critical | Node unit regression confirms distinct keys for user, page, and size | Pass (Unit) |
| INFRA-01 | Startup | Clean Docker cold start is dependable | Volumes/services stopped | Start stack from clean state repeatedly | Dependencies become healthy and backend starts without race failure | High / Major | Backend exited on its first PostgreSQL connection and required a manual restart | Fail (`INFRA-001`) |
| INFRA-02 | Security | Production config does not expose DB/cache or default secrets | Production Compose rendered | Inspect config and container metadata | No published DB/cache port or embedded default secret | High / Security | Current Compose embeds development credentials, publishes PostgreSQL/Redis, and runs app containers as root | Fail (`INFRA-002`–`INFRA-004`) |
| TAG-01 | Tier 4 | Duplicate tag names ignore casing per user | Tier 4 enabled; User A logged in | Create `Work`, then `work` | Second create is rejected consistently | Medium / Major | `<actual>` | Not Run |
| TAG-02 | Tier 4 | Cross-user tag attach is rejected | A owns Todo; B owns tag | Attempt cross-user attach | Request fails; no relation is created | High / Critical | `<actual>` | Not Run |
| FILTER-01 | Tier 4 | Combined filters return correct stable page | Tagged Todos across dates/statuses | Apply tag, status, keyword and date filters | Only matching records, stable order and correct total | Medium / Major | `<actual>` | Not Run |
| BULK-01 | Tier 4 | Bulk status update is owner-scoped and atomic | Payload includes owned and foreign IDs | Submit bulk update | Whole request fails or follows documented atomic policy; foreign Todo unchanged | High / Critical | `<actual>` | Not Run |

Add cases for every new finding or acceptance criterion. Keep test IDs stable across executions.

## 7. Execution log

| Run ID | Date/time | Commit | Environment | Executor | Scope | Result | Evidence |
|---|---|---|---|---|---|---|---|
| RUN-001 | `2026-09-18` | `c92fd72` | Local macOS / Python 3.14.7 | Nguyen Dinh Duc with Codex assistance | Backend automated-test baseline | Blocked before collection: `pytest` is not installed | Command output: `No module named pytest` |
| RUN-002 | `2026-09-18 12:13 +07:00` | `3d1936b` | Docker Compose 5.1.4 | Nguyen Dinh Duc with Codex assistance | Compose validation and cold start | **Fail**: config valid and images build, but backend exits before PostgreSQL is ready; manual restart succeeds | Backend log: `ConnectionRefusedError` to PostgreSQL; `INFRA-001` |
| RUN-003 | `2026-09-18 12:15 +07:00` | `3d1936b` | Backend container / Python 3.12 | Nguyen Dinh Duc with Codex assistance | Pytest regression baseline | **Pass with warnings**: 9/9 passed in 1.86s; 3 compatibility/deprecation warning groups | `TEST-003`, `CONFIG-001`, `DEP-002` |
| RUN-004 | `2026-09-18 12:15 +07:00` | `3d1936b` | Backend container | Nguyen Dinh Duc with Codex assistance | Black, Flake8, dependency consistency | **Fail**: Black 1 file; Flake8 5 × `E402`; `pip check` passes | `QUALITY-001`; `No broken requirements found` |
| RUN-005 | `2026-09-18 12:16 +07:00` | `3d1936b` | Host Node 24.17.0 / npm 11.13.0 | Nguyen Dinh Duc with Codex assistance | Frontend install, lint, build | **Pass with warning**: `npm ci`, lint and build pass; main JS is 521.24 kB | `FE-007` |
| RUN-006 | `2026-09-18 12:17 +07:00` | `3d1936b` | Host npm audit | Nguyen Dinh Duc with Codex assistance | Frontend dependency security | **Fail**: production audit reports 6 vulnerabilities (5 High, 1 Moderate); full tree reports 9 | `DEP-001` |
| RUN-007 | `2026-09-18 12:20 +07:00` | `3d1936b` | PostgreSQL 16 / Redis 7 / Compose stack | Nguyen Dinh Duc with Codex assistance | Migration, health, seed, runtime smoke | **Pass with warning**: migration at head, DB/Redis/HTTP healthy, 100 users and 1,000 todos seeded; password hash emits passlib/bcrypt error log | `DEP-002`; direct DB counts `users=100`, `todos=1000` |
| RUN-008 | `2026-09-18 12:20 +07:00` | `3d1936b` | Compose containers | Nguyen Dinh Duc with Codex assistance | Container privilege and exposed-port check | **Fail**: backend/frontend run as root; PostgreSQL/Redis published on all host interfaces | `INFRA-003`, `INFRA-004` |
| RUN-009 | `2026-09-18` | `5816658` | Isolated host Python 3.13.12 / SQLite / stateful Redis mock | Nguyen Dinh Duc with Codex assistance | Full backend remediation regression | **Pass with warnings**: 19/19 passed; Pydantic config and custom event-loop warnings remain | AUTH-001/002, TODO-001/002/003, CACHE-001/002 |
| RUN-010 | `2026-09-18` | `d5fa690` | Host Node 24.17.0 / npm 11.13.0 | Nguyen Dinh Duc with Codex assistance | Frontend unit regression, lint, and production build | **Pass with warning**: 2/2 tests, ESLint pass, build pass; bundle remains 521.44 kB | FE-001/002/003; `FE-007` |
| RUN-011 | `2026-09-18` | `23b039e` + E402 working tree | Isolated Python 3.12.12 / SQLite / stateful Redis mock; Node 24.17.0 / npm 11.13.0 | Nguyen Dinh Duc with Codex assistance | Full backend and frontend quality-gate rerun | **Pass with warnings**: backend 19/19, Black and unfiltered Flake8 pass; frontend 2/2, ESLint and build pass; 3 backend deprecation warnings and the 521.44 kB bundle warning remain | `QUALITY-001` verified; `TEST-003`, `CONFIG-001`, `DEP-002`, and `FE-007` remain open |
| RUN-012 | `2026-09-18` | `24bba4d` + Playwright working tree | Node 24.17.0 / npm 11.13.0 / Playwright 1.63.0 / Chromium 153.0.8010.12 | Nguyen Dinh Duc with Codex assistance | Playwright installation/configuration and frontend regression | **Pass with warning**: Chromium smoke 1/1, unit tests 2/2, ESLint and build pass; bundle remains 521.44 kB | Browser setup verified; complete user journey and cross-user isolation scenarios remain pending |
| RUN-013 | `2026-09-18` | `33bac3f` + Journey 1 worktree | Playwright 1.63.0 / Chromium 153.0.8010.12 / Vite 4173 / current Docker backend, PostgreSQL, and Redis | Nguyen Dinh Duc with Codex assistance | Lifecycle Journey 1 plus frontend regression | **Pass with warnings**: Playwright 2/2, unit tests 2/2, ESLint and build pass; dialogs emit accessibility warnings and bundle is 521.53 kB | Register → logout/login → create → edit → complete → delete → GET 404 → logout; Journey 2 pending |

## 8. Defect log

| Test case | Bug ID | Summary | Severity | Retest status |
|---|---|---|---|---|
| INFRA-01 | INFRA-001 | Backend loses the Compose cold-start race with PostgreSQL | High | Pending fix |
| INFRA-02 | INFRA-002 | Development credentials are embedded in tracked Compose configuration | High | Pending fix |
| INFRA-02 | INFRA-003 | PostgreSQL and unauthenticated Redis are published to the host | High | Pending fix |
| INFRA-02 | INFRA-004 | Backend and frontend containers run as root | Medium | Pending fix |
| AUTH-04 | AUTH-001 | Expired access tokens were accepted | Critical | Automated retest passed for `/auth/me`; manual endpoint matrix pending |
| AUTH-06 | AUTH-002 | Refresh tokens could access protected endpoints | Critical | Automated retest passed for `/auth/me`; manual endpoint matrix pending |
| TODO-02/03/04 | TODO-001 | Todo item operations were not owner-scoped | Critical | Automated retest passed |
| TODO-05/06 | TODO-002/003 | Partial updates mishandled false and omitted fields | High | Automated retest passed |
| CACHE-01/02/03 | CACHE-001/002 | Cache leaked across users/queries and served stale mutations | Critical / High | Stateful-mock retest passed; Journey 1 real-Redis mutation path passed; cross-user real-Redis coverage pending |
| FE-01/04 | FE-001/002 | Client query identity and logout cleanup were not account-safe | High | Unit retest and Journey 1 logout passed; cross-user browser E2E pending |

## 9. Known limitations and residual risk

- Backend dependencies are not installed in the default system environment; the latest remediation run used isolated `uv --no-project` execution on Python 3.12.12, matching the project's Python 3.12 target without creating a project `uv.lock`.
- The stack is currently running, but the backend does not survive a clean cold start reliably without a manual restart.
- Seed data is suitable for local smoke/benchmark preparation but is randomly generated and is not a deterministic reset fixture.
- Playwright lifecycle Journey 1 uses a unique disposable registration and passes; cross-user isolation Journey 2 still needs two-account setup and implementation. Created Todo data is deleted, but registered E2E users remain because the application has no user-deletion endpoint.
- Existing backend tests use SQLite and a Redis mock, so PostgreSQL/Redis integration coverage must be added separately.

## 10. Approval

| Role | Name | Decision | Date | Notes |
|---|---|---|---|---|
| Author | Nguyen Dinh Duc | Pending | `2026-09-18` | Automated remediation and Journey 1 recorded; manual, dedicated integration, and Journey 2 execution pending |
| Reviewer | `<name>` | Pending | `<date>` | — |
