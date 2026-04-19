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
