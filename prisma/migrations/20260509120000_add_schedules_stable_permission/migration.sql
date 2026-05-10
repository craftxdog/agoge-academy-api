INSERT INTO "permissions" (
  "id",
  "module_id",
  "key",
  "name",
  "description",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  "id",
  'schedules.stable',
  'Add schedules for users',
  'Create, replace, update and delete member availability without managing tenant locations, business hours or exceptions.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "app_modules"
WHERE "key" = 'schedules'
ON CONFLICT ("key") DO UPDATE SET
  "module_id" = EXCLUDED."module_id",
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "updated_at" = CURRENT_TIMESTAMP;

INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT r."id", p."id", CURRENT_TIMESTAMP
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."key" = 'admin'
  AND r."is_system" = TRUE
  AND p."key" = 'schedules.stable'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
