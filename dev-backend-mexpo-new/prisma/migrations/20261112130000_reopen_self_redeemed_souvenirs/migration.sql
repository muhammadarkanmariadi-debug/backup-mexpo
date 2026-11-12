-- Corrects the backfill of 20261112120000_add_souvenir_voucher_and_collection.
--
-- That migration marked EVERY pre-voucher redemption as collected, on the grounds
-- that the counter used to hand items over on the spot. That is true for rows the
-- counter created (created_by = the staff member), but not for rows a visitor
-- created for themself from the dashboard (created_by = user_id) while the
-- self-redemption feature was live without vouchers: nobody scanned anything, and
-- those visitors never got a QR. Left as "collected" they could not claim the item.
--
-- Give each of those redemptions a voucher code and put it back to "waiting at the
-- counter", so the visitor sees a QR and staff can hand the item over once.
-- (md5 hex upper-cased fits the SV-XXXXXXXXXX format.) Rows that already have a
-- code, and rows created by staff, are left alone.
UPDATE "souvenirs"
SET "code" = 'SV-' || upper(substr(md5(random()::text || "id"::text || clock_timestamp()::text), 1, 10)),
    "collected_at" = NULL,
    "collected_by" = NULL
WHERE "code" IS NULL
  AND "created_by" = "user_id";
