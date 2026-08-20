-- Align ticket_mode with features.paidTicket for existing events. The admin
-- form only ever wrote the "Tiket Berbayar" feature flag, so ticket_mode
-- defaulted to FREE and paid events were shown/processed as free.

UPDATE "events"
SET "ticket_mode" = 'PAID'
WHERE "features" IS NOT NULL
  AND ("features"->>'paidTicket') = 'true';

UPDATE "events"
SET "ticket_mode" = 'FREE'
WHERE "features" IS NOT NULL
  AND ("features"->>'paidTicket') = 'false';