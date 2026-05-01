INSERT INTO "permissions" ("id", "module_id", "key", "name", "description", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'billing.self.read', 'Read own billing', 'View personal payments and billing activity.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "app_modules"
WHERE "key" = 'billing'
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "permissions" ("id", "module_id", "key", "name", "description", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'schedules.self.read', 'Read own schedules', 'View personal schedule availability.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "app_modules"
WHERE "key" = 'schedules'
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "permissions" ("id", "module_id", "key", "name", "description", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'notifications.self.read', 'Read own activity', 'View personal activity notifications.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "app_modules"
WHERE "key" = 'notifications'
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "roles" ("id", "organization_id", "key", "name", "description", "is_system", "is_default", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  o."id",
  'customer',
  'Customer',
  'Default self-service customer access.',
  true,
  NOT EXISTS (
    SELECT 1
    FROM "roles" existing_default
    WHERE existing_default."organization_id" = o."id"
      AND existing_default."is_default" = true
  ),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "organizations" o
WHERE o."deleted_at" IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "roles" existing_customer
    WHERE existing_customer."organization_id" = o."id"
      AND existing_customer."key" = 'customer'
  );

DELETE FROM "role_permissions"
WHERE "role_id" IN (
  SELECT "id"
  FROM "roles"
  WHERE "key" = 'customer'
);

INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT r."id", p."id", CURRENT_TIMESTAMP
FROM "roles" r
JOIN "permissions" p
  ON p."key" IN ('billing.self.read', 'schedules.self.read', 'notifications.self.read')
WHERE r."key" = 'customer'
ON CONFLICT DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT r."id", p."id", CURRENT_TIMESTAMP
FROM "roles" r
JOIN "permissions" p
  ON p."key" IN ('billing.self.read', 'schedules.self.read', 'notifications.self.read')
WHERE r."key" = 'admin'
ON CONFLICT DO NOTHING;
