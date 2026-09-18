# Technical Specification: Todo Sharing

> Status: Draft skeleton. Task 3A requires a production-grade specification only; do not implement Todo Sharing as part of this document.

## Document control

| Field | Value |
|---|---|
| Author | `<name>` |
| Reviewers | `<product/security/backend/frontend>` |
| Version | `0.1-draft` |
| Last updated | `<YYYY-MM-DD>` |
| Target release | `<release or not scheduled>` |
| Decision status | Proposed |

## 1. Overview and objective

### Feature summary

`<Describe how a Todo-list owner grants viewer/editor access and revokes it.>`

### Problem statement

`<Describe the user problem, expected value, and current limitation.>`

### Goals

- `<goal>`
- `<goal>`

### Success metrics

| Metric | Baseline | Target | Measurement |
|---|---:|---:|---|
| `<metric>` | `<value>` | `<value>` | `<method>` |

### Roles and terminology

| Term | Definition |
|---|---|
| Owner | User who owns the Todo list and controls access |
| Viewer | User with read-only shared access |
| Editor | User allowed to modify shared Todos within the defined scope |
| Share/grant | Persistent permission relationship between owner and collaborator |
| Invitation | `<Define whether invitation is distinct from an active grant>` |

## 2. User stories and acceptance criteria

### US-01 — Grant viewer access

- **As an** owner
- **I want to** share my Todo list with another user as a viewer
- **So that** they can read it without modifying it
- **Acceptance criteria:**
  - [ ] `<criterion>`
  - [ ] `<criterion>`

### US-02 — Grant editor access

- **As an** owner
- **I want to** grant editor permission
- **So that** a trusted collaborator can manage shared Todos
- **Acceptance criteria:**
  - [ ] `<criterion>`
  - [ ] `<criterion>`

### US-03 — Change permission

- **As an** owner
- **I want to** change viewer/editor permission
- **So that** access remains appropriate
- **Acceptance criteria:**
  - [ ] `<criterion>`

### US-04 — Revoke access

- **As an** owner
- **I want to** revoke a collaborator immediately
- **So that** they can no longer read or modify my data
- **Acceptance criteria:**
  - [ ] API authorization rejects subsequent access immediately.
  - [ ] Relevant backend and client cache is invalidated.
  - [ ] `<criterion for requests already in flight>`

### US-05 — View shared lists

- **As a** collaborator
- **I want to** discover lists shared with me
- **So that** I can access permitted data
- **Acceptance criteria:**
  - [ ] `<criterion>`

## 3. Scope

### In scope

- `<owner shares a list with an existing user>`
- `<viewer/editor permissions>`
- `<revoke and permission change>`
- `<list and audit behavior>`

### Out of scope

- Public anonymous sharing.
- Sharing with email addresses that do not map to existing users, unless explicitly approved.
- Nested groups/organizations.
- Collaborators resharing access.
- `<additional boundary>`

## 4. Functional behavior

### Permission matrix

| Action | Owner | Editor | Viewer | Unshared user |
|---|---:|---:|---:|---:|
| View list/Todo | Yes | `<decision>` | `<decision>` | No |
| Create Todo | Yes | `<decision>` | No | No |
| Update Todo | Yes | `<decision>` | No | No |
| Delete Todo | Yes | `<decision>` | No | No |
| Invite collaborator | Yes | No | No | No |
| Change permission | Yes | No | No | No |
| Revoke access | Yes | No | No | No |
| Delete list/owner data | `<decision>` | No | No | No |

### State model

Define invitation/grant states and transitions, for example:

```text
pending → active → revoked
pending → declined
active viewer ↔ active editor
```

Document who may trigger each transition and whether historical rows are retained.

## 5. Data model

### Proposed entities

#### `<todo_lists or sharing scope entity>`

| Column | Type | Null | Default | Constraint/index | Notes |
|---|---|---:|---|---|---|
| `<column>` | `<type>` | `<yes/no>` | `<value>` | `<constraint>` | `<notes>` |

#### `todo_list_shares`

| Column | Type | Null | Default | Constraint/index | Notes |
|---|---|---:|---|---|---|
| `id` | UUID | No | Generated | Primary key | — |
| `owner_id` | UUID | No | — | FK to users | `<delete behavior>` |
| `collaborator_id` | UUID | No | — | FK to users | `<delete behavior>` |
| `permission` | Enum/string | No | — | Check constraint | `viewer` or `editor` |
| `status` | Enum/string | No | `<decision>` | Check constraint | `<states>` |
| `created_at` | TIMESTAMPTZ | No | Now | — | UTC |
| `updated_at` | TIMESTAMPTZ | No | Now | — | UTC |
| `revoked_at` | TIMESTAMPTZ | Yes | Null | — | `<retention>` |

### Required constraints

- [ ] Prevent self-sharing.
- [ ] Prevent duplicate active invitations/grants.
- [ ] Define uniqueness scope and handling of revoked history.
- [ ] Define owner/collaborator deletion behavior.
- [ ] Define Todo deletion behavior.
- [ ] Define indexes for owner and collaborator access paths.
- [ ] Define migration/backfill strategy if an explicit Todo-list entity is introduced.

### Data lifecycle and retention

`<Specify hard delete, soft delete, audit retention, and privacy deletion behavior.>`

## 6. API contracts

Use the existing `/api/v1` prefix and standard error payload conventions.

| Method | Endpoint | Purpose | Required role |
|---|---|---|---|
| POST | `/api/v1/todo-lists/{list_id}/shares` | Invite/grant collaborator | Owner |
| GET | `/api/v1/todo-lists/{list_id}/shares` | List grants | Owner |
| PATCH | `/api/v1/todo-lists/{list_id}/shares/{share_id}` | Change permission | Owner |
| DELETE | `/api/v1/todo-lists/{list_id}/shares/{share_id}` | Revoke access | Owner |
| GET | `/api/v1/shared-todo-lists` | List resources shared with caller | Authenticated user |

For each endpoint, complete:

- Request body and Pydantic validation.
- Success response body and status code.
- Idempotency expectations.
- Pagination/filtering.
- `400`, `401`, `403`/`404`, `409`, and `422` behavior.
- Concurrency/version-precondition behavior.

### Example request

```json
{
  "collaborator_id": "<uuid>",
  "permission": "viewer"
}
```

### Standard error shape

```json
{
  "detail": "<public-safe message>",
  "code": "<stable machine-readable code>"
}
```

## 7. Authorization and security

- Authorization must be enforced in backend queries/services, never only in the UI.
- Decide whether inaccessible resources return `403` or `404`; apply consistently to avoid enumeration.
- Prevent self-sharing and privilege escalation.
- Prevent collaborators from resharing.
- Validate that owner, collaborator, list, Todo, and tag relationships belong to the intended security boundary.
- Define behavior for disabled/deleted users and revoked sessions.
- Define audit events for invite, accept, permission change, revoke, and denied access.
- Define rate limits and abuse controls for invitations.
- Document privacy and notification requirements.

## 8. Edge cases and concurrency

| Scenario | Required decision/behavior |
|---|---|
| Duplicate simultaneous invitation | `<decision>` |
| Owner changes viewer to editor during a read | `<decision>` |
| Owner revokes while editor update is in flight | `<transaction/version rule>` |
| Owner deletes Todo/list while collaborator reads it | `<decision>` |
| Collaborator account is deleted | `<decision>` |
| Invitation target equals owner | Reject before write and enforce DB constraint |
| Re-invite after revoke | `<reuse/new row/history decision>` |
| Last-write-wins versus optimistic locking | `<decision>` |

## 9. Cache and invalidation strategy

- Define owner and collaborator cache namespaces.
- Include permission/share version in keys where appropriate.
- Invalidate immediately after committed grant, permission change, revoke, Todo mutation, and ownership deletion.
- Ensure a revoked collaborator cannot read stale backend or frontend cache.
- Define behavior when Redis invalidation fails after the database commits.
- Define TTL as a safety net, not the primary revocation control.

Proposed key patterns:

```text
todo-list-access:v1:{list_id}:{user_id}:{access_version}
todos:list:v1:{owner_id}:{viewer_id}:{query_hash}:{data_version}
```

`<Confirm or replace these patterns after final data-model decisions.>`

## 10. Observability and operations

- Metrics: grant/revoke rate, authorization denials, stale-cache incidents, invite conflicts.
- Structured logs without tokens, passwords, or private Todo content.
- Audit trail and retention policy.
- Alert conditions for elevated denied access or cache-invalidation failures.
- Operational procedure for emergency revocation.

## 11. Migration and rollout

1. `<Add schema using backward-compatible migration>`
2. `<Deploy read-compatible backend>`
3. `<Enable write/API behavior behind a feature flag>`
4. `<Deploy frontend>`
5. `<Observe metrics and expand rollout>`

Define rollback behavior for schema, grants created during rollout, and cache versions.

## 12. Testing strategy

### Backend

- Owner/viewer/editor permission matrix.
- Cross-user and self-sharing denial.
- Duplicate and concurrent invite handling.
- Immediate revoke and cache invalidation.
- Transaction and optimistic-lock behavior.

### Frontend/E2E

- Owner grants viewer/editor access.
- Viewer cannot mutate.
- Editor can perform only approved mutations.
- Revoked collaborator loses access without stale-data flash.

### Manual/security

- Direct API calls bypassing UI controls.
- Resource-ID enumeration attempts.
- Replay and concurrent update scenarios.

## 13. Alternatives considered

| Option | Advantages | Disadvantages | Decision |
|---|---|---|---|
| `<option>` | `<advantages>` | `<disadvantages>` | `<accept/reject>` |

## 14. Open questions

- [ ] What exactly constitutes a shareable “Todo list” in the current one-list-per-user model?
- [ ] Are invitations limited to existing users?
- [ ] Can editors create/delete Todos or only update them?
- [ ] Are tags included in the shared surface?
- [ ] Is share history retained after revoke?
- [ ] What notification channels are required?
- [ ] What are the latency and consistency expectations for revocation?

## 15. Approval checklist

- [ ] Product acceptance criteria approved.
- [ ] Data model and migration reviewed.
- [ ] Permission matrix reviewed by security/backend.
- [ ] API contracts reviewed by frontend/backend.
- [ ] Cache and immediate-revocation design validated.
- [ ] Concurrency and rollback behavior decided.
- [ ] Out-of-scope boundaries accepted.
