# Notifications API

This document describes the shared tenant inbox exposed by the API.

## Scope

- Module key: `notifications`
- Permission required: `notifications.read`
- Base route: `/api/v1/notifications`

The inbox is shared per organization. Marking a notification as read affects the tenant inbox for that organization.

## Endpoints

### `GET /notifications`

Cursor-paginated historical inbox.

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

Returns:

- `unreadCount`
- `latestCreatedAt`
- `recent`

This endpoint is the recommended backend source for dropdowns, bells, and lightweight inbox previews.

### `PATCH /notifications/:notificationId/read`

Marks one shared notification as read and emits a realtime event:

- `notifications.notification.read`
- `realtime.event`

### `PATCH /notifications/read-all`

Marks every unread notification in the tenant inbox as read and emits:

- `notifications.inbox.read-all`
- `realtime.event`

## Realtime Contract

When the backend creates a persistent inbox entry, it also emits:

- `notifications.notification.created`
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
