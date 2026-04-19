# Common SaaS Foundation

This folder contains shared API primitives for the multi-tenant SaaS schema.
Domain modules should use these helpers instead of inventing their own request
shape, metadata keys or response envelope.

## Request Context

Tenant-aware endpoints should receive organization context from the auth layer or
from trusted tenant headers during early development:

- `x-request-id`
- `x-organization-id`
- `x-organization-slug`
- `x-member-id`

The `RequestContextInterceptor` normalizes these values into `request.tenant`
and echoes `x-request-id` in the response headers.

## API Response Envelope

Successful endpoints are wrapped with this shape:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request completed successfully",
  "data": {},
  "meta": {
    "request": {
      "requestId": "uuid",
      "method": "GET",
      "path": "/api/v1/resource",
      "timestamp": "2026-04-19T00:00:00.000Z"
    },
    "tenant": {
      "organizationId": "uuid",
      "organizationSlug": "agoge-academy",
      "memberId": "uuid"
    }
  }
}
```

For large lists, return a `PaginatedResult<T>` from a service or repository.
The interceptor will move `pagination` into `meta.pagination` and expose the
records as `data`.

Cursor pagination is preferred for high-volume SaaS tables. Offset pagination is
kept for small admin screens where total counts are useful.

## Decorators

- `@CurrentUser()` returns the authenticated platform user.
- `@CurrentOrganization()` returns the active tenant organization.
- `@CurrentMember()` returns the user's membership inside the organization.
- `@CurrentTenant()` returns the full request tenant context.
- `@Roles()` checks organization role keys such as `admin`.
- `@Permissions()` checks permission keys such as `settings.write`.
- `@RequireModules()` checks enabled module keys such as `billing`.
- `@Public()` skips auth/RBAC guards.
- `@SkipTenant()` skips tenant requirements for platform-level endpoints.

## Guards

The guards in `src/common/guards` do not query Prisma directly. They expect the
auth layer to populate `request.user`, `request.organization` and
`request.member` after validating tokens and tenant membership.

This keeps common infrastructure lightweight and avoids mixing business lookups
into generic guards.

## Repositories

The repository base classes provide read/write/bulk operations, cursor and
offset pagination, tenant scoping, soft delete helpers and transactions. Domain
repositories should extend the smallest useful base:

- `ReadRepository` for read-only queries.
- `GenericRepository` for CRUD and bulk operations.
- `SoftDeletableRepository` for models with `deletedAt`.
- `TenantRepository` for models with `organizationId`.
