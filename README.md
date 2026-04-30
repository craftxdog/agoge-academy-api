# Agoge Academy API

Backend API for **Agoge Academy**, built with NestJS and TypeScript.

The API is already operating as a modular multi-tenant SaaS backend with tenant-aware authentication, RBAC, settings, analytics, billing, schedules, shared notifications, audit logs, and Socket.IO realtime events.

## Current Status

- Multi-tenant NestJS API under `/api/v1`
- JWT auth with organization switching and refresh rotation
- Tenant context guards for modules, roles and permissions
- Prisma 7 schema with organizations, members, roles, schedules, billing, notifications and audit
- Billing module with payment types, payment methods, payments, transactions and operational summary
- Schedules module with locations, business hours, exceptions, member availability and effective day planning
- Settings module with branding, organization settings, enabled modules and screen visibility
- Users module with members, invitations and tenant membership management
- RBAC module for tenant roles and permissions
- Analytics module with revenue, members, operations, dashboard and catalog endpoints
- Notifications module with shared inbox history, unread summary and read actions
- Socket.IO realtime namespace with domain events and cache invalidation envelopes
- Swagger/OpenAPI docs in non-production environments
- Jest unit and E2E coverage, ESLint, Prettier and Docker support

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js 22 |
| Framework | NestJS |
| Language | TypeScript |
| Package manager | Yarn Classic |
| Testing | Jest + Supertest |
| Database ORM | Prisma |
| Database | PostgreSQL |
| Linting | ESLint + Prettier |
| CI/CD | GitHub Actions |

## Getting Started

### Install dependencies

```bash
yarn install
```

### Configure environment

```bash
cp .env.example .env
```

### Start development server

```bash
yarn start:dev
```

The API uses URI versioning. In development, the default versioned root endpoint is:

```text
GET http://localhost:3000/api/v1
```

Swagger docs are available outside production at:

```text
http://localhost:3000/api/v1/docs
```

## Core Modules

- `auth`: register organization, login, refresh, logout, active tenant context
- `users`: members and invitations
- `rbac`: tenant roles and permissions
- `settings`: branding, preferences, modules and screens
- `billing`: payment catalog, invoices and transactions
- `schedules`: locations, hours, exceptions and member schedules
- `notifications`: shared tenant inbox with history and unread tracking
- `analytics`: dashboard, revenue, members, operations and catalog
- `audit`: operational history queries
- `realtime`: Socket.IO namespace `/realtime`

## Notifications And Realtime

- Historical inbox API: `GET /api/v1/notifications`
- Inbox summary for dropdowns: `GET /api/v1/notifications/summary`
- Shared read actions: `PATCH /api/v1/notifications/:notificationId/read` and `PATCH /api/v1/notifications/read-all`
- Analytics operations summary also exposes `unreadNotifications` and `recentNotifications`
- Realtime namespace: `/realtime`
- Generic event name: `realtime.event`
- Current persistent inbox producers: `billing` and `schedules`

See:

- [docs/REALTIME_SOCKET_IO.md](/Users/craftzdog/Documents/Projects/agoge-api/docs/REALTIME_SOCKET_IO.md)
- [docs/NOTIFICATIONS_API.md](/Users/craftzdog/Documents/Projects/agoge-api/docs/NOTIFICATIONS_API.md)

## Scripts

| Command | Description |
| --- | --- |
| `yarn start:dev` | Start the NestJS development server |
| `yarn build` | Build the application |
| `yarn lint` | Run ESLint checks |
| `yarn lint:fix` | Run ESLint with auto-fix |
| `yarn test` | Run unit tests |
| `yarn test:ci` | Run unit tests without Watchman and in-band |
| `yarn test:e2e` | Run E2E tests |
| `yarn test:cov` | Run tests with coverage |
| `yarn format` | Format source and test files |
| `yarn format:check` | Check source and test file formatting |
| `yarn prisma:validate` | Validate the Prisma schema |
| `yarn prisma:generate` | Generate Prisma Client |
| `yarn prisma:migrate:dev` | Create/apply local database migrations |
| `yarn prisma:migrate:deploy` | Apply migrations in CI/CD or production |

For CI-like local test runs, prefer:

```bash
yarn test:ci
yarn test:e2e
yarn test:cov
```

## API Versioning Plan

Public API endpoints should use URI versioning:

```text
/api/v1/*
```

Breaking API changes should be introduced under a new version, such as `/api/v2`.

## GitFlow

This project uses a lightweight GitFlow model:

- `main`: stable, release-ready code.
- `develop`: integration branch for completed work.
- `feature/*`: new backend/API features.
- `fix/*`: bug fixes.
- `chore/*`: tooling, CI/CD, docs, maintenance.
- `release/*`: release preparation.
- `hotfix/*`: urgent production fixes.

Commit messages must follow Conventional Commits and include a scope:

```text
feat(auth): add login endpoint
fix(ci): correct yarn install step
chore(github): improve issue templates
```

## CI/CD

GitHub Actions workflows are configured for:

- Pull request CI
- Reusable lint/build/test pipeline
- Staging deploy skeleton
- Production deploy skeleton
- Scheduled maintenance

Docker deployment workflows include preflight checks and publish images only after CI passes.

## Operations Notes

- Swagger is enabled outside production.
- In local development, `helmet` disables CSP only outside production to avoid blocking local tooling and docs.
- Realtime and notifications are tenant-scoped. The inbox is shared per organization, not per individual user.

## Contributing

Read:

- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `.github/PULL_REQUEST_TEMPLATE.md`

## Security

Do not open public issues for vulnerabilities. Follow the guidance in `SECURITY.md`.

## License

MIT
