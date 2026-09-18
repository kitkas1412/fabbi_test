# Fabbi Todo App — Developer Assessment Codebase

A full-stack Todo application built with JWT authentication, designed for developer skill evaluation.

## Tech Stack

### Backend

- **FastAPI** — Python async web framework
- **PostgreSQL** — Relational database
- **Redis** — Caching layer
- **SQLAlchemy 2.0** — Async ORM
- **Alembic** — Database migrations
- **Pydantic v2** — Data validation

### Frontend

- **React 19** + **TypeScript** — UI framework
- **Vite** — Build tool
- **Tailwind CSS v4** — Utility-first CSS
- **shadcn/ui** — Component library
- **TanStack React Query** — Server state management
- **react-hook-form** + **Zod** — Form handling & validation
- **React Router** — Client-side routing

### Infrastructure

- **Docker Compose** — Container orchestration
- **Dockerized** backend + frontend + PostgreSQL + Redis

## Getting Started

### Prerequisites

- Docker & Docker Compose installed
- Git

### Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd fabbi

# Copy environment variables
cp .env.example .env

# Replace every replace-with-* placeholder. Keep DATABASE_URL/REDIS_URL in sync
# with the service credentials; URL-encode special characters in the URLs.

# Start all services
docker compose up --build --wait

# Seed the database with a demo user and sample TODOs
docker compose exec backend python -m app.db.seed
```

The application will be available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Demo Login credentials**:
  - Email: `demo@test.com`
  - Password: `Demo@123`

PostgreSQL and Redis are available only to services on the Compose network; they
are intentionally not published to the host. Administer them through
`docker compose exec postgres psql ...` or
`docker compose exec redis redis-cli --askpass`. The backend and frontend wait
for healthy dependencies and run as non-root users. The local `.env` file is
ignored by Git; never commit it.

By default the seed command creates 100 users and 1,000 TODOs so the assessment is quick to set up. To test performance with a larger dataset, pass seed variables explicitly:

```bash
docker compose exec -e SEED_USERS=10000 -e SEED_TODOS=1000000 backend python -m app.db.seed
```

### Local Development (without Docker)

The default Compose stack does not expose PostgreSQL or Redis. For a host-run
backend, start separate local data services and set `DATABASE_URL` and
`REDIS_URL` to their `localhost` endpoints.

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate.bat
pip install -r requirements.txt

# Start PostgreSQL and Redis locally, then run migrations and seed data:
alembic upgrade head
python -m app.db.seed

# Start backend server
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Authentication

| Method | Endpoint                | Description           |
| ------ | ----------------------- | --------------------- |
| POST   | `/api/v1/auth/register` | Register a new user   |
| POST   | `/api/v1/auth/login`    | Login and get tokens  |
| POST   | `/api/v1/auth/refresh`  | Refresh access token  |
| POST   | `/api/v1/auth/logout`   | Logout user           |
| GET    | `/api/v1/auth/me`       | Get current user info |

### Todos

| Method | Endpoint             | Description            |
| ------ | -------------------- | ---------------------- |
| GET    | `/api/v1/todos`      | List todos (paginated) |
| POST   | `/api/v1/todos`      | Create a new todo      |
| GET    | `/api/v1/todos/{id}` | Get a specific todo    |
| PUT    | `/api/v1/todos/{id}` | Update a todo          |
| DELETE | `/api/v1/todos/{id}` | Delete a todo          |

## Project Structure

```
fabbi/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API route handlers
│   │   ├── core/            # Config, security, Redis
│   │   ├── db/              # Database setup
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic validation
│   │   ├── services/        # Business logic
│   │   └── main.py          # FastAPI app
│   ├── alembic/             # DB migrations
│   └── tests/               # Test suite
├── frontend/
│   └── src/
│       ├── components/ui/   # shadcn/ui components
│       ├── features/        # Feature modules (auth, todos)
│       ├── lib/             # Utilities (API, query client)
│       ├── pages/           # Route pages
│       └── router/          # React Router config
└── docker-compose.yml
```

## Running Tests

### Backend Automated Tests
```bash
cd backend
pytest tests/ -v
```

### Backend PostgreSQL/Redis Integration Tests

The fast suite above deliberately uses SQLite and a Redis mock. Run the
dedicated suite in a disposable Compose backend container to exercise the real
PostgreSQL schema, Redis cache keys, and atomic refresh-token rotation:

```bash
docker compose up -d --wait postgres redis
docker compose run --rm --no-deps backend sh -c \
  'alembic upgrade head && pytest integration_tests/ -v'
```

The suite creates randomly named `integration-*@example.com` accounts and
removes their database rows, Redis cache keys, and sessions during teardown.

### Frontend E2E Tests (Playwright)

Start the current backend services, install Chromium once, then run the suite
headless or headed:

```bash
docker compose up -d --build postgres redis backend
cd frontend
npm ci
npm run test:e2e:install
npm run test:e2e          # headless
npm run test:e2e:headed   # headed browser
```

Both run commands first execute `npm run test:e2e:prepare`. The prepare step
deletes only the allowlisted `e2e-journey1-r{0..2}@example.com` and
`e2e-journey2-{a,b}-r{0..2}@example.com` users and their Todos, then the tests
recreate deterministic data using password `E2eTodo@123`. Do not run concurrent
suites against the same backend because they share this fixture namespace.

Playwright starts a dedicated Vite server at `http://127.0.0.1:4173`
automatically. Set
`PLAYWRIGHT_BASE_URL=http://localhost:3000` to target an already-running
frontend. The complete authentication/Todo and cross-user Tier 2B journeys
require the backend and disposable test accounts. Journey 1 covers the complete
authentication/Todo lifecycle; Journey 2 covers cross-user UI and API isolation.

### Database Performance Benchmarking
To test database indexing and query execution times with 1 million records:
```bash
docker compose exec -e SEED_USERS=10000 -e SEED_TODOS=1000000 backend python -m app.db.seed
```
Connect to PostgreSQL container to run `EXPLAIN ANALYZE`:
```bash
docker compose exec postgres psql -U fabbi -d postgres
```
