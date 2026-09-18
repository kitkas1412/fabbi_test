# Manual Test Plan

## Document control

| Field | Value |
|---|---|
| Scope/version | Baseline commit `c92fd72568b87dbc49d5f69293de1762ff66c175` plus uncommitted assessment documents |
| Author | Nguyen Dinh Duc |
| Test window | `2026-09-18` – TBD |
| Environment | Local macOS baseline; Docker environment pending |
| Overall result | Setup in progress; no manual cases executed |

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
| Browser | Not selected | Not Ready |
| Frontend | Node 24.17.0 / npm 11.13.0; `http://localhost:3000` | Dependencies and server not started |
| Backend | System Python 3.14.7; application targets Python 3.12 | Dependencies and server not started |
| PostgreSQL | Planned Compose image `postgres:16-alpine` | Not started |
| Redis | Planned Compose image `redis:7` | Not started |
| Docker | Docker 29.5.2 / Compose 5.1.4 | CLI available; stack not started |
| OS | macOS 26.6.2 (Build 25G83) | Ready |
| Commit | `c92fd72568b87dbc49d5f69293de1762ff66c175` | Baseline identified |

Required test identities:

| Account | Purpose | Setup method |
|---|---|---|
| User A | Owner of private Todo/tag data | Planned API/fixture setup; account not created |
| User B | Cross-user authorization checks | Planned API/fixture setup; account not created |
| Revoked/deleted user | Token lifecycle checks | Planned fixture; account not created |

Do not record real passwords or tokens in this document. Use disposable local test credentials supplied through test configuration.

## 4. Entry criteria

- [x] Target commit is identified.
- [ ] Required services are healthy.
- [ ] Database migrations completed successfully.
- [ ] Test data can be reset deterministically.
- [x] Automated smoke-test blocker is documented: local Python does not have `pytest` installed.
- [x] No production credentials or data are used in the initial review; tracked values are development placeholders.

## 5. Exit criteria

- [ ] All Critical and High cases pass.
- [ ] No cross-user data is visible in API, UI, logs, or caches.
- [ ] Failed cases have linked defects in `docs/BUG_REPORT.md`.
- [ ] Actual Result, Status, executor, and date are filled for every executed case.
- [ ] Retest and regression results are recorded after fixes.

## 6. Test case matrix

| ID | Area | Scenario | Preconditions | Steps | Expected result | Priority / Severity | Actual result | Status |
|---|---|---|---|---|---|---|---|---|
| AUTH-01 | Registration | Register a new valid user | Email is unused | Submit valid registration form | User is created and valid tokens/session are returned | High / Major | `<actual>` | Not Run |
| AUTH-02 | Registration | Register duplicate email concurrently | Email is unused; two clients ready | Submit two registrations at the same time | Exactly one user is created; the other request gets a stable conflict response | High / Critical | `<actual>` | Not Run |
| AUTH-03 | Login | Invalid email and invalid password do not enumerate users | One known user | Try unknown email, then known email with wrong password | Both produce the same public status/message | High / Security | `<actual>` | Not Run |
| AUTH-04 | JWT | Expired access token is rejected | Expired token available | Call `/auth/me` and `/todos` | Both return 401 without protected data | High / Critical | `<actual>` | Not Run |
| AUTH-05 | JWT | Tampered token is rejected | Valid token available | Modify payload/signature and call protected API | Request returns 401 | High / Critical | `<actual>` | Not Run |
| AUTH-06 | JWT | Refresh token cannot act as access token | Valid refresh token | Call protected Todo endpoint with refresh token | Request returns 401 | High / Critical | `<actual>` | Not Run |
| AUTH-07 | Refresh | Refresh token rotates once | Valid refresh token | Refresh, then reuse old token | New pair is issued; old refresh token is rejected | High / Critical | `<actual>` | Not Run |
| AUTH-08 | Logout | Logout revokes the refresh session | Logged-in user | Logout, then try refresh | Refresh is rejected | High / Critical | `<actual>` | Not Run |
| TODO-01 | CRUD | Owner completes full Todo lifecycle | User A logged in | Create, read, update, delete a Todo | Every operation succeeds and final read is 404 | High / Major | `<actual>` | Not Run |
| TODO-02 | Authorization | User B cannot read User A's Todo | User A owns Todo X; User B logged in | B requests `GET /todos/X` | 404 without data disclosure | High / Critical | `<actual>` | Not Run |
| TODO-03 | Authorization | User B cannot update User A's Todo | Same as above | B updates X | 404; Todo remains unchanged | High / Critical | `<actual>` | Not Run |
| TODO-04 | Authorization | User B cannot delete User A's Todo | Same as above | B deletes X | 404; Todo still exists for A | High / Critical | `<actual>` | Not Run |
| TODO-05 | Update | Toggle completed from true to false | Todo is completed | Submit `completed=false`, reload Todo | Persisted value is false | High / Major | `<actual>` | Not Run |
| TODO-06 | Update | Partial title update preserves description | Todo has title and description | Update only title, then reload | Description is unchanged | High / Major | `<actual>` | Not Run |
| TODO-07 | Pagination | Pagination is bounded and deterministic | Multiple Todos, including equal timestamps | Request sequential pages and oversized page | Stable order, no duplicates/omissions, oversized request rejected/capped | Medium / Major | `<actual>` | Not Run |
| CACHE-01 | Isolation | User cache entries are isolated | A and B own different Todos | A loads list, then B loads list | B sees only B's data | High / Critical | `<actual>` | Not Run |
| CACHE-02 | Query scope | Pagination/filter changes cache identity | Cached list exists | Change page, size, filter, sort | Correct query-specific result is returned | High / Major | `<actual>` | Not Run |
| CACHE-03 | Invalidation | Create/update/delete invalidates stale list | User has cached list | Perform each mutation, reload list | Latest committed data is returned immediately | High / Major | `<actual>` | Not Run |
| FE-01 | Session | Logout clears user-scoped client data | User A has loaded Todos | Logout; log in as B | No A data flashes or remains in cache/UI | High / Critical | `<actual>` | Not Run |
| FE-02 | Error UX | Invalid login shows error without hard reload | Login page open | Submit wrong credentials | Stable error is shown; form remains usable | Medium / Major | `<actual>` | Not Run |
| FE-03 | Optimistic UI | Failed update rolls back | Simulate update failure | Toggle/edit Todo | UI restores previous value and reports failure | Medium / Major | `<actual>` | Not Run |
| INFRA-01 | Startup | Clean Docker cold start is dependable | Volumes/services stopped | Start stack from clean state repeatedly | Dependencies become healthy and backend starts without race failure | High / Major | `<actual>` | Not Run |
| INFRA-02 | Security | Production config does not expose DB/cache or default secrets | Production Compose rendered | Inspect config and container metadata | No published DB/cache port or embedded default secret | High / Security | `<actual>` | Not Run |
| TAG-01 | Tier 4 | Duplicate tag names ignore casing per user | Tier 4 enabled; User A logged in | Create `Work`, then `work` | Second create is rejected consistently | Medium / Major | `<actual>` | Not Run |
| TAG-02 | Tier 4 | Cross-user tag attach is rejected | A owns Todo; B owns tag | Attempt cross-user attach | Request fails; no relation is created | High / Critical | `<actual>` | Not Run |
| FILTER-01 | Tier 4 | Combined filters return correct stable page | Tagged Todos across dates/statuses | Apply tag, status, keyword and date filters | Only matching records, stable order and correct total | Medium / Major | `<actual>` | Not Run |
| BULK-01 | Tier 4 | Bulk status update is owner-scoped and atomic | Payload includes owned and foreign IDs | Submit bulk update | Whole request fails or follows documented atomic policy; foreign Todo unchanged | High / Critical | `<actual>` | Not Run |

Add cases for every new finding or acceptance criterion. Keep test IDs stable across executions.

## 7. Execution log

| Run ID | Date/time | Commit | Environment | Executor | Scope | Result | Evidence |
|---|---|---|---|---|---|---|---|
| RUN-001 | `2026-09-18` | `c92fd72` | Local macOS / Python 3.14.7 | Nguyen Dinh Duc with Codex assistance | Backend automated-test baseline | Blocked before collection: `pytest` is not installed | Command output: `No module named pytest` |

## 8. Defect log

| Test case | Bug ID | Summary | Severity | Retest status |
|---|---|---|---|---|
| `<case ID>` | `<BUG ID>` | `<summary>` | `<severity>` | `<status>` |

## 9. Known limitations and residual risk

- Backend dependencies are not installed in the local system Python environment.
- The project targets Python 3.12, while the current system interpreter is Python 3.14.7; use a project virtual environment or Docker for reproducible verification.
- PostgreSQL, Redis, backend, and frontend services have not yet been started for this assessment run.
- Playwright and frontend unit/component tests are not configured yet.
- Existing backend tests use SQLite and a Redis mock, so PostgreSQL/Redis integration coverage must be added separately.

## 10. Approval

| Role | Name | Decision | Date | Notes |
|---|---|---|---|---|
| Author | Nguyen Dinh Duc | Pending | `2026-09-18` | Initial structure and environment metadata recorded; execution pending |
| Reviewer | `<name>` | Pending | `<date>` | — |
