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

If full prompt logs are required, store sanitized logs under `docs/ai-prompts/` and link them here. Never include secrets, access tokens, personal data, private URLs, or hidden evaluation material.

## 4. Material decisions influenced by AI

| Decision | AI contribution | Candidate decision and rationale | Evidence |
|---|---|---|---|
| Prioritize authorization, cache isolation, and JWT before feature work | Identified these as the highest-risk confidentiality/integrity failures | Adopted as the working sequence; runtime proof and regression tests are still required | `REMEDIATION_PLAN.md` and initial issue register |
| Target the maximum 115/100 score | Mapped 100 mandatory points plus 15 Tier 4 bonus points | Adopted for planning; mandatory gates must pass before bonus work | README traceability matrix |
| Keep Todo Sharing as specification-only work | Flagged README's explicit instruction not to implement Task 3A | Adopted to prevent scope expansion | `docs/TODO_SHARING_SPEC.md` |
| Track assessment documents while keeping the answer key ignored | Identified the conflict between required `docs/` deliverables and the root ignore rule | Adopted; removed broad `docs/` ignore and retained `docs/ANSWER_KEY.md` | `git check-ignore` verification |

## 5. Generated or substantially assisted artefacts

| Artefact | Assistance type | Human changes | Validation |
|---|---|---|---|
| `AGENTS.md` | Repository analysis and drafting | Candidate review pending | Compared with README and current code structure |
| `REMEDIATION_PLAN.md` | Planning and risk prioritization | Candidate review pending | Mapped against mandatory and bonus README requirements |
| `docs/BUG_REPORT.md` | Initial issue inventory/template and metadata | Candidate review and runtime reproduction pending | Static finding locations checked; every issue must still be reproduced/verified |
| `docs/TEST_PLAN.md` | Test-plan structure and initial environment metadata | Candidate execution and approval pending | Local versions and initial pytest blocker recorded |
| `docs/TODO_SHARING_SPEC.md` | Specification skeleton | Product/security/backend decisions pending | Structure compared with README and provided template |
| `docs/PERFORMANCE_REPORT.md` | Benchmark-report structure | Measured PostgreSQL data pending | No performance conclusion has been claimed |
| `docs/AI_USAGE.md` | Disclosure structure and initial assistance log | Candidate confirmation and final sign-off pending | Cross-checked against material assistance in this workspace |

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
- [ ] Ran relevant backend tests.
- [ ] Ran relevant frontend lint/build/tests.
- [ ] Ran PostgreSQL/Redis integration checks where mocks are insufficient.
- [ ] Reviewed migrations and rollback behavior.
- [ ] Validated Docker/runtime configuration.
- [ ] Removed secrets, personal data, and private context from prompt logs.
- [ ] Recorded checks that could not be run and why.

## 8. Limitations

- AI output can be incomplete or incorrect and is not treated as test evidence.
- Suggested security controls require threat-model and integration review.
- Suggested database indexes require measured PostgreSQL evidence.
- Initial findings are based primarily on static review; runtime reproduction and regression evidence are still pending.
- The first backend test attempt was blocked because the system Python environment does not have `pytest` installed.
- Candidate review, identity spelling confirmation, and final attestation are pending.

## 9. Final attestation

To be completed by the candidate before submission after reviewing the implementation, tests, specifications, tradeoffs, and this assistance log.

**Candidate:** Nguyen Dinh Duc — pending sign-off

**Date:** Pending
