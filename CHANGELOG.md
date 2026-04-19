# Changelog

All notable changes to Agoge Academy API will be documented in this file.

This project follows Semantic Versioning and Conventional Commits.

## [0.1.1] - 2026-04-19

### Fixed

- Disabled automatic staging deploys during setup so pushes do not fail when Docker Hub secrets are not configured.
- Updated GitHub Actions dependencies to Node 24-compatible major versions.
- Resolved Prisma transitive audit findings by pinning patched Hono packages through Yarn resolutions.
- Added automatic closure for the dependency audit issue once the scheduled audit passes again.

## [0.1.0] - 2026-04-19

### Added

- URI API versioning for the setup phase under `/api/v1`.
- Swagger/OpenAPI documentation outside production at `/api/v1/docs`.
- Global validation, HTTP exception filtering, and response transformation.
- Security and request middleware setup with Helmet, CORS, and cookie parser.
- Prisma module registration with lazy database connection behavior.
- CI-friendly test scripts that avoid Watchman in constrained environments.

### Changed

- Promoted the setup baseline from `0.0.1` to `0.1.0`.
- Split linting into check-only and auto-fix commands.
- Moved E2E Jest module resolution in sync with TypeScript base URL imports.

### Removed

- Removed the obsolete `.eslintignore` file now that ESLint flat config owns ignore rules.

## [0.0.1] - 2026-04-12

### Added

- Initial NestJS API scaffold.
- Yarn-based project setup.
- ESLint, Prettier, Jest, and TypeScript configuration.
- Commitlint conventional commit rules.
- GitHub issue templates for API bug reports and backend feature requests.
- Pull request template focused on backend/API review.
- Reusable GitHub Actions CI workflow.
- Staging and production deployment workflow skeletons.
- Scheduled maintenance workflow.
