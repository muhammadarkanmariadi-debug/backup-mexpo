-- Souvenir redemption voucher: a visitor redeems points and gets a QR (`code`);
-- the counter scans it and hands the item over (`collected_at`).
ALTER TABLE "souvenirs" ADD COLUMN IF NOT EXISTS "code" TEXT;
ALTER TABLE "souvenirs" ADD COLUMN IF NOT EXISTS "collected_at" TIMESTAMP(3);
ALTER TABLE "souvenirs" ADD COLUMN IF NOT EXISTS "collected_by" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "souvenirs_code_key" ON "souvenirs"("code");

-- Every redemption that exists before this change was handed over on the spot by
-- the counter, so it counts as collected (otherwise old rows would all look pending).
UPDATE "souvenirs"
SET "collected_at" = "created_at",
    "collected_by" = "created_by"
WHERE "collected_at" IS NULL;
