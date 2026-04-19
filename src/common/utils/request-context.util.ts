import { TenantRequest } from '../interfaces/request-context.interface';
import {
  MEMBER_ID_HEADER,
  ORGANIZATION_ID_HEADER,
  ORGANIZATION_SLUG_HEADER,
  REQUEST_ID_HEADER,
} from '../constants/request-context.constant';

const getHeader = (
  request: TenantRequest,
  header: string,
): string | undefined => {
  const value = request.headers[header];

  return Array.isArray(value) ? value[0] : value;
};

export const getRequestId = (request: TenantRequest): string | undefined =>
  request.requestId ??
  request.tenant?.requestId ??
  getHeader(request, REQUEST_ID_HEADER);

export const getOrganizationId = (request: TenantRequest): string | undefined =>
  request.organization?.id ??
  request.tenant?.organization?.id ??
  request.member?.organizationId ??
  request.tenant?.member?.organizationId ??
  getHeader(request, ORGANIZATION_ID_HEADER);

export const getOrganizationSlug = (
  request: TenantRequest,
): string | undefined =>
  request.organization?.slug ??
  request.tenant?.organization?.slug ??
  getHeader(request, ORGANIZATION_SLUG_HEADER);

export const getMemberId = (request: TenantRequest): string | undefined =>
  request.member?.id ??
  request.tenant?.member?.id ??
  getHeader(request, MEMBER_ID_HEADER);

export const getCurrentUser = (request: TenantRequest) =>
  request.user ?? request.tenant?.user;

export const getCurrentOrganization = (request: TenantRequest) =>
  request.organization ?? request.tenant?.organization;

export const getCurrentMember = (request: TenantRequest) =>
  request.member ?? request.tenant?.member;

export const getCurrentRoles = (request: TenantRequest): string[] =>
  getCurrentMember(request)?.roles ?? [];

export const getCurrentPermissions = (request: TenantRequest): string[] =>
  getCurrentMember(request)?.permissions ?? [];

export const getCurrentEnabledModules = (request: TenantRequest): string[] =>
  getCurrentMember(request)?.enabledModules ?? [];
