INSERT INTO "app_modules" ("id", "key", "name", "description", "status", "sort_order", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'analytics', 'Analytics', 'Executive dashboards, revenue intelligence and operational insights.', 'ACTIVE', 70, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "permissions" ("id", "module_id", "key", "name", "description", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'analytics.read', 'Read analytics', 'View executive analytics dashboards and business insights.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "app_modules"
WHERE "key" = 'analytics'
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "app_screens" ("id", "module_id", "key", "name", "path", "required_permission_key", "sort_order", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'dashboard', 'Analytics Dashboard', '/analytics/dashboard', 'analytics.read', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "app_modules"
WHERE "key" = 'analytics'
ON CONFLICT ("module_id", "key") DO NOTHING;

INSERT INTO "organization_modules" ("id", "organization_id", "module_id", "is_enabled", "sort_order", "created_at", "updated_at")
SELECT gen_random_uuid(), o."id", m."id", true, m."sort_order", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "organizations" o
CROSS JOIN "app_modules" m
WHERE o."deleted_at" IS NULL
  AND m."key" = 'analytics'
ON CONFLICT ("organization_id", "module_id") DO NOTHING;

INSERT INTO "organization_screens" ("id", "organization_id", "app_screen_id", "module_id", "key", "title", "path", "type", "required_permission_key", "sort_order", "is_visible", "created_at", "updated_at")
SELECT gen_random_uuid(), o."id", s."id", s."module_id", m."key" || '.' || s."key", s."name", s."path", 'SYSTEM', s."required_permission_key", s."sort_order", true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "organizations" o
JOIN "app_modules" m ON m."key" = 'analytics'
JOIN "app_screens" s ON s."module_id" = m."id"
WHERE o."deleted_at" IS NULL
ON CONFLICT ("organization_id", "key") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT r."id", p."id", CURRENT_TIMESTAMP
FROM "roles" r
JOIN "permissions" p ON p."key" = 'analytics.read'
WHERE r."key" = 'admin'
ON CONFLICT DO NOTHING;
