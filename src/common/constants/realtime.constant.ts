export const REALTIME_NAMESPACE = '/realtime';

export const REALTIME_GENERIC_EVENT = 'realtime.event';
export const REALTIME_CONNECTED_EVENT = 'realtime.connected';
export const REALTIME_CONTEXT_EVENT = 'realtime.context';
export const REALTIME_SYNC_EVENT = 'realtime.sync';
export const REALTIME_PING_EVENT = 'realtime.ping';
export const REALTIME_ERROR_EVENT = 'realtime.error';

export const REALTIME_ROOM_PREFIXES = {
  organization: 'organization:',
  member: 'member:',
  user: 'user:',
} as const;

export const realtimeOrganizationRoom = (organizationId: string): string =>
  `${REALTIME_ROOM_PREFIXES.organization}${organizationId}`;

export const realtimeMemberRoom = (memberId: string): string =>
  `${REALTIME_ROOM_PREFIXES.member}${memberId}`;

export const realtimeUserRoom = (userId: string): string =>
  `${REALTIME_ROOM_PREFIXES.user}${userId}`;

export const isRealtimeManagedRoom = (room: string): boolean =>
  Object.values(REALTIME_ROOM_PREFIXES).some((prefix) =>
    room.startsWith(prefix),
  );
