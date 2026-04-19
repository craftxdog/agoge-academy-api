import { Request } from 'express';
import { PlatformRole } from 'generated/prisma/enums';

export type AuthenticatedUserContext = {
  id: string;
  email: string;
  username?: string | null;
  firstName?: string;
  lastName?: string;
  platformRole?: PlatformRole;
};

export type OrganizationContext = {
  id: string;
  slug: string;
  name?: string;
  timezone?: string;
  locale?: string;
  defaultCurrency?: string;
};

export type MemberContext = {
  id: string;
  organizationId: string;
  userId: string;
  roles: string[];
  permissions: string[];
  enabledModules: string[];
};

export type TenantRequestContext = {
  requestId?: string;
  user?: AuthenticatedUserContext;
  organization?: OrganizationContext;
  member?: MemberContext;
};

export type TenantRequest = Request & {
  requestId?: string;
  user?: AuthenticatedUserContext;
  organization?: OrganizationContext;
  member?: MemberContext;
  tenant?: TenantRequestContext;
};
