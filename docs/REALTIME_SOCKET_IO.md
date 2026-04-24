# Realtime Socket.IO

This document describes the realtime contract exposed by the API through Socket.IO.

## Namespace

- Namespace: `/realtime`

## Authentication

The socket accepts the same JWT access token used by the HTTP API.

Supported handshake options:

- `auth.token`
- `auth.accessToken`
- `Authorization: Bearer <token>` header

If the token is invalid or expired, the gateway emits `realtime.error` and closes the connection.

## Connection Flow

1. Connect to `/realtime` with a valid access token.
2. The gateway validates the token and automatically joins the client to:
- `user:<userId>`
- `organization:<organizationId>` when the token has tenant context
- `member:<memberId>` when the token has membership context
3. The gateway emits `realtime.connected` with the resolved realtime context.
4. When the frontend refreshes tokens or changes tenant context, it should emit `realtime.sync`.

## Client Events

- `realtime.sync`
  - Revalidates the socket context.
  - Payload:
```json
{
  "accessToken": "optional-new-access-token"
}
```
- `realtime.ping`
  - Returns the current realtime context without rebinding rooms.

## Server Events

- `realtime.connected`
  - Sent immediately after a valid connection is established.
- `realtime.context`
  - Sent after a successful `realtime.sync`.
- `realtime.event`
  - Generic event envelope for all published domain mutations.
- `<domain>.<resource>.<action>`
  - Specific mutation event, for example `users.member.created` or `billing.payment.updated`.
- `realtime.error`
  - Sent when authentication or synchronization fails.

## Event Envelope

All domain mutation events share the same payload shape:

```json
{
  "id": "uuid",
  "name": "users.member.created",
  "domain": "users",
  "resource": "member",
  "action": "created",
  "entityId": "member-id",
  "organizationId": "organization-id",
  "occurredAt": "2026-04-23T03:00:00.000Z",
  "invalidate": ["users.members", "analytics.dashboard"],
  "data": {}
}
```

## Current Mutation Domains

The API currently publishes realtime updates from:

- `users`
- `billing`
- `settings`
- `rbac`
- `schedules`

These events are emitted only after successful write operations.

## Frontend Example

```ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/realtime', {
  auth: {
    token: accessToken,
  },
  withCredentials: true,
});

socket.on('realtime.connected', (context) => {
  console.log('connected', context);
});

socket.on('realtime.event', (event) => {
  for (const key of event.invalidate) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
});

socket.on('realtime.error', (error) => {
  console.error('realtime error', error);
});

const syncRealtime = (nextAccessToken: string) => {
  socket.emit('realtime.sync', { accessToken: nextAccessToken });
};
```

## Integration Guidance

- Keep HTTP as the source of truth for writes.
- Use realtime events to refresh caches, notify active views, and update operational dashboards.
- Call `realtime.sync` after login, token refresh, logout/login transitions, or tenant switches.
- Prefer consuming `realtime.event` for generic invalidation and specific event names for targeted UI reactions.
