# Changelog

All notable changes to Agoge Academy API will be documented in this file.

This project follows Semantic Versioning and Conventional Commits.

## [0.3.2] - 2026-04-21

### Added

- Added an idempotent Prisma demo seed that provisions a complete organization with users, roles, branding, locations, schedules, payments, notifications and audit activity.
- Added documentation for the demo tenant credentials and the recommended `db push` plus seed flow.

### Changed

- Extended the local Prisma workflow with dedicated `prisma:db:push` and `prisma:seed` scripts.

### Fixed

- Closed the initialization gap where `prisma db push` created the schema but not the global module, permission and screen catalog required by the API.

## [0.3.1] - 2026-04-21

### Added

- Added controller contract tests for analytics, audit, billing, RBAC, settings, schedules and users modules.
- Added direct unit coverage for AuthService edge cases such as invalid slugs, refresh token requirements and membership selection.

### Changed

- Expanded the API validation workflow to include full unit test execution and e2e verification after adding the new test suite.

## [0.3.0] - 2026-04-21

### Added

- Added a new `analytics` SaaS module with executive dashboard, revenue analytics, member growth analytics, operational analytics and filter catalog endpoints.
- Added analytics DTOs, repository and service layer to transform tenant activity into business-facing KPIs and generated insights.
- Registered the analytics module, permission and default screen in the tenant module catalog so current and future organizations can consume it consistently.

### Changed

- Expanded the RBAC module constants to include analytics access in the system permission catalog.
- Wired the analytics module into the application bootstrap so it is available alongside the existing SaaS modules.

## [0.2.0] - 2026-04-21

### Added

- Added a reusable storage module backed by Cloudinary for managed file uploads.
- Added dedicated branding upload endpoints for organization logo and icon assets.
- Added persisted Cloudinary asset keys to organization branding so replacements can clean up previous files safely.

### Changed

- Updated storage configuration and environment examples to standardize on the Cloudinary provider used by organization branding.

### Fixed

- Prevented invalid generated organization slugs during registration from creating inconsistent tenant records.
- Hardened branding updates so removing or replacing assets does not leave orphaned Cloudinary files behind.

## [0.1.2] - 2026-04-19

### Fixed

- Corrected the production entrypoint used by CI smoke tests, Docker, and Docker Compose to `dist/src/main.js`.

### Added

- Added a local workflow guide for modules, branches, commits, merges, and versioning.

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
