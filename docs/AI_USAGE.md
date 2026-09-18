# AI Assistance Disclosure

## Document control

| Field | Value |
|---|---|
| Candidate | Nguyen Dinh Duc |
| Assessment branch | `assessment/nguyen-dinh-duc` |
| Covered period | `2026-09-18` – ongoing |
| Last updated | `2026-09-18` |
| Status | In Progress |

## 1. Disclosure statement

AI-assisted tools are being used during this assessment for repository analysis, risk prioritization, planning, and documentation scaffolding. Generated suggestions are treated as drafts until reviewed against the repository, README requirements, tests, and runtime behavior. The candidate remains responsible for every submitted change and decision.

## 2. Tools used

| Tool/model | Purpose | Access level | Data shared | Human verification |
|---|---|---|---|---|
| OpenAI Codex | Repository review, security/correctness analysis, assessment planning, and Markdown drafting | Read/write access to the assessment workspace | Repository source, configuration, Git metadata, and user-provided prompts; no production data or credentials | Compared with `README.md`, source code, Git state, and local static checks; candidate review remains required |

## 3. Assistance log

Record material assistance, not every autocomplete event. Group closely related prompts when appropriate.

| ID | Date | Task | Prompt summary or sanitized prompt | Files/areas affected | Output used | Verification |
|---|---|---|---|---|---|---|
| AI-001 | `2026-09-18` | Repository analysis | Review the complete project structure and identify suspicious or unsafe behavior | Backend, frontend, Docker, dependencies, Git history | Accepted as an initial audit; findings remain Open until reproduced | Static source/config review and Git inspection |
| AI-002 | `2026-09-18` | Agent guidance | Read the project and create repository-specific instructions | `AGENTS.md` | Draft accepted into the worktree | Compared with README, GUIDE, source layout, and tool configuration |
| AI-003 | `2026-09-18` | Remediation planning | Create and expand a senior-level remediation sequence covering all mandatory and bonus requirements | `REMEDIATION_PLAN.md` | Draft accepted into the worktree | Cross-checked against every README tier and Git rule |
| AI-004 | `2026-09-18` | Requirements analysis | Re-read README and extract mandatory, optional, scoring, branch, commit, and submission rules | `README.md`, planning documents | Used to update the plan and guidance | Direct line-by-line README review |
| AI-005 | `2026-09-18` | Documentation scaffolding | Create assessment templates for findings, manual tests, Todo Sharing, performance evidence, and AI disclosure | `.gitignore`, `docs/*.md` | Accepted as draft templates | Ignore behavior and Markdown structure checked locally |
| AI-006 | `2026-09-18` | Initial metadata | Populate verifiable branch, commit, environment, test-blocker, and assistance information | `docs/BUG_REPORT.md`, `docs/TEST_PLAN.md`, `docs/AI_USAGE.md` | Accepted as initial data; candidate identity spelling/sign-off must be confirmed | Git metadata and local tool versions queried directly |
| AI-007 | `2026-09-18` | Backend regression coverage | Add API regressions for JWT expiry/type, Todo ownership, cache isolation/invalidation, and partial updates | `backend/tests/` | Tests accepted and committed | Baseline failures reproduced; final backend suite passes 19/19 |
| AI-008 | `2026-09-18` | Backend remediation | Fix JWT validation, owner-scoped Todo access, partial updates, and versioned user/query cache behavior | Backend security, dependencies, Todo routes/services, Redis wrapper | Changes accepted as atomic remediation commits | Targeted regressions, full pytest, Black, and scoped Flake8 checks |
| AI-009 | `2026-09-18` | Frontend remediation | Scope Todo query keys, clear session cache on logout/account change/401, and restore optimistic snapshots | Frontend auth, API client, Todo hooks/components, unit-test setup | Changes accepted and committed | `npm test` 2/2, `npm run lint`, and `npm run build` pass |
| AI-010 | `2026-09-18` | Evidence synchronization | Update issue status, test results, residual risks, and AI disclosure without marking unexecuted work complete | `docs/BUG_REPORT.md`, `docs/TEST_PLAN.md`, `docs/AI_USAGE.md` | Documentation updated to current commit evidence | Compared against Git history and recorded command output |
| AI-011 | `2026-09-18` | Backend quality and full verification | Document intentional post-`DATABASE_URL` imports, remove the unused incompatible `uv.lock`, and rerun all backend/frontend gates | `backend/tests/conftest.py`, `backend/uv.lock`, assessment evidence in `docs/` | Scoped E402 fix and lockfile removal accepted; evidence synchronized | Python 3.12.12 backend tests 19/19, Black and unfiltered Flake8 pass; frontend tests 2/2, ESLint and build pass |
| AI-012 | `2026-09-18` | Playwright setup | Install and configure Playwright with Chromium, Vite web-server lifecycle, CI-safe retries/artifacts, scripts, and a backend-independent smoke test | Frontend dependencies, Playwright config, smoke test, ignore rules, and documentation | Setup accepted into the worktree; required Tier 2B journeys remain pending | Chromium smoke 1/1, unit tests 2/2, ESLint and production build pass |

If full prompt logs are required, store sanitized logs under `docs/ai-prompts/` and link them here. Never include secrets, access tokens, personal data, private URLs, or hidden evaluation material.

## 4. Material decisions influenced by AI

| Decision | AI contribution | Candidate decision and rationale | Evidence |
|---|---|---|---|
| Prioritize authorization, cache isolation, and JWT before feature work | Identified these as the highest-risk confidentiality/integrity failures | Adopted; regression coverage and fixes were implemented before optional features | Commits `cea96fd` through `5816658`; backend suite 19/19 passes |
| Target the maximum 115/100 score | Mapped 100 mandatory points plus 15 Tier 4 bonus points | Adopted for planning; mandatory gates must pass before bonus work | README traceability matrix |
| Keep Todo Sharing as specification-only work | Flagged README's explicit instruction not to implement Task 3A | Adopted to prevent scope expansion | `docs/TODO_SHARING_SPEC.md` |
| Track assessment documents while keeping the answer key ignored | Identified the conflict between required `docs/` deliverables and the root ignore rule | Adopted; removed broad `docs/` ignore and retained `docs/ANSWER_KEY.md` | `git check-ignore` verification |
| Keep backend dependencies managed by `requirements.txt` | Identified that the three-line `uv.lock` was generated incidentally, targeted Python 3.13, and was not used by Docker or setup instructions | Adopted; removed the lockfile in standalone commit `23b039e` and used `uv --no-project` only as an isolated test runner | Docker targets Python 3.12; Black targets `py312`; full backend rerun passes on Python 3.12.12 |

## 5. Generated or substantially assisted artefacts

| Artefact | Assistance type | Human changes | Validation |
|---|---|---|---|
| `AGENTS.md` | Repository analysis and drafting | Candidate review pending | Compared with README and current code structure |
| `REMEDIATION_PLAN.md` | Planning and risk prioritization | Candidate review pending | Mapped against mandatory and bonus README requirements |
| `docs/BUG_REPORT.md` | Issue inventory, status tracking, and evidence synchronization | Candidate review and final PR links pending | Fixed findings mapped to commits/tests; unresolved and integration-dependent findings remain open |
| `docs/TEST_PLAN.md` | Test-plan structure, environment metadata, and execution log | Manual/E2E execution and candidate approval pending | Backend/frontend automated reruns recorded without marking unexecuted cases complete |
| `docs/TODO_SHARING_SPEC.md` | Specification skeleton | Product/security/backend decisions pending | Structure compared with README and provided template |
| `docs/PERFORMANCE_REPORT.md` | Benchmark-report structure | Measured PostgreSQL data pending | No performance conclusion has been claimed |
| `docs/AI_USAGE.md` | Disclosure structure and ongoing assistance log | Candidate confirmation and final sign-off pending | Cross-checked against material assistance, Git history, and recorded verification |
| Backend auth/Todo/cache source and tests | Regression design and implementation assistance | Candidate review remains required | Python 3.12.12 suite 19/19; Black and unfiltered Flake8 pass; integration limitations documented |
| Frontend auth/query/session source and tests | Query-key/session design and implementation assistance | Candidate review remains required | Unit tests 2/2, ESLint pass, production build pass |
| Frontend Playwright setup and smoke test | Dependency/configuration and test scaffolding assistance | Complete user journey and cross-user isolation scenarios pending | Playwright 1.63.0 with Chromium smoke 1/1; headless/headed/UI commands documented |

Add source code and test files to this table when AI materially contributes to them.

## 6. Rejected suggestions and corrections

| Suggestion | Why rejected or changed | Final approach |
|---|---|---|
| Treat unfamiliar Python package names as evidence of malware | Package names alone were insufficient, and official package metadata showed the dependency chain | Do not classify them as malicious; still reduce unused production dependencies later |
| Install missing dependencies immediately during the read-only audit | Installation was not required to identify the initial environment blocker and would mutate the workspace | Record the blocker first; install through the approved project setup in the baseline phase |
| Implement Todo Sharing while addressing the assessment | README explicitly states Task 3A is specification-only | Produce the specification without implementation unless separately requested |

## 7. Verification performed by the candidate

- [ ] Reviewed every changed line and related call path.
- [ ] Confirmed behavior against `README.md` and API contracts.
- [x] Ran relevant backend tests.
- [x] Ran relevant frontend lint/build/tests.
- [ ] Ran PostgreSQL/Redis integration checks where mocks are insufficient.
- [ ] Reviewed migrations and rollback behavior.
- [ ] Validated Docker/runtime configuration.
- [ ] Removed secrets, personal data, and private context from prompt logs.
- [ ] Recorded checks that could not be run and why.

## 8. Limitations

- AI output can be incomplete or incorrect and is not treated as test evidence.
- Suggested security controls require threat-model and integration review.
- Suggested database indexes require measured PostgreSQL evidence.
- Fixed auth, ownership, partial-update, cache, and frontend-session findings now have automated regression evidence; unresolved findings remain primarily baseline/static or manual observations.
- The first backend test attempt was blocked because the system Python environment lacked `pytest`; the latest run used isolated `uv --no-project` execution on Python 3.12.12 and passed 19/19 without recreating `uv.lock`.
- Backend cache tests use a stateful Redis mock; PostgreSQL/Redis integration and concurrency evidence are still pending.
- Playwright is configured and smoke-tested, but full authentication/Todo and account-switch coverage is still pending.
- Candidate review, identity spelling confirmation, and final attestation are pending.

## 9. Final attestation

To be completed by the candidate before submission after reviewing the implementation, tests, specifications, tradeoffs, and this assistance log.

**Candidate:** Nguyen Dinh Duc — pending sign-off

**Date:** Pending
