# Demo Database Seed

This project includes a reset-style demo seed at `prisma/seed.ts` to populate one complete tenant with realistic SaaS data after `prisma db push`.

The seed clears runtime/demo data before recreating the workspace, so the database ends with one fully configured demo organization and a fresh system endpoint-permission matrix.

## What it creates

- One fully configured organization: `agoge-performance-club`
- Branding and organization settings
- Full system catalog for modules, permissions and screens when the database was created with `db push`
- Full endpoint permission rules for protected API routes
- Canonical system roles synchronized on every seed run:
  - `admin` with all tenant-wide permissions
  - `customer` with self-service-only permissions
- Tenant module/screen records re-synchronized from the app catalog on every seed run
- Ten members with real login credentials:
  - 4 workers
  - 6 customers
- 3 invitation records with mixed states
- 2 active locations
- Business hours for each location
- Schedule exceptions
- Member schedules for every seeded member
- Payment types, payment methods and payments
- Card, cash and transfer transactions
- Notifications and audit events for analytics and audit endpoints

## Demo credentials

- Shared password for every seeded user: `AgogeDemo2026!`

Worker accounts:

- `sofia.rios@agoge-demo.test`
- `luis.mena@agoge-demo.test`
- `mariana.cuadra@agoge-demo.test`
- `carlos.leiva@agoge-demo.test`

Customer accounts:

- `ana.garcia@agoge-demo.test`
- `diego.martinez@agoge-demo.test`
- `elena.torres@agoge-demo.test`
- `fernando.lopez@agoge-demo.test`
- `gabriela.vargas@agoge-demo.test`
- `hector.castillo@agoge-demo.test`

## Recommended flow

1. Run `yarn prisma:generate`
2. Run `yarn prisma:db:push`
3. Run `yarn prisma:seed`

Do not run this seed against an environment that contains data you need to keep.

## Why the seed also creates system catalog data

`prisma db push` synchronizes schema objects, but it does not execute the SQL data inserts that live in the migration files. Because this API depends on global records such as app modules, permissions and screens, the seed recreates those reference records when needed so a fresh environment is fully usable without hidden manual steps.

The seed also repairs tenant drift for the demo workspace by re-syncing:

- app catalog modules, permissions and screens
- endpoint permission rules
- organization module enablement records
- system screen metadata and visibility
- protected system roles (`admin`, `customer`)
