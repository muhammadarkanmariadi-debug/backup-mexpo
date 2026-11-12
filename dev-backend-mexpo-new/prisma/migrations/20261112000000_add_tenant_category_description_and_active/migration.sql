-- Catch-up migration: commit 74e669b changed schema.prisma without a migration,
-- so databases built with `prisma migrate deploy` lacked these columns and every
-- query that includes tenant_categories (events, public events, tenants) failed
-- with "column tenant_categories.description does not exist".
-- Written to be idempotent so it is also safe on databases that already have the
-- columns (e.g. created with `prisma db push`).

-- tenant_categories: description + active toggle
ALTER TABLE "tenant_categories" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "tenant_categories" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

-- transactions: snap_token is always supplied by the payment service
ALTER TABLE "transactions" ALTER COLUMN "snap_token" DROP DEFAULT;
