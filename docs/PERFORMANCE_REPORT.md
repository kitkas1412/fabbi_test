# Database Performance and Indexing Report

> Status: Draft skeleton. Populate this report with measured PostgreSQL evidence; do not use SQLite results for Tier 3C conclusions.

## Document control

| Field | Value |
|---|---|
| Author | `<name>` |
| Commit before optimization | `<SHA>` |
| Commit after optimization | `<SHA>` |
| Benchmark date | `<YYYY-MM-DD>` |
| Environment | `<local/container/host details>` |

## 1. Objective

Measure the current Todo query workload, select indexes based on evidence, apply them through Alembic, and document read improvements alongside write, storage, and migration tradeoffs.

## 2. Benchmark environment

| Property | Value |
|---|---|
| PostgreSQL version | `<version>` |
| Container/image | `<image/digest>` |
| CPU allocation | `<value>` |
| Memory allocation | `<value>` |
| Storage/filesystem | `<value>` |
| Shared buffers/work mem | `<value>` |
| Cold/warm cache policy | `<method>` |
| Concurrent load | `<none or workload>` |

Record any background processes or resource limits that may affect reproducibility.

## 3. Dataset

Seed command:

```bash
docker compose exec -e SEED_USERS=10000 -e SEED_TODOS=1000000 backend python -m app.db.seed
```

| Table | Row count | Distribution notes |
|---|---:|---|
| `users` | `<count>` | `<notes>` |
| `todos` | `<count>` | `<todos/user, completed ratio, timestamp range>` |
| `tags` | `<count if Tier 4>` | `<notes>` |
| `todo_tags` | `<count if Tier 4>` | `<notes>` |

Provide the exact user IDs/filter values used and explain whether they represent median, high-volume, and worst-case users.

## 4. Workload and query definitions

### Q1 — User-scoped Todo page

```sql
-- Paste the exact SQL executed by the application.
SELECT ...
FROM todos
WHERE user_id = :user_id
ORDER BY created_at DESC, id DESC
LIMIT :limit OFFSET :offset;
```

### Q2 — User-scoped Todo count

```sql
SELECT count(*)
FROM todos
WHERE user_id = :user_id;
```

### Q3 — Completed-status filter

```sql
-- Paste exact SQL after filtering is implemented.
```

### Q4 — Tier 4 tag/filter query

```sql
-- Paste exact SQL when applicable.
```

For every query, include parameter values and the application code path that generates it.

## 5. Measurement method

1. Run migrations on a clean PostgreSQL instance.
2. Seed and analyze representative data.
3. Capture existing indexes and table statistics.
4. Run each query enough times to separate cold and warm-cache behavior.
5. Capture `EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT)` before changes.
6. Apply one index/query change at a time.
7. Repeat with the same parameters and environment.
8. Measure representative inserts/updates and index storage.

Example command:

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, FORMAT TEXT)
SELECT ...;
```

Do not report a single best run. Record sample count and at least median/p95 or a clearly stated equivalent.

## 6. Baseline results

| Query | Samples | Median | p95 | Rows returned | Planning time | Execution time | Buffers/read | Plan summary |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Q1 | `<n>` | `<ms>` | `<ms>` | `<n>` | `<ms>` | `<ms>` | `<value>` | `<seq/index scan>` |
| Q2 | `<n>` | `<ms>` | `<ms>` | `<n>` | `<ms>` | `<ms>` | `<value>` | `<plan>` |
| Q3 | `<n>` | `<ms>` | `<ms>` | `<n>` | `<ms>` | `<ms>` | `<value>` | `<plan>` |
| Q4 | `<n>` | `<ms>` | `<ms>` | `<n>` | `<ms>` | `<ms>` | `<value>` | `<plan>` |

### Raw baseline plans

Store manageable plans below or link to a tracked text artefact.

```text
<Q1 baseline EXPLAIN ANALYZE>
```

## 7. Index hypotheses

| Candidate | Queries helped | Expected benefit | Write/storage cost | Decision before test |
|---|---|---|---|---|
| `(user_id, created_at DESC, id DESC)` | Q1/Q2 | User scope and stable order | `<cost>` | Test |
| `(user_id, completed, created_at DESC, id DESC)` | Q3 | Status-filtered page | `<cost>` | Test |
| `<Tier 4 index>` | Q4 | `<benefit>` | `<cost>` | `<test/reject>` |

Avoid retaining overlapping indexes unless the measured workload justifies both.

## 8. Implementation

| Change | File/revision | Rationale |
|---|---|---|
| Deterministic ordering | `<path>` | Stable pagination |
| N+1 removal | `<path>` | Reduce query count |
| Index migration | `<revision/path>` | `<measured rationale>` |

Migration commands:

```bash
cd backend
alembic upgrade head
alembic downgrade <previous_revision>
alembic upgrade head
```

Document whether concurrent index creation or an autocommit block is required for production-sized tables.

## 9. Results after optimization

| Query | Baseline median | New median | Improvement | Baseline p95 | New p95 | Plan change |
|---|---:|---:|---:|---:|---:|---|
| Q1 | `<ms>` | `<ms>` | `<percent>` | `<ms>` | `<ms>` | `<summary>` |
| Q2 | `<ms>` | `<ms>` | `<percent>` | `<ms>` | `<ms>` | `<summary>` |
| Q3 | `<ms>` | `<ms>` | `<percent>` | `<ms>` | `<ms>` | `<summary>` |
| Q4 | `<ms>` | `<ms>` | `<percent>` | `<ms>` | `<ms>` | `<summary>` |

### Raw optimized plans

```text
<Q1 optimized EXPLAIN ANALYZE>
```

## 10. Write and storage impact

| Measurement | Before | After | Difference |
|---|---:|---:|---:|
| Insert throughput/latency | `<value>` | `<value>` | `<value>` |
| Update throughput/latency | `<value>` | `<value>` | `<value>` |
| Table size | `<bytes>` | `<bytes>` | `<bytes>` |
| Total index size | `<bytes>` | `<bytes>` | `<bytes>` |

Explain expected vacuum/analyze and maintenance implications.

## 11. Migration safety

- Lock behavior: `<analysis>`
- Estimated build duration at production scale: `<estimate/evidence>`
- Disk headroom required: `<estimate>`
- Online/concurrent strategy: `<decision>`
- Failure and retry behavior: `<decision>`
- Rollback steps: `<steps>`
- Monitoring during rollout: `<metrics/queries>`

## 12. Decision and tradeoffs

### Accepted changes

- `<change and evidence>`

### Rejected changes

- `<candidate and why it was not retained>`

### Known limitations

- `<offset pagination cost, dataset representativeness, environment limits, etc.>`

## 13. Reproduction commands

```bash
# Start services
docker compose up -d --build

# Seed data
docker compose exec -e SEED_USERS=10000 -e SEED_TODOS=1000000 backend python -m app.db.seed

# Connect to PostgreSQL
docker compose exec postgres psql -U fabbi -d postgres
```

Add any scripts, SQL files, environment variables, and cleanup commands required for an independent reviewer to reproduce the results.

## 14. Approval checklist

- [ ] Baseline captured before index/query changes.
- [ ] Exact SQL and parameters documented.
- [ ] Alembic migration tested upgrade/downgrade.
- [ ] Before/after table completed.
- [ ] Raw plans retained or linked.
- [ ] Write latency and storage measured.
- [ ] Large-table migration safety explained.
- [ ] Results reproduced from a clean environment.
