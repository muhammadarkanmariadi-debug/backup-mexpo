-- CreateTable
CREATE TABLE `certificate_templates` (
    `uuid` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL DEFAULT '',
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `kind` VARCHAR(191) NOT NULL DEFAULT 'WORKSHOP',
    `template` JSON NULL,
    `background` VARCHAR(191) NOT NULL DEFAULT '',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `certificate_templates_event_id_idx` ON `certificate_templates`(`event_id`);

-- AddForeignKey
ALTER TABLE `certificate_templates` ADD CONSTRAINT `certificate_templates_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificate_templates` ADD CONSTRAINT `certificate_templates_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificate_templates` ADD CONSTRAINT `certificate_templates_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;