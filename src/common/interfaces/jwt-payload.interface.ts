import { PlatformRole } from 'generated/prisma/enums';

export type JwtAccessPayload = {
  tokenType?: 'access' | 'refresh';
  sub: string;
  email: string;
  username?: string | null;
  firstName?: string;
  lastName?: string;
  platformRole?: PlatformRole;
  organizationId?: string;
  organizationSlug?: string;
  memberId?: string;
  roles?: string[];
  permissions?: string[];
  enabledModules?: string[];
};
