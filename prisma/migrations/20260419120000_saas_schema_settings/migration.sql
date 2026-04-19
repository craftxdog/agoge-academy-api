CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'INVITED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_PAID';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'INVITATION_CREATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ROLE_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MODULE_ENABLED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SYSTEM_MESSAGE';

CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');
CREATE TYPE "PlatformRole" AS ENUM ('SUPER_ADMIN', 'SUPPORT', 'USER');
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED', 'REMOVED');
CREATE TYPE "ModuleStatus" AS ENUM ('ACTIVE', 'DEPRECATED');
CREATE TYPE "ScreenType" AS ENUM ('SYSTEM', 'CUSTOM_PAGE', 'EXTERNAL_LINK', 'FORM', 'EMBED');
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
CREATE TYPE "PaymentFrequency" AS ENUM ('ONE_TIME', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED');

ALTER TABLE "payments" RENAME TO "payments_legacy";
ALTER TABLE "schedules" RENAME TO "schedules_legacy";
ALTER TABLE "settings" RENAME TO "settings_legacy";
ALTER TABLE "notifications" RENAME TO "notifications_legacy";

ALTER TABLE "payments_legacy" DROP CONSTRAINT IF EXISTS "payments_user_id_fkey";
ALTER TABLE "payments_legacy" DROP CONSTRAINT IF EXISTS "payments_pkey";
DROP INDEX IF EXISTS "payments_user_id_status_idx";
DROP INDEX IF EXISTS "payments_due_date_idx";
DROP INDEX IF EXISTS "payments_user_id_month_year_key";

ALTER TABLE "schedules_legacy" DROP CONSTRAINT IF EXISTS "schedules_user_id_fkey";
ALTER TABLE "schedules_legacy" DROP CONSTRAINT IF EXISTS "schedules_pkey";
DROP INDEX IF EXISTS "schedules_user_id_idx";
DROP INDEX IF EXISTS "schedules_user_id_day_start_time_end_time_key";

ALTER TABLE "settings_legacy" DROP CONSTRAINT IF EXISTS "settings_pkey";

ALTER TABLE "notifications_legacy" DROP CONSTRAINT IF EXISTS "notifications_user_id_fkey";
ALTER TABLE "notifications_legacy" DROP CONSTRAINT IF EXISTS "notifications_pkey";
DROP INDEX IF EXISTS "notifications_user_id_is_read_idx";
DROP INDEX IF EXISTS "notifications_user_id_created_at_idx";

CREATE TABLE "organizations" (
  "id" UUID NOT NULL,
  "slug" VARCHAR(80) NOT NULL,
  "name" TEXT NOT NULL,
  "legal_name" TEXT,
  "tax_id" VARCHAR(60),
  "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
  "timezone" VARCHAR(80) NOT NULL DEFAULT 'America/Managua',
  "locale" VARCHAR(10) NOT NULL DEFAULT 'es-NI',
  "default_currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organization_branding" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "logo_url" TEXT,
  "icon_url" TEXT,
  "primary_color" VARCHAR(20),
  "secondary_color" VARCHAR(20),
  "accent_color" VARCHAR(20),
  "theme" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "organization_branding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organization_settings" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "namespace" VARCHAR(80) NOT NULL,
  "key" VARCHAR(120) NOT NULL,
  "value" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "organization_settings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "users" ADD COLUMN "platform_role" "PlatformRole" NOT NULL DEFAULT 'USER';
ALTER TABLE "users" ALTER COLUMN "username" DROP NOT NULL;

CREATE TABLE "organization_members" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
  "phone" VARCHAR(20),
  "document_id" VARCHAR(30),
  "address" VARCHAR(255),
  "joined_at" TIMESTAMP(3),
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invitations" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "invited_by_member_id" UUID,
  "email" TEXT NOT NULL,
  "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "accepted_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app_modules" (
  "id" UUID NOT NULL,
  "key" VARCHAR(80) NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "ModuleStatus" NOT NULL DEFAULT 'ACTIVE',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "app_modules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "permissions" (
  "id" UUID NOT NULL,
  "module_id" UUID,
  "key" VARCHAR(120) NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "roles" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "key" VARCHAR(80) NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "is_system" BOOLEAN NOT NULL DEFAULT false,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "role_permissions" (
  "role_id" UUID NOT NULL,
  "permission_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id")
);

CREATE TABLE "member_roles" (
  "member_id" UUID NOT NULL,
  "role_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "member_roles_pkey" PRIMARY KEY ("member_id", "role_id")
);

CREATE TABLE "app_screens" (
  "id" UUID NOT NULL,
  "module_id" UUID NOT NULL,
  "key" VARCHAR(120) NOT NULL,
  "name" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "required_permission_key" VARCHAR(120),
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "app_screens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organization_modules" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "module_id" UUID NOT NULL,
  "is_enabled" BOOLEAN NOT NULL DEFAULT true,
  "config" JSONB,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "organization_modules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organization_screens" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "app_screen_id" UUID,
  "module_id" UUID,
  "key" VARCHAR(120) NOT NULL,
  "title" TEXT NOT NULL,
  "path" TEXT,
  "type" "ScreenType" NOT NULL DEFAULT 'SYSTEM',
  "required_permission_key" VARCHAR(120),
  "config" JSONB,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_visible" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "organization_screens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "locations" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "address" VARCHAR(255),
  "timezone" VARCHAR(80),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "business_hours" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "location_id" UUID,
  "day_of_week" INTEGER NOT NULL,
  "start_time" TIME(0) NOT NULL,
  "end_time" TIME(0) NOT NULL,
  "is_closed" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "business_hours_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "schedule_exceptions" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "location_id" UUID,
  "date" DATE NOT NULL,
  "name" TEXT NOT NULL,
  "start_time" TIME(0),
  "end_time" TIME(0),
  "is_closed" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "schedule_exceptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "member_schedules" (
  "id" UUID NOT NULL,
  "member_id" UUID NOT NULL,
  "location_id" UUID,
  "day_of_week" INTEGER NOT NULL,
  "start_time" TIME(0) NOT NULL,
  "end_time" TIME(0) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "member_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_types" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "key" VARCHAR(80) NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "amount" DECIMAL(10,2),
  "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
  "frequency" "PaymentFrequency" NOT NULL DEFAULT 'ONE_TIME',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "config" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "payment_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_methods" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "key" VARCHAR(80) NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "requires_reference" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "config" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "member_id" UUID NOT NULL,
  "payment_type_id" UUID,
  "invoice_number" VARCHAR(80),
  "amount" DECIMAL(10,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "due_date" TIMESTAMP(3) NOT NULL,
  "paid_at" TIMESTAMP(3),
  "period_month" INTEGER,
  "period_year" INTEGER,
  "notes" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_transactions" (
  "id" UUID NOT NULL,
  "payment_id" UUID NOT NULL,
  "payment_method_id" UUID,
  "amount" DECIMAL(10,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
  "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'PENDING',
  "reference" VARCHAR(120),
  "processed_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "user_id" UUID,
  "member_id" UUID,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "data" JSONB,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "actor_user_id" UUID,
  "actor_member_id" UUID,
  "action" VARCHAR(120) NOT NULL,
  "entity_type" VARCHAR(120) NOT NULL,
  "entity_id" VARCHAR(120),
  "before" JSONB,
  "after" JSONB,
  "metadata" JSONB,
  "ip_address" VARCHAR(60),
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE INDEX "organizations_status_idx" ON "organizations"("status");
CREATE INDEX "organizations_deleted_at_idx" ON "organizations"("deleted_at");

CREATE UNIQUE INDEX "organization_branding_organization_id_key" ON "organization_branding"("organization_id");

CREATE UNIQUE INDEX "organization_settings_organization_id_namespace_key_key" ON "organization_settings"("organization_id", "namespace", "key");
CREATE INDEX "organization_settings_organization_id_namespace_idx" ON "organization_settings"("organization_id", "namespace");

CREATE INDEX "users_platform_role_idx" ON "users"("platform_role");

CREATE UNIQUE INDEX "organization_members_organization_id_user_id_key" ON "organization_members"("organization_id", "user_id");
CREATE UNIQUE INDEX "organization_members_organization_id_document_id_key" ON "organization_members"("organization_id", "document_id");
CREATE INDEX "organization_members_organization_id_status_idx" ON "organization_members"("organization_id", "status");
CREATE INDEX "organization_members_user_id_idx" ON "organization_members"("user_id");
CREATE INDEX "organization_members_deleted_at_idx" ON "organization_members"("deleted_at");

CREATE UNIQUE INDEX "invitations_token_hash_key" ON "invitations"("token_hash");
CREATE UNIQUE INDEX "invitations_organization_id_email_status_key" ON "invitations"("organization_id", "email", "status");
CREATE INDEX "invitations_organization_id_status_idx" ON "invitations"("organization_id", "status");
CREATE INDEX "invitations_email_idx" ON "invitations"("email");

CREATE UNIQUE INDEX "app_modules_key_key" ON "app_modules"("key");
CREATE INDEX "app_modules_status_idx" ON "app_modules"("status");

CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");
CREATE INDEX "permissions_module_id_idx" ON "permissions"("module_id");

CREATE UNIQUE INDEX "roles_organization_id_key_key" ON "roles"("organization_id", "key");
CREATE INDEX "roles_organization_id_idx" ON "roles"("organization_id");

CREATE UNIQUE INDEX "app_screens_module_id_key_key" ON "app_screens"("module_id", "key");
CREATE INDEX "app_screens_module_id_idx" ON "app_screens"("module_id");

CREATE UNIQUE INDEX "organization_modules_organization_id_module_id_key" ON "organization_modules"("organization_id", "module_id");
CREATE INDEX "organization_modules_organization_id_is_enabled_idx" ON "organization_modules"("organization_id", "is_enabled");

CREATE UNIQUE INDEX "organization_screens_organization_id_key_key" ON "organization_screens"("organization_id", "key");
CREATE INDEX "organization_screens_organization_id_is_visible_idx" ON "organization_screens"("organization_id", "is_visible");
CREATE INDEX "organization_screens_app_screen_id_idx" ON "organization_screens"("app_screen_id");

CREATE UNIQUE INDEX "locations_organization_id_name_key" ON "locations"("organization_id", "name");
CREATE INDEX "locations_organization_id_is_active_idx" ON "locations"("organization_id", "is_active");

CREATE UNIQUE INDEX "business_hours_organization_id_location_id_day_of_week_start_time_end_time_key" ON "business_hours"("organization_id", "location_id", "day_of_week", "start_time", "end_time");
CREATE INDEX "business_hours_organization_id_day_of_week_idx" ON "business_hours"("organization_id", "day_of_week");

CREATE UNIQUE INDEX "schedule_exceptions_organization_id_location_id_date_name_key" ON "schedule_exceptions"("organization_id", "location_id", "date", "name");
CREATE INDEX "schedule_exceptions_organization_id_date_idx" ON "schedule_exceptions"("organization_id", "date");

CREATE UNIQUE INDEX "member_schedules_member_id_location_id_day_of_week_start_time_end_time_key" ON "member_schedules"("member_id", "location_id", "day_of_week", "start_time", "end_time");
CREATE INDEX "member_schedules_member_id_idx" ON "member_schedules"("member_id");

CREATE UNIQUE INDEX "payment_types_organization_id_key_key" ON "payment_types"("organization_id", "key");
CREATE INDEX "payment_types_organization_id_is_active_idx" ON "payment_types"("organization_id", "is_active");

CREATE UNIQUE INDEX "payment_methods_organization_id_key_key" ON "payment_methods"("organization_id", "key");
CREATE INDEX "payment_methods_organization_id_is_active_idx" ON "payment_methods"("organization_id", "is_active");

CREATE UNIQUE INDEX "payments_organization_id_invoice_number_key" ON "payments"("organization_id", "invoice_number");
CREATE INDEX "payments_organization_id_status_idx" ON "payments"("organization_id", "status");
CREATE INDEX "payments_member_id_status_idx" ON "payments"("member_id", "status");
CREATE INDEX "payments_due_date_idx" ON "payments"("due_date");
CREATE INDEX "payments_payment_type_id_idx" ON "payments"("payment_type_id");

CREATE INDEX "payment_transactions_payment_id_status_idx" ON "payment_transactions"("payment_id", "status");
CREATE INDEX "payment_transactions_payment_method_id_idx" ON "payment_transactions"("payment_method_id");

CREATE INDEX "notifications_organization_id_is_read_idx" ON "notifications"("organization_id", "is_read");
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");
CREATE INDEX "notifications_member_id_is_read_idx" ON "notifications"("member_id", "is_read");
CREATE INDEX "notifications_organization_id_created_at_idx" ON "notifications"("organization_id", "created_at");

CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "audit_logs"("organization_id", "created_at");
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");
CREATE INDEX "audit_logs_actor_member_id_idx" ON "audit_logs"("actor_member_id");
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

ALTER TABLE "organization_branding" ADD CONSTRAINT "organization_branding_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_member_id_fkey" FOREIGN KEY ("invited_by_member_id") REFERENCES "organization_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "app_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_roles" ADD CONSTRAINT "member_roles_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "organization_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_roles" ADD CONSTRAINT "member_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "app_screens" ADD CONSTRAINT "app_screens_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "app_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_modules" ADD CONSTRAINT "organization_modules_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_modules" ADD CONSTRAINT "organization_modules_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "app_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_screens" ADD CONSTRAINT "organization_screens_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_screens" ADD CONSTRAINT "organization_screens_app_screen_id_fkey" FOREIGN KEY ("app_screen_id") REFERENCES "app_screens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_screens" ADD CONSTRAINT "organization_screens_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "app_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "locations" ADD CONSTRAINT "locations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_schedules" ADD CONSTRAINT "member_schedules_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "organization_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_schedules" ADD CONSTRAINT "member_schedules_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_types" ADD CONSTRAINT "payment_types_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "organization_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_type_id_fkey" FOREIGN KEY ("payment_type_id") REFERENCES "payment_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "organization_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_member_id_fkey" FOREIGN KEY ("actor_member_id") REFERENCES "organization_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "organizations" ("id", "slug", "name", "status", "timezone", "locale", "default_currency", "created_at", "updated_at")
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'agoge-academy',
  'Agoge Academy',
  'ACTIVE',
  'America/Managua',
  'es-NI',
  COALESCE((SELECT "currency" FROM "settings_legacy" LIMIT 1), 'USD'),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "organization_settings" ("id", "organization_id", "namespace", "key", "value", "created_at", "updated_at")
SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'billing', 'monthly_fee', to_jsonb("monthly_fee"), "created_at", "updated_at"
FROM "settings_legacy";

INSERT INTO "organization_settings" ("id", "organization_id", "namespace", "key", "value", "created_at", "updated_at")
SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'billing', 'late_fee', to_jsonb("late_fee"), "created_at", "updated_at"
FROM "settings_legacy";

INSERT INTO "organization_settings" ("id", "organization_id", "namespace", "key", "value", "created_at", "updated_at")
SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'billing', 'currency', to_jsonb("currency"), "created_at", "updated_at"
FROM "settings_legacy";

INSERT INTO "organization_settings" ("id", "organization_id", "namespace", "key", "value", "created_at", "updated_at")
SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'billing', 'payment_day', to_jsonb("payment_day"), "created_at", "updated_at"
FROM "settings_legacy";

INSERT INTO "app_modules" ("id", "key", "name", "description", "status", "sort_order", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'settings', 'Settings', 'Company settings, branding, modules and permissions.', 'ACTIVE', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'users', 'Users', 'Members, invitations and user administration.', 'ACTIVE', 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'billing', 'Billing', 'Payment types, methods, invoices and transactions.', 'ACTIVE', 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'schedules', 'Schedules', 'Business hours, exceptions and member schedules.', 'ACTIVE', 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'notifications', 'Notifications', 'Tenant-scoped notifications.', 'ACTIVE', 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'audit', 'Audit', 'Security and moderation activity trail.', 'ACTIVE', 60, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "permissions" ("id", "module_id", "key", "name", "description", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'settings.read', 'Read settings', 'View company settings.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "app_modules" WHERE "key" = 'settings'
UNION ALL
SELECT gen_random_uuid(), "id", 'settings.write', 'Write settings', 'Update company settings.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "app_modules" WHERE "key" = 'settings'
UNION ALL
SELECT gen_random_uuid(), "id", 'modules.manage', 'Manage modules', 'Enable modules and screens.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "app_modules" WHERE "key" = 'settings'
UNION ALL
SELECT gen_random_uuid(), "id", 'roles.manage', 'Manage roles', 'Create roles and assign permissions.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "app_modules" WHERE "key" = 'settings'
UNION ALL
SELECT gen_random_uuid(), "id", 'users.read', 'Read users', 'View members and invitations.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "app_modules" WHERE "key" = 'users'
UNION ALL
SELECT gen_random_uuid(), "id", 'users.write', 'Write users', 'Create and update members.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "app_modules" WHERE "key" = 'users'
UNION ALL
SELECT gen_random_uuid(), "id", 'billing.read', 'Read billing', 'View payments and billing settings.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "app_modules" WHERE "key" = 'billing'
UNION ALL
SELECT gen_random_uuid(), "id", 'billing.write', 'Write billing', 'Create payments and update payment settings.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "app_modules" WHERE "key" = 'billing'
UNION ALL
SELECT gen_random_uuid(), "id", 'schedules.read', 'Read schedules', 'View schedules and business hours.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "app_modules" WHERE "key" = 'schedules'
UNION ALL
SELECT gen_random_uuid(), "id", 'schedules.write', 'Write schedules', 'Update schedules and business hours.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "app_modules" WHERE "key" = 'schedules'
UNION ALL
SELECT gen_random_uuid(), "id", 'notifications.read', 'Read notifications', 'View notifications.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "app_modules" WHERE "key" = 'notifications'
UNION ALL
SELECT gen_random_uuid(), "id", 'audit.read', 'Read audit logs', 'View audit logs and moderation trail.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "app_modules" WHERE "key" = 'audit'
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "app_screens" ("id", "module_id", "key", "name", "path", "required_permission_key", "sort_order", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'general', 'General Settings', '/settings/general', 'settings.read', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "app_modules" WHERE "key" = 'settings'
UNION ALL
SELECT gen_random_uuid(), "id", 'roles', 'Roles and Permissions', '/settings/roles', 'roles.manage', 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "app_modules" WHERE "key" = 'settings'
UNION ALL
SELECT gen_random_uuid(), "id", 'modules', 'Modules and Screens', '/settings/modules', 'modules.manage', 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "app_modules" WHERE "key" = 'settings'
UNION ALL
SELECT gen_random_uuid(), "id", 'members', 'Members', '/users/members', 'users.read', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "app_modules" WHERE "key" = 'users'
UNION ALL
SELECT gen_random_uuid(), "id", 'payments', 'Payments', '/billing/payments', 'billing.read', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "app_modules" WHERE "key" = 'billing'
UNION ALL
SELECT gen_random_uuid(), "id", 'payment-settings', 'Payment Settings', '/billing/settings', 'billing.write', 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "app_modules" WHERE "key" = 'billing'
UNION ALL
SELECT gen_random_uuid(), "id", 'business-hours', 'Business Hours', '/schedules/business-hours', 'schedules.read', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "app_modules" WHERE "key" = 'schedules'
UNION ALL
SELECT gen_random_uuid(), "id", 'inbox', 'Notifications', '/notifications', 'notifications.read', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "app_modules" WHERE "key" = 'notifications'
UNION ALL
SELECT gen_random_uuid(), "id", 'activity', 'Activity', '/audit/activity', 'audit.read', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "app_modules" WHERE "key" = 'audit'
ON CONFLICT ("module_id", "key") DO NOTHING;

INSERT INTO "organization_modules" ("id", "organization_id", "module_id", "is_enabled", "sort_order", "created_at", "updated_at")
SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000001', "id", true, "sort_order", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "app_modules"
ON CONFLICT ("organization_id", "module_id") DO NOTHING;

INSERT INTO "organization_screens" ("id", "organization_id", "app_screen_id", "module_id", "key", "title", "path", "type", "required_permission_key", "sort_order", "is_visible", "created_at", "updated_at")
SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000001', s."id", s."module_id", m."key" || '.' || s."key", s."name", s."path", 'SYSTEM', s."required_permission_key", s."sort_order", true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "app_screens" s
JOIN "app_modules" m ON m."id" = s."module_id"
ON CONFLICT ("organization_id", "key") DO NOTHING;

INSERT INTO "roles" ("id", "organization_id", "key", "name", "description", "is_system", "is_default", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'admin', 'Admin', 'Full company administration.', true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'customer', 'Customer', 'Default customer access.', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("organization_id", "key") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT r."id", p."id", CURRENT_TIMESTAMP
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."organization_id" = '00000000-0000-0000-0000-000000000001'
  AND r."key" = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id", "created_at")
SELECT r."id", p."id", CURRENT_TIMESTAMP
FROM "roles" r
JOIN "permissions" p ON p."key" IN ('billing.read', 'schedules.read', 'notifications.read')
WHERE r."organization_id" = '00000000-0000-0000-0000-000000000001'
  AND r."key" = 'customer'
ON CONFLICT DO NOTHING;

INSERT INTO "organization_members" ("id", "organization_id", "user_id", "status", "phone", "document_id", "address", "joined_at", "deleted_at", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  u."id",
  CASE WHEN u."status" = 'SUSPENDED' THEN 'SUSPENDED'::"MemberStatus" ELSE 'ACTIVE'::"MemberStatus" END,
  u."phone",
  u."document_id",
  u."address",
  u."created_at",
  u."deleted_at",
  u."created_at",
  u."updated_at"
FROM "users" u
ON CONFLICT ("organization_id", "user_id") DO NOTHING;

INSERT INTO "member_roles" ("member_id", "role_id", "created_at")
SELECT om."id", r."id", CURRENT_TIMESTAMP
FROM "organization_members" om
JOIN "users" u ON u."id" = om."user_id"
JOIN "roles" r ON r."organization_id" = om."organization_id" AND r."key" = lower(u."role"::text)
ON CONFLICT DO NOTHING;

INSERT INTO "payment_types" ("id", "organization_id", "key", "name", "description", "amount", "currency", "frequency", "is_active", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'monthly_membership',
  'Monthly Membership',
  'Default monthly membership migrated from global settings.',
  "monthly_fee",
  "currency",
  'MONTHLY',
  true,
  "created_at",
  "updated_at"
FROM "settings_legacy"
ON CONFLICT ("organization_id", "key") DO NOTHING;

INSERT INTO "payment_types" ("id", "organization_id", "key", "name", "description", "amount", "currency", "frequency", "is_active", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'late_fee',
  'Late Fee',
  'Default late fee migrated from global settings.',
  "late_fee",
  "currency",
  'ONE_TIME',
  true,
  "created_at",
  "updated_at"
FROM "settings_legacy"
ON CONFLICT ("organization_id", "key") DO NOTHING;

INSERT INTO "payment_methods" ("id", "organization_id", "key", "name", "description", "requires_reference", "is_active", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'cash', 'Cash', 'Cash payments.', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'bank_transfer', 'Bank Transfer', 'Bank transfer payments.', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("organization_id", "key") DO NOTHING;

INSERT INTO "payments" ("id", "organization_id", "member_id", "payment_type_id", "amount", "currency", "status", "due_date", "paid_at", "period_month", "period_year", "created_at", "updated_at")
SELECT
  p."id",
  om."organization_id",
  om."id",
  pt."id",
  p."amount",
  COALESCE((SELECT "currency" FROM "settings_legacy" LIMIT 1), 'USD'),
  p."status",
  p."due_date",
  p."paid_at",
  p."month",
  p."year",
  p."created_at",
  p."updated_at"
FROM "payments_legacy" p
JOIN "organization_members" om ON om."user_id" = p."user_id"
LEFT JOIN "payment_types" pt ON pt."organization_id" = om."organization_id" AND pt."key" = 'monthly_membership';

INSERT INTO "member_schedules" ("id", "member_id", "day_of_week", "start_time", "end_time", "created_at", "updated_at")
SELECT
  s."id",
  om."id",
  s."day",
  s."start_time"::time(0),
  s."end_time"::time(0),
  s."created_at",
  s."updated_at"
FROM "schedules_legacy" s
JOIN "organization_members" om ON om."user_id" = s."user_id";

INSERT INTO "notifications" ("id", "organization_id", "user_id", "member_id", "type", "title", "message", "data", "is_read", "created_at", "updated_at")
SELECT
  n."id",
  om."organization_id",
  n."user_id",
  om."id",
  n."type",
  n."title",
  n."message",
  n."data",
  n."is_read",
  n."created_at",
  n."updated_at"
FROM "notifications_legacy" n
JOIN "organization_members" om ON om."user_id" = n."user_id";

ALTER TABLE "users" DROP COLUMN "phone";
ALTER TABLE "users" DROP COLUMN "document_id";
ALTER TABLE "users" DROP COLUMN "address";
ALTER TABLE "users" DROP COLUMN "role";

DROP TABLE "payments_legacy";
DROP TABLE "schedules_legacy";
DROP TABLE "settings_legacy";
DROP TABLE "notifications_legacy";

DROP TYPE "Role";
