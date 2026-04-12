# Agoge Academy API

Backend API for **Agoge Academy**, built with NestJS and TypeScript.

This repository is currently in its foundation stage: the NestJS application, testing setup, linting, commit standards, issue templates, pull request template, and CI/CD workflow structure are in place. Domain modules such as authentication, users, storage, analytics, Prisma models, and production Docker deployment are planned but not implemented yet.

## Current Status

- NestJS application scaffold
- TypeScript configuration
- ESLint 9 flat config
- Prettier configuration
- Jest unit and E2E test setup
- Commitlint conventional commit rules
- GitHub issue templates for API bugs and backend feature requests
- Pull request template focused on backend/API review
- Reusable CI workflow for lint, build, test, and optional Docker validation
- Staging and production deployment workflow skeletons with preflight checks
- Scheduled maintenance workflow for dependency audit, Docker scan, and stale branch reporting
- Production Dockerfile and local Docker Compose setup

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js 22 |
| Framework | NestJS |
| Language | TypeScript |
| Package manager | Yarn Classic |
| Testing | Jest + Supertest |
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

The default endpoint is:

```text
GET http://localhost:3000/
```

## Scripts

| Command | Description |
| --- | --- |
| `yarn start:dev` | Start the NestJS development server |
| `yarn build` | Build the application |
| `yarn lint` | Run ESLint with auto-fix |
| `yarn test` | Run unit tests |
| `yarn test:e2e` | Run E2E tests |
| `yarn test:cov` | Run tests with coverage |
| `yarn format` | Format source and test files |

For CI-like local test runs, prefer:

```bash
yarn test --watchman=false --runInBand
yarn test:e2e --watchman=false --runInBand
yarn test:cov --watchman=false --runInBand
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

## Roadmap

- Add Prisma schema and database migrations
- Implement authentication and authorization
- Implement user management
- Add API version prefix
- Add Swagger/OpenAPI documentation
- Add real staging and production deployment targets

## Contributing

Read:

- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `.github/PULL_REQUEST_TEMPLATE.md`

## Security

Do not open public issues for vulnerabilities. Follow the guidance in `SECURITY.md`.

## License

MIT
