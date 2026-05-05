UPDATE "permissions"
SET
  "description" = 'View tenant payments, charges and billing settings.',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "key" = 'billing.read';

UPDATE "permissions"
SET
  "description" = 'View organization schedules, locations, exceptions and member availability.',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "key" = 'schedules.read';

UPDATE "permissions"
SET
  "description" = 'View tenant-wide analytics dashboards and business insights.',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "key" = 'analytics.read';

INSERT INTO "permissions" ("id", "module_id", "key", "name", "description", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'analytics.self.read', 'Read own analytics', 'View personal self-service analytics such as own balances, availability and activity.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "app_modules"
WHERE "key" = 'analytics'
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "app_screens" ("id", "module_id", "key", "name", "path", "required_permission_key", "sort_order", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'my-payments', 'My Payments', '/billing/me/payments', 'billing.self.read', 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "app_modules"
WHERE "key" = 'billing'
ON CONFLICT ("module_id", "key") DO NOTHING;

INSERT INTO "app_screens" ("id", "module_id", "key", "name", "path", "required_permission_key", "sort_order", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'my-availability', 'My Availability', '/schedules/me/availability', 'schedules.self.read', 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "app_modules"
WHERE "key" = 'schedules'
ON CONFLICT ("module_id", "key") DO NOTHING;

INSERT INTO "app_screens" ("id", "module_id", "key", "name", "path", "required_permission_key", "sort_order", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'activity', 'My Activity', '/activity', 'notifications.self.read', 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "app_modules"
WHERE "key" = 'notifications'
ON CONFLICT ("module_id", "key") DO NOTHING;

INSERT INTO "app_screens" ("id", "module_id", "key", "name", "path", "required_permission_key", "sort_order", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'my-dashboard', 'My Dashboard', '/analytics/me/dashboard', 'analytics.self.read', 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "app_modules"
WHERE "key" = 'analytics'
ON CONFLICT ("module_id", "key") DO NOTHING;

INSERT INTO "organization_screens" ("id", "organization_id", "app_screen_id", "module_id", "key", "title", "path", "type", "required_permission_key", "sort_order", "is_visible", "created_at", "updated_at")
SELECT gen_random_uuid(), o."id", s."id", s."module_id", m."key" || '.' || s."key", s."name", s."path", 'SYSTEM', s."required_permission_key", s."sort_order", true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "organizations" o
JOIN "app_modules" m ON m."key" IN ('billing', 'schedules', 'notifications', 'analytics')
JOIN "app_screens" s ON s."module_id" = m."id"
WHERE o."deleted_at" IS NULL
  AND s."key" IN ('my-payments', 'my-availability', 'activity', 'my-dashboard')
ON CONFLICT ("organization_id", "key") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT r."id", p."id", CURRENT_TIMESTAMP
FROM "roles" r
JOIN "permissions" p ON p."key" = 'analytics.self.read'
WHERE r."key" IN ('customer', 'admin')
ON CONFLICT DO NOTHING;
