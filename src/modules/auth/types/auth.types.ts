import { PlatformRole } from 'generated/prisma/enums';
import { JwtAccessPayload } from '../../../common';

export type AuthUserView = {
  id: string;
  email: string;
  username: string | null;
  firstName: string;
  lastName: string;
  platformRole: PlatformRole;
};

export type AuthOrganizationView = {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  locale: string;
  defaultCurrency: string;
};

export type AuthMembershipView = {
  id: string;
  organization: AuthOrganizationView;
  roles: string[];
  permissions: string[];
  enabledModules: string[];
};

export type AuthSession = {
  user: AuthUserView;
  activeMembership: AuthMembershipView | null;
  memberships: AuthMembershipView[];
  tokens: {
    accessToken: string;
    refreshToken: string;
    tokenType: 'Bearer';
    expiresInSeconds: number;
  };
};

export type RefreshTokenPayload = Pick<
  JwtAccessPayload,
  'sub' | 'email' | 'platformRole'
> & {
  tokenType: 'refresh';
};

export type AccessTokenPayload = JwtAccessPayload & {
  tokenType: 'access';
};
