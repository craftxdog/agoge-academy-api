# Notifications API

This document describes the notification model exposed by the API.

## Scope

- Shared inbox module key: `notifications`
- Shared inbox permission: `notifications.read`
- Personal activity permission: `notifications.self.read`
- Shared inbox base route: `/api/v1/notifications`
- Personal activity base route: `/api/v1/activity`

The API now exposes two distinct surfaces:

- Shared tenant inbox: operational history for admin/staff contexts. This requires both `notifications.read` and the tenant module `notifications` enabled.
- Personal activity feed: member-scoped notifications for self-service/client experiences. This requires `notifications.self.read` and does not depend on `enabledModules.notifications`.

Marking a shared inbox notification as read affects only the shared tenant inbox. Marking personal activity as read affects only that member-scoped activity feed.

## Endpoints

### `GET /activity`

Cursor-paginated personal activity feed for the authenticated member.

### `GET /activity/summary`

Returns:

- `unreadCount`
- `latestCreatedAt`
- `recent`

This is the recommended backend source for customer header activity centers or lightweight self-service previews.

### `PATCH /activity/:notificationId/read`

Marks one personal activity notification as read and emits a member-scoped realtime event.

### `PATCH /activity/read-all`

Marks the authenticated member activity feed as read and emits a member-scoped realtime event.

### `GET /notifications`

Cursor-paginated shared tenant inbox history.

Supported query params:

- `cursor`
- `limit`
- `sortBy`: `createdAt` or `updatedAt`
- `sortDirection`: `asc` or `desc`
- `isRead`
- `type`
- `search`

Example response payload shape:

```json
{
  "items": [
    {
      "id": "notification-id",
      "type": "PAYMENT_CREATED",
      "title": "Payment created",
      "message": "Invoice INV-202604-000001 was created for Alex Athlete.",
      "data": {
        "sourceDomain": "billing",
        "sourceResource": "payment",
        "sourceAction": "created",
        "entityId": "payment-id",
        "payload": {}
      },
      "isRead": false,
      "createdAt": "2026-04-20T00:00:00.000Z",
      "updatedAt": "2026-04-20T00:00:00.000Z"
    }
  ],
  "pagination": {
    "strategy": "cursor",
    "limit": 20,
    "count": 1,
    "hasNextPage": false,
    "hasPreviousPage": false,
    "nextCursor": null,
    "previousCursor": "eyJpZCI6Im5vdGlmaWNhdGlvbi1pZCJ9",
    "sortBy": "createdAt",
    "sortDirection": "desc"
  }
}
```

### `GET /notifications/summary`

Returns the unread count and recent shared tenant inbox notifications.

### `PATCH /notifications/:notificationId/read`

Marks one shared notification as read and emits an organization-scoped realtime event:

- `notifications.notification.read`
- `realtime.event`

### `PATCH /notifications/read-all`

Marks every unread shared notification in the tenant inbox as read and emits:

- `notifications.inbox.read-all`
- `realtime.event`

## Realtime Contract

When the backend creates a shared inbox entry, it emits:

- `notifications.notification.created`
- `realtime.event`

When the backend creates a member activity entry, it emits:

- `notifications.activity.created`
- `realtime.event`

Each notification payload includes `data.sourceDomain`, `data.sourceResource`, and `data.sourceAction` so the frontend can trace which domain mutation produced it.

## Current Producers

Persistent notifications are currently generated from:

- `billing`
- `schedules`

Those domain writes also invalidate:

- `notifications.inbox`
- `analytics.operations`
- `analytics.dashboard`
