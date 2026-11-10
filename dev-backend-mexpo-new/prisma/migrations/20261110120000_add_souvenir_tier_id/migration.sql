-- Souvenir catalog: remember which catalog item (souvenir_rules.tiers[].id)
-- a redemption used, so per-item stock can be counted.
ALTER TABLE "souvenirs" ADD COLUMN "tier_id" TEXT;

CREATE INDEX "souvenirs_event_id_tier_id_idx" ON "souvenirs"("event_id", "tier_id");
