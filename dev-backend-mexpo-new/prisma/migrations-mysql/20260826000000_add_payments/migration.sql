-- AlterTable
ALTER TABLE `events`
ADD COLUMN `payout_bank_name` VARCHAR(191) NOT NULL DEFAULT '',
ADD COLUMN `payout_account_number` VARCHAR(191) NOT NULL DEFAULT '',
ADD COLUMN `payout_account_holder` VARCHAR(191) NOT NULL DEFAULT '',
ADD COLUMN `payout_status` ENUM('NOT_SETTLED','SETTLED') NOT NULL DEFAULT 'NOT_SETTLED',
ADD COLUMN `settled_at` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `transactions` (
    `uuid` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL DEFAULT '',
    `user_id` VARCHAR(191) NOT NULL DEFAULT '',
    `ticket_id` VARCHAR(191) NULL,
    `midtrans_order_id` VARCHAR(191) NOT NULL DEFAULT '',
    `amount` INTEGER NOT NULL DEFAULT 0,
    `platform_fee` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('PENDING','PAID','EXPIRED','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
    `payment_method` VARCHAR(191) NOT NULL DEFAULT '',
    `snap_token` TEXT NOT NULL,
    `paid_at` DATETIME(3) NULL,
    `expired_at` DATETIME(3) NULL,
    `refunded_at` DATETIME(3) NULL,
    `refund_reason` VARCHAR(191) NOT NULL DEFAULT '',
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_settlements` (
    `uuid` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL DEFAULT '',
    `amount_transferred` INTEGER NOT NULL DEFAULT 0,
    `transferred_by` VARCHAR(191) NOT NULL DEFAULT '',
    `proof_of_transfer` VARCHAR(191) NOT NULL DEFAULT '',
    `note` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `transactions_midtrans_order_id_key` ON `transactions`(`midtrans_order_id`);

-- CreateIndex
CREATE INDEX `transactions_event_id_idx` ON `transactions`(`event_id`);

-- CreateIndex
CREATE INDEX `transactions_user_id_idx` ON `transactions`(`user_id`);

-- CreateIndex
CREATE INDEX `event_settlements_event_id_idx` ON `event_settlements`(`event_id`);

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_ticket_id_fkey` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`uuid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_settlements` ADD CONSTRAINT `event_settlements_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_settlements` ADD CONSTRAINT `event_settlements_transferred_by_fkey` FOREIGN KEY (`transferred_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;