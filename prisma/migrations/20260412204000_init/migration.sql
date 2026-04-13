CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "Role" AS ENUM ('ADMIN', 'CUSTOMER');

CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

CREATE TYPE "NotificationType" AS ENUM ('PAYMENT_CREATED', 'PAYMENT_PAID', 'PAYMENT_OVERDUE');

CREATE TABLE "users" (
  "id" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "first_name" TEXT NOT NULL,
  "last_name" TEXT NOT NULL,
  "phone" VARCHAR(20),
  "document_id" VARCHAR(30),
  "address" VARCHAR(255),
  "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "refresh_token_hash" TEXT,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "due_date" TIMESTAMP(3) NOT NULL,
  "paid_at" TIMESTAMP(3),
  "month" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "schedules" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "day" INTEGER NOT NULL,
  "start_time" VARCHAR(5) NOT NULL,
  "end_time" VARCHAR(5) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "settings" (
  "id" TEXT NOT NULL DEFAULT 'global',
  "monthly_fee" DECIMAL(10,2) NOT NULL,
  "late_fee" DECIMAL(10,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
  "payment_day" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "data" JSONB,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

CREATE UNIQUE INDEX "users_document_id_key" ON "users"("document_id");

CREATE INDEX "users_status_idx" ON "users"("status");

CREATE INDEX "users_role_idx" ON "users"("role");

CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

CREATE INDEX "payments_user_id_status_idx" ON "payments"("user_id", "status");

CREATE INDEX "payments_due_date_idx" ON "payments"("due_date");

CREATE UNIQUE INDEX "payments_user_id_month_year_key" ON "payments"("user_id", "month", "year");

CREATE INDEX "schedules_user_id_idx" ON "schedules"("user_id");

CREATE UNIQUE INDEX "schedules_user_id_day_start_time_end_time_key" ON "schedules"("user_id", "day", "start_time", "end_time");

CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "schedules" ADD CONSTRAINT "schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
