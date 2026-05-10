CREATE TABLE IF NOT EXISTS "endpoint_permission_rules" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "method" VARCHAR(12) NOT NULL,
  "path_pattern" VARCHAR(300) NOT NULL,
  "permission_key" VARCHAR(120) NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "endpoint_permission_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "endpoint_permission_rules_method_path_pattern_permission_key_key"
  ON "endpoint_permission_rules"("method", "path_pattern", "permission_key");

CREATE INDEX IF NOT EXISTS "endpoint_permission_rules_method_is_active_idx"
  ON "endpoint_permission_rules"("method", "is_active");

CREATE INDEX IF NOT EXISTS "endpoint_permission_rules_permission_key_idx"
  ON "endpoint_permission_rules"("permission_key");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'endpoint_permission_rules_permission_key_fkey'
  ) THEN
    ALTER TABLE "endpoint_permission_rules"
      ADD CONSTRAINT "endpoint_permission_rules_permission_key_fkey"
      FOREIGN KEY ("permission_key")
      REFERENCES "permissions"("key")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

WITH permission_catalog ("module_key", "key", "name", "description") AS (
  VALUES
    ('users', 'users.members.create', 'Create members', 'Create or add tenant members without full user admin.'),
    ('users', 'users.members.update', 'Update members', 'Update tenant member profile details.'),
    ('users', 'users.members.status.manage', 'Manage member status', 'Suspend or reactivate tenant members.'),
    ('users', 'users.members.remove', 'Remove members', 'Remove tenant members.'),
    ('users', 'users.invitations.create', 'Create invitations', 'Create tenant invitations.'),
    ('users', 'users.invitations.revoke', 'Revoke invitations', 'Revoke pending tenant invitations.'),
    ('users', 'member.create', 'Create members alias', 'Alias permission for creating or adding tenant members from custom role builders.'),
    ('billing', 'billing.cobros', 'Billing Cobros', 'View member payments and payment transactions.'),
    ('billing', 'billing.payment-types.manage', 'Manage payment concepts', 'Create, update or archive payment concepts.'),
    ('billing', 'billing.payment-methods.manage', 'Manage payment methods', 'Create, update or archive payment methods.'),
    ('billing', 'billing.payments.create', 'Create member payments', 'Create payments or charges for tenant members.'),
    ('billing', 'billing.payments.update', 'Update member payments', 'Update payment lifecycle, due dates and payment metadata.'),
    ('billing', 'billing.transactions.create', 'Record payment transactions', 'Record payment transactions against member payments.'),
    ('billing', 'billing.stable', 'Billing Members', 'Create member payments, record transactions and update member payment lifecycle without managing payment concepts or methods.'),
    ('billing', 'billing.catalog.manage', 'Manage billing catalog', 'Create, update or archive payment concepts and methods.'),
    ('schedules', 'schedules.locations.manage', 'Manage schedule locations', 'Create, update or deactivate schedule locations.'),
    ('schedules', 'schedules.business-hours.manage', 'Manage business hours', 'Create, replace, update or delete business hours.'),
    ('schedules', 'schedules.exceptions.manage', 'Manage schedule exceptions', 'Create, update or delete schedule exceptions.'),
    ('schedules', 'schedules.availability.manage', 'Manage member availability', 'Create, replace, update or delete member availability.'),
    ('schedules', 'schedules.stable', 'Add schedules for users', 'Create, replace, update and delete member availability without managing tenant locations, business hours or exceptions.')
)
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
  m."id",
  c."key",
  c."name",
  c."description",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM permission_catalog c
JOIN "app_modules" m ON m."key" = c."module_key"
ON CONFLICT ("key") DO UPDATE SET
  "module_id" = EXCLUDED."module_id",
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "updated_at" = CURRENT_TIMESTAMP;

WITH endpoint_rules ("method", "path_pattern", "permission_key", "description") AS (
  VALUES
    ('POST', '/users/members', 'users.write', 'Create or add a tenant member.'),
    ('POST', '/users/members', 'users.members.create', 'Create or add a tenant member.'),
    ('POST', '/users/members', 'member.create', 'Create or add a tenant member.'),
    ('PATCH', '/users/members/:memberId', 'users.write', 'Update tenant member profile.'),
    ('PATCH', '/users/members/:memberId', 'users.members.update', 'Update tenant member profile.'),
    ('PATCH', '/users/members/:memberId/status', 'users.write', 'Suspend or reactivate a tenant member.'),
    ('PATCH', '/users/members/:memberId/status', 'users.members.status.manage', 'Suspend or reactivate a tenant member.'),
    ('DELETE', '/users/members/:memberId', 'users.write', 'Remove a tenant member.'),
    ('DELETE', '/users/members/:memberId', 'users.members.remove', 'Remove a tenant member.'),
    ('POST', '/users/invitations', 'users.write', 'Create a tenant invitation.'),
    ('POST', '/users/invitations', 'users.invitations.create', 'Create a tenant invitation.'),
    ('POST', '/users/invitations', 'users.members.create', 'Create a tenant invitation.'),
    ('POST', '/users/invitations', 'member.create', 'Create a tenant invitation.'),
    ('POST', '/users/invitations/:invitationId/revoke', 'users.write', 'Revoke a pending tenant invitation.'),
    ('POST', '/users/invitations/:invitationId/revoke', 'users.invitations.revoke', 'Revoke a pending tenant invitation.'),
    ('GET', '/billing/summary', 'billing.read', 'View tenant billing summary.'),
    ('GET', '/billing/summary', 'billing.cobros', 'View tenant billing summary.'),
    ('GET', '/billing/payments', 'billing.read', 'List tenant payments.'),
    ('GET', '/billing/payments', 'billing.cobros', 'List tenant payments.'),
    ('GET', '/billing/payments/:paymentId', 'billing.read', 'View payment detail.'),
    ('GET', '/billing/payments/:paymentId', 'billing.cobros', 'View payment detail.'),
    ('GET', '/billing/payments/:paymentId/transactions', 'billing.read', 'List payment transactions.'),
    ('GET', '/billing/payments/:paymentId/transactions', 'billing.cobros', 'List payment transactions.'),
    ('POST', '/billing/payment-types', 'billing.write', 'Create a payment concept.'),
    ('POST', '/billing/payment-types', 'billing.catalog.manage', 'Create a payment concept.'),
    ('POST', '/billing/payment-types', 'billing.payment-types.manage', 'Create a payment concept.'),
    ('PATCH', '/billing/payment-types/:paymentTypeId', 'billing.write', 'Update a payment concept.'),
    ('PATCH', '/billing/payment-types/:paymentTypeId', 'billing.catalog.manage', 'Update a payment concept.'),
    ('PATCH', '/billing/payment-types/:paymentTypeId', 'billing.payment-types.manage', 'Update a payment concept.'),
    ('DELETE', '/billing/payment-types/:paymentTypeId', 'billing.write', 'Archive a payment concept.'),
    ('DELETE', '/billing/payment-types/:paymentTypeId', 'billing.catalog.manage', 'Archive a payment concept.'),
    ('DELETE', '/billing/payment-types/:paymentTypeId', 'billing.payment-types.manage', 'Archive a payment concept.'),
    ('POST', '/billing/payment-methods', 'billing.write', 'Create a payment method.'),
    ('POST', '/billing/payment-methods', 'billing.catalog.manage', 'Create a payment method.'),
    ('POST', '/billing/payment-methods', 'billing.payment-methods.manage', 'Create a payment method.'),
    ('PATCH', '/billing/payment-methods/:paymentMethodId', 'billing.write', 'Update a payment method.'),
    ('PATCH', '/billing/payment-methods/:paymentMethodId', 'billing.catalog.manage', 'Update a payment method.'),
    ('PATCH', '/billing/payment-methods/:paymentMethodId', 'billing.payment-methods.manage', 'Update a payment method.'),
    ('DELETE', '/billing/payment-methods/:paymentMethodId', 'billing.write', 'Archive a payment method.'),
    ('DELETE', '/billing/payment-methods/:paymentMethodId', 'billing.catalog.manage', 'Archive a payment method.'),
    ('DELETE', '/billing/payment-methods/:paymentMethodId', 'billing.payment-methods.manage', 'Archive a payment method.'),
    ('POST', '/billing/payments', 'billing.write', 'Create a member payment.'),
    ('POST', '/billing/payments', 'billing.payments.create', 'Create a member payment.'),
    ('POST', '/billing/payments', 'billing.stable', 'Create a member payment.'),
    ('PATCH', '/billing/payments/:paymentId', 'billing.write', 'Update a member payment.'),
    ('PATCH', '/billing/payments/:paymentId', 'billing.payments.update', 'Update a member payment.'),
    ('PATCH', '/billing/payments/:paymentId', 'billing.stable', 'Update a member payment.'),
    ('POST', '/billing/payments/:paymentId/transactions', 'billing.write', 'Record a payment transaction.'),
    ('POST', '/billing/payments/:paymentId/transactions', 'billing.transactions.create', 'Record a payment transaction.'),
    ('POST', '/billing/payments/:paymentId/transactions', 'billing.stable', 'Record a payment transaction.'),
    ('POST', '/schedules/locations', 'schedules.write', 'Create a schedule location.'),
    ('POST', '/schedules/locations', 'schedules.locations.manage', 'Create a schedule location.'),
    ('PATCH', '/schedules/locations/:locationId', 'schedules.write', 'Update a schedule location.'),
    ('PATCH', '/schedules/locations/:locationId', 'schedules.locations.manage', 'Update a schedule location.'),
    ('DELETE', '/schedules/locations/:locationId', 'schedules.write', 'Delete or deactivate a schedule location.'),
    ('DELETE', '/schedules/locations/:locationId', 'schedules.locations.manage', 'Delete or deactivate a schedule location.'),
    ('POST', '/schedules/business-hours', 'schedules.write', 'Create a business-hour window.'),
    ('POST', '/schedules/business-hours', 'schedules.business-hours.manage', 'Create a business-hour window.'),
    ('PUT', '/schedules/business-hours', 'schedules.write', 'Replace business hours for one scope.'),
    ('PUT', '/schedules/business-hours', 'schedules.business-hours.manage', 'Replace business hours for one scope.'),
    ('PATCH', '/schedules/business-hours/:businessHourId', 'schedules.write', 'Update a business-hour window.'),
    ('PATCH', '/schedules/business-hours/:businessHourId', 'schedules.business-hours.manage', 'Update a business-hour window.'),
    ('DELETE', '/schedules/business-hours/:businessHourId', 'schedules.write', 'Delete a business-hour window.'),
    ('DELETE', '/schedules/business-hours/:businessHourId', 'schedules.business-hours.manage', 'Delete a business-hour window.'),
    ('POST', '/schedules/exceptions', 'schedules.write', 'Create a schedule exception.'),
    ('POST', '/schedules/exceptions', 'schedules.exceptions.manage', 'Create a schedule exception.'),
    ('PATCH', '/schedules/exceptions/:exceptionId', 'schedules.write', 'Update a schedule exception.'),
    ('PATCH', '/schedules/exceptions/:exceptionId', 'schedules.exceptions.manage', 'Update a schedule exception.'),
    ('DELETE', '/schedules/exceptions/:exceptionId', 'schedules.write', 'Delete a schedule exception.'),
    ('DELETE', '/schedules/exceptions/:exceptionId', 'schedules.exceptions.manage', 'Delete a schedule exception.'),
    ('POST', '/schedules/members/:memberId/availability', 'schedules.write', 'Create member availability.'),
    ('POST', '/schedules/members/:memberId/availability', 'schedules.availability.manage', 'Create member availability.'),
    ('POST', '/schedules/members/:memberId/availability', 'schedules.stable', 'Create member availability.'),
    ('PUT', '/schedules/members/:memberId/availability', 'schedules.write', 'Replace member availability.'),
    ('PUT', '/schedules/members/:memberId/availability', 'schedules.availability.manage', 'Replace member availability.'),
    ('PUT', '/schedules/members/:memberId/availability', 'schedules.stable', 'Replace member availability.'),
    ('PATCH', '/schedules/availability/:scheduleId', 'schedules.write', 'Update one member availability window.'),
    ('PATCH', '/schedules/availability/:scheduleId', 'schedules.availability.manage', 'Update one member availability window.'),
    ('PATCH', '/schedules/availability/:scheduleId', 'schedules.stable', 'Update one member availability window.'),
    ('DELETE', '/schedules/availability/:scheduleId', 'schedules.write', 'Delete one member availability window.'),
    ('DELETE', '/schedules/availability/:scheduleId', 'schedules.availability.manage', 'Delete one member availability window.'),
    ('DELETE', '/schedules/availability/:scheduleId', 'schedules.stable', 'Delete one member availability window.')
)
INSERT INTO "endpoint_permission_rules" (
  "id",
  "method",
  "path_pattern",
  "permission_key",
  "description",
  "is_active",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  "method",
  "path_pattern",
  "permission_key",
  "description",
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM endpoint_rules
ON CONFLICT ("method", "path_pattern", "permission_key") DO UPDATE SET
  "description" = EXCLUDED."description",
  "is_active" = TRUE,
  "updated_at" = CURRENT_TIMESTAMP;

INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT r."id", p."id", CURRENT_TIMESTAMP
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."key" = 'admin'
  AND r."is_system" = TRUE
  AND p."key" IN (
    'users.members.create',
    'users.members.update',
    'users.members.status.manage',
    'users.members.remove',
    'users.invitations.create',
    'users.invitations.revoke',
    'member.create',
    'billing.cobros',
    'billing.payment-types.manage',
    'billing.payment-methods.manage',
    'billing.payments.create',
    'billing.payments.update',
    'billing.transactions.create',
    'billing.stable',
    'billing.catalog.manage',
    'schedules.locations.manage',
    'schedules.business-hours.manage',
    'schedules.exceptions.manage',
    'schedules.availability.manage',
    'schedules.stable'
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT r."id", p."id", CURRENT_TIMESTAMP
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."key" IN ('receptionist', 'recepcionista')
  AND p."key" IN (
    'users.read',
    'member.create',
    'billing.read',
    'billing.cobros',
    'billing.stable',
    'schedules.read',
    'schedules.stable',
    'notifications.read',
    'analytics.read'
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
