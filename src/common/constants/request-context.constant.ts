/**
 * Headers and metadata keys used to carry tenant and request context through
 * guards, decorators, filters and interceptors.
 */
export const REQUEST_ID_HEADER = 'x-request-id';
export const ORGANIZATION_ID_HEADER = 'x-organization-id';
export const ORGANIZATION_SLUG_HEADER = 'x-organization-slug';
export const MEMBER_ID_HEADER = 'x-member-id';

export const REQUEST_CONTEXT_KEYS = {
  user: 'user',
  member: 'member',
  organization: 'organization',
  requestId: 'requestId',
} as const;

export const TENANT_HEADERS = {
  requestId: REQUEST_ID_HEADER,
  organizationId: ORGANIZATION_ID_HEADER,
  organizationSlug: ORGANIZATION_SLUG_HEADER,
  memberId: MEMBER_ID_HEADER,
} as const;
