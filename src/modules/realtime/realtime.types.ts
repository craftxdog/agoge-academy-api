import { PlatformRole } from 'generated/prisma/enums';
import { JwtAccessPayload } from '../../common';

export const REALTIME_DOMAINS = [
  'analytics',
  'audit',
  'billing',
  'notifications',
  'rbac',
  'schedules',
  'settings',
  'system',
  'users',
] as const;

export type RealtimeDomain = (typeof REALTIME_DOMAINS)[number];

export type RealtimeEventEnvelope<T = unknown> = {
  id: string;
  name: string;
  domain: RealtimeDomain;
  resource: string;
  action: string;
  entityId?: string | null;
  organizationId: string;
  occurredAt: string;
  invalidate: string[];
  data: T;
};

export type PublishOrganizationEventParams<T = unknown> = {
  organizationId: string;
  domain: RealtimeDomain;
  resource: string;
  action: string;
  entityId?: string | null;
  invalidate?: string[];
  data: T;
};

export type RealtimeSocketUser = {
  id: string;
  email: string;
  username?: string | null;
  firstName?: string;
  lastName?: string;
  platformRole: PlatformRole;
};

export type RealtimeSocketOrganization = {
  id: string;
  slug?: string;
};

export type RealtimeSocketMember = {
  id: string;
  roles: string[];
  permissions: string[];
  enabledModules: string[];
};

export type RealtimeConnectionSnapshot = {
  socketId: string;
  namespace: string;
  connectedAt: string;
  user: RealtimeSocketUser;
  organization: RealtimeSocketOrganization | null;
  member: RealtimeSocketMember | null;
  rooms: string[];
};

export type RealtimeSyncPayload = {
  accessToken?: string;
};

export type RealtimeSocketAuthContext = {
  token: string;
  connectedAt: Date;
  payload: JwtAccessPayload;
  managedRooms: string[];
};
