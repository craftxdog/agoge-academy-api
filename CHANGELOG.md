# Changelog

All notable changes to Agoge Academy API will be documented in this file.

This project follows Semantic Versioning and Conventional Commits.

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
