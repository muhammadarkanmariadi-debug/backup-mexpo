-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('NOT_SETTLED', 'SETTLED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "events"
ADD COLUMN "payout_bank_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN "payout_account_number" TEXT NOT NULL DEFAULT '',
ADD COLUMN "payout_account_holder" TEXT NOT NULL DEFAULT '',
ADD COLUMN "payout_status" "PayoutStatus" NOT NULL DEFAULT 'NOT_SETTLED',
ADD COLUMN "settled_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "transactions" (
    "uuid" TEXT NOT NULL,
    "event_id" TEXT NOT NULL DEFAULT '',
    "user_id" TEXT NOT NULL DEFAULT '',
    "ticket_id" TEXT,
    "midtrans_order_id" TEXT NOT NULL DEFAULT '',
    "amount" INTEGER NOT NULL DEFAULT 0,
    "platform_fee" INTEGER NOT NULL DEFAULT 0,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" TEXT NOT NULL DEFAULT '',
    "snap_token" TEXT NOT NULL DEFAULT '',
    "paid_at" TIMESTAMP(3),
    "expired_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "refund_reason" TEXT NOT NULL DEFAULT '',
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "event_settlements" (
    "uuid" TEXT NOT NULL,
    "event_id" TEXT NOT NULL DEFAULT '',
    "amount_transferred" INTEGER NOT NULL DEFAULT 0,
    "transferred_by" TEXT NOT NULL DEFAULT '',
    "proof_of_transfer" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_settlements_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_midtrans_order_id_key" ON "transactions"("midtrans_order_id");

-- CreateIndex
CREATE INDEX "transactions_event_id_idx" ON "transactions"("event_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");

-- CreateIndex
CREATE INDEX "event_settlements_event_id_idx" ON "event_settlements"("event_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_settlements" ADD CONSTRAINT "event_settlements_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_settlements" ADD CONSTRAINT "event_settlements_transferred_by_fkey" FOREIGN KEY ("transferred_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;