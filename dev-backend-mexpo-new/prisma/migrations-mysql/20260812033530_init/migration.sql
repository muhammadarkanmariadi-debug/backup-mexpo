-- CreateTable
CREATE TABLE `users` (
    `uuid` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `password` VARCHAR(191) NOT NULL DEFAULT '',
    `verify_at` DATETIME(3) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `photo` VARCHAR(191) NOT NULL DEFAULT '',
    `organization` VARCHAR(191) NOT NULL DEFAULT '',
    `role` ENUM('SUPERADMIN', 'USER') NOT NULL DEFAULT 'USER',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users_bio` (
    `uuid` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NULL,
    `role_type` ENUM('PARTICIPANT', 'SUPERVISOR') NULL,
    `destination_country` VARCHAR(191) NULL,
    `departure_month` ENUM('Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember') NULL,
    `user_id` VARCHAR(191) NOT NULL DEFAULT '',

    UNIQUE INDEX `users_bio_user_id_key`(`user_id`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_verification` (
    `uuid` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL DEFAULT '',
    `expiresAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_reset_password` (
    `uuid` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL DEFAULT '',
    `expiresAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `uuid` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `description` TEXT NOT NULL,
    `location` VARCHAR(191) NOT NULL DEFAULT '',
    `start_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `end_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `registration_deadline` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `registration_start` DATETIME(3) NULL,
    `organizer_name` VARCHAR(191) NOT NULL DEFAULT '',
    `quota` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFTED', 'PENDING', 'PUBLISHED', 'REJECTED', 'FINISHED') NOT NULL DEFAULT 'DRAFTED',
    `visibility` ENUM('PUBLIC', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    `event_type` ENUM('EXPO', 'CAREER_FAIR', 'SEMINAR', 'GRADUATION', 'EXHIBITION', 'MARKETPLACE', 'GOVERNMENT', 'CAMPUS_SCHOOL', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `ticket_mode` ENUM('FREE', 'PAID') NOT NULL DEFAULT 'FREE',
    `features` JSON NULL,
    `rejection_reason` VARCHAR(191) NULL,
    `photo` VARCHAR(191) NOT NULL DEFAULT '',
    `souvenir_rules` JSON NULL,
    `approved_by` VARCHAR(191) NULL,
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `events_slug_key`(`slug`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_event_roles` (
    `uuid` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL DEFAULT '',
    `event_id` VARCHAR(191) NOT NULL DEFAULT '',
    `role` ENUM('OWNER', 'COMMITTEE', 'TENANT', 'VISITOR') NOT NULL DEFAULT 'VISITOR',
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `verify_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_contact` (
    `uuid` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL DEFAULT '',
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `phone_number` VARCHAR(191) NOT NULL DEFAULT '',
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_rundown` (
    `uuid` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL DEFAULT '',
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `description` TEXT NOT NULL,
    `start_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `end_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_speakers` (
    `uuid` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL DEFAULT '',
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `bio` TEXT NOT NULL,
    `photo` VARCHAR(191) NOT NULL DEFAULT '',
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_rundown_speaker` (
    `uuid` VARCHAR(191) NOT NULL,
    `rundown_id` VARCHAR(191) NOT NULL DEFAULT '',
    `speaker_id` VARCHAR(191) NOT NULL DEFAULT '',
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_sponsors` (
    `uuid` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL DEFAULT '',
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `logo` VARCHAR(191) NOT NULL DEFAULT '',
    `level` ENUM('PLATINUM', 'GOLD', 'SILVER', 'BRONZE') NOT NULL DEFAULT 'PLATINUM',
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workshops` (
    `uuid` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NULL,
    `event_id` VARCHAR(191) NOT NULL DEFAULT '',
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `description` TEXT NOT NULL,
    `location` VARCHAR(191) NOT NULL DEFAULT '',
    `start_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `end_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `quota` INTEGER NOT NULL DEFAULT 0,
    `is_public` BOOLEAN NOT NULL DEFAULT true,
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `workshops_slug_key`(`slug`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workshop_speaker` (
    `uuid` VARCHAR(191) NOT NULL,
    `workshop_id` VARCHAR(191) NOT NULL DEFAULT '',
    `speaker_id` VARCHAR(191) NOT NULL DEFAULT '',
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workshop_bookings` (
    `uuid` VARCHAR(191) NOT NULL,
    `workshop_id` VARCHAR(191) NOT NULL DEFAULT '',
    `user_id` VARCHAR(191) NOT NULL DEFAULT '',
    `checkin_at` DATETIME(3) NULL,
    `status` ENUM('REGISTERED', 'CHECKED_IN', 'CANCELLED') NOT NULL DEFAULT 'REGISTERED',
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tenant_categories` (
    `uuid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tenants` (
    `uuid` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NULL,
    `event_id` VARCHAR(191) NOT NULL DEFAULT '',
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `description` TEXT NOT NULL,
    `logo` VARCHAR(191) NOT NULL DEFAULT '',
    `website` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `booth_number` VARCHAR(191) NOT NULL DEFAULT '',
    `category_id` VARCHAR(191) NULL,
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tenants_slug_key`(`slug`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tenant_members` (
    `uuid` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NOT NULL DEFAULT '',
    `user_id` VARCHAR(191) NOT NULL DEFAULT '',
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `role` ENUM('OWNER', 'STAFF') NOT NULL DEFAULT 'STAFF',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tenant_events` (
    `uuid` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NOT NULL DEFAULT '',
    `event_id` VARCHAR(191) NOT NULL DEFAULT '',
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tenant_products` (
    `uuid` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NOT NULL DEFAULT '',
    `event_id` VARCHAR(191) NOT NULL DEFAULT '',
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `description` TEXT NOT NULL,
    `price` DOUBLE NOT NULL DEFAULT 0,
    `photo` VARCHAR(191) NOT NULL DEFAULT '',
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tenant_transactions` (
    `uuid` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL DEFAULT '',
    `tenant_id` VARCHAR(191) NOT NULL DEFAULT '',
    `amount` DOUBLE NOT NULL DEFAULT 0,
    `transaction_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `payment_method` VARCHAR(191) NOT NULL DEFAULT '',
    `paid` BOOLEAN NOT NULL DEFAULT false,
    `visitor_id` VARCHAR(191) NULL,
    `proof` VARCHAR(191) NOT NULL DEFAULT '',
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tenant_transaction_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transaction_id` VARCHAR(191) NOT NULL DEFAULT '',
    `product_id` VARCHAR(191) NOT NULL DEFAULT '',
    `quantity` DOUBLE NOT NULL DEFAULT 0,
    `purchase_price` DOUBLE NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `booth_visits` (
    `uuid` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NOT NULL DEFAULT '',
    `event_id` VARCHAR(191) NOT NULL DEFAULT '',
    `user_id` VARCHAR(191) NOT NULL DEFAULT '',
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `log_attendances` (
    `uuid` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL DEFAULT '',
    `user_id` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qr_codes` (
    `uuid` VARCHAR(191) NOT NULL,
    `code_data` VARCHAR(191) NOT NULL DEFAULT '',
    `event_id` VARCHAR(191) NOT NULL DEFAULT '',
    `user_id` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `qr_codes_code_data_key`(`code_data`),
    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `souvenirs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_id` VARCHAR(191) NOT NULL DEFAULT '',
    `user_id` VARCHAR(191) NOT NULL DEFAULT '',
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ticket_types` (
    `uuid` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL DEFAULT '',
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `price` DOUBLE NOT NULL DEFAULT 0,
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tickets` (
    `uuid` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL DEFAULT '',
    `user_id` VARCHAR(191) NOT NULL DEFAULT '',
    `ticket_type_id` VARCHAR(191) NULL DEFAULT '',
    `status` ENUM('RESERVED', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'RESERVED',
    `payment_reference` VARCHAR(191) NOT NULL DEFAULT '',
    `payment_method` VARCHAR(191) NOT NULL DEFAULT '',
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_registration_fields` (
    `uuid` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL DEFAULT '',
    `field_key` VARCHAR(191) NOT NULL DEFAULT '',
    `label` VARCHAR(191) NOT NULL DEFAULT '',
    `type` ENUM('TEXT', 'TEXTAREA', 'NUMBER', 'EMAIL', 'SELECT', 'DATE', 'BOOLEAN') NOT NULL DEFAULT 'TEXT',
    `required` BOOLEAN NOT NULL DEFAULT false,
    `options` JSON NULL,
    `condition` JSON NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registration_answers` (
    `uuid` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL DEFAULT '',
    `user_id` VARCHAR(191) NOT NULL DEFAULT '',
    `field_key` VARCHAR(191) NOT NULL DEFAULT '',
    `value` VARCHAR(191) NOT NULL DEFAULT '',
    `created_by` VARCHAR(191) NOT NULL DEFAULT '',
    `updated_by` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`uuid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users_bio` ADD CONSTRAINT `users_bio_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_verification` ADD CONSTRAINT `email_verification_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_reset_password` ADD CONSTRAINT `email_reset_password_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `users`(`uuid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_event_roles` ADD CONSTRAINT `user_event_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_event_roles` ADD CONSTRAINT `user_event_roles_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_event_roles` ADD CONSTRAINT `user_event_roles_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_event_roles` ADD CONSTRAINT `user_event_roles_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_contact` ADD CONSTRAINT `event_contact_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_contact` ADD CONSTRAINT `event_contact_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_contact` ADD CONSTRAINT `event_contact_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_rundown` ADD CONSTRAINT `event_rundown_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_rundown` ADD CONSTRAINT `event_rundown_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_rundown` ADD CONSTRAINT `event_rundown_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_speakers` ADD CONSTRAINT `event_speakers_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_speakers` ADD CONSTRAINT `event_speakers_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_speakers` ADD CONSTRAINT `event_speakers_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_rundown_speaker` ADD CONSTRAINT `event_rundown_speaker_rundown_id_fkey` FOREIGN KEY (`rundown_id`) REFERENCES `event_rundown`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_rundown_speaker` ADD CONSTRAINT `event_rundown_speaker_speaker_id_fkey` FOREIGN KEY (`speaker_id`) REFERENCES `event_speakers`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_rundown_speaker` ADD CONSTRAINT `event_rundown_speaker_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_rundown_speaker` ADD CONSTRAINT `event_rundown_speaker_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_sponsors` ADD CONSTRAINT `event_sponsors_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_sponsors` ADD CONSTRAINT `event_sponsors_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_sponsors` ADD CONSTRAINT `event_sponsors_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workshops` ADD CONSTRAINT `workshops_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workshops` ADD CONSTRAINT `workshops_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workshops` ADD CONSTRAINT `workshops_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workshop_speaker` ADD CONSTRAINT `workshop_speaker_workshop_id_fkey` FOREIGN KEY (`workshop_id`) REFERENCES `workshops`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workshop_speaker` ADD CONSTRAINT `workshop_speaker_speaker_id_fkey` FOREIGN KEY (`speaker_id`) REFERENCES `event_speakers`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workshop_speaker` ADD CONSTRAINT `workshop_speaker_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workshop_speaker` ADD CONSTRAINT `workshop_speaker_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workshop_bookings` ADD CONSTRAINT `workshop_bookings_workshop_id_fkey` FOREIGN KEY (`workshop_id`) REFERENCES `workshops`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workshop_bookings` ADD CONSTRAINT `workshop_bookings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workshop_bookings` ADD CONSTRAINT `workshop_bookings_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workshop_bookings` ADD CONSTRAINT `workshop_bookings_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_categories` ADD CONSTRAINT `tenant_categories_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_categories` ADD CONSTRAINT `tenant_categories_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenants` ADD CONSTRAINT `tenants_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenants` ADD CONSTRAINT `tenants_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `tenant_categories`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenants` ADD CONSTRAINT `tenants_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenants` ADD CONSTRAINT `tenants_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_members` ADD CONSTRAINT `tenant_members_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_members` ADD CONSTRAINT `tenant_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_members` ADD CONSTRAINT `tenant_members_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_members` ADD CONSTRAINT `tenant_members_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_events` ADD CONSTRAINT `tenant_events_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_events` ADD CONSTRAINT `tenant_events_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_events` ADD CONSTRAINT `tenant_events_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_events` ADD CONSTRAINT `tenant_events_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_products` ADD CONSTRAINT `tenant_products_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_products` ADD CONSTRAINT `tenant_products_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_products` ADD CONSTRAINT `tenant_products_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_products` ADD CONSTRAINT `tenant_products_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_transactions` ADD CONSTRAINT `tenant_transactions_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_transactions` ADD CONSTRAINT `tenant_transactions_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_transactions` ADD CONSTRAINT `tenant_transactions_visitor_id_fkey` FOREIGN KEY (`visitor_id`) REFERENCES `users`(`uuid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_transactions` ADD CONSTRAINT `tenant_transactions_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_transactions` ADD CONSTRAINT `tenant_transactions_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_transaction_details` ADD CONSTRAINT `tenant_transaction_details_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `tenant_transactions`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_transaction_details` ADD CONSTRAINT `tenant_transaction_details_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `tenant_products`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booth_visits` ADD CONSTRAINT `booth_visits_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booth_visits` ADD CONSTRAINT `booth_visits_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booth_visits` ADD CONSTRAINT `booth_visits_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booth_visits` ADD CONSTRAINT `booth_visits_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booth_visits` ADD CONSTRAINT `booth_visits_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `log_attendances` ADD CONSTRAINT `log_attendances_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `log_attendances` ADD CONSTRAINT `log_attendances_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qr_codes` ADD CONSTRAINT `qr_codes_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qr_codes` ADD CONSTRAINT `qr_codes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `souvenirs` ADD CONSTRAINT `souvenirs_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `souvenirs` ADD CONSTRAINT `souvenirs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `souvenirs` ADD CONSTRAINT `souvenirs_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `souvenirs` ADD CONSTRAINT `souvenirs_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_types` ADD CONSTRAINT `ticket_types_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_types` ADD CONSTRAINT `ticket_types_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_types` ADD CONSTRAINT `ticket_types_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_ticket_type_id_fkey` FOREIGN KEY (`ticket_type_id`) REFERENCES `ticket_types`(`uuid`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registration_fields` ADD CONSTRAINT `event_registration_fields_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registration_fields` ADD CONSTRAINT `event_registration_fields_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registration_fields` ADD CONSTRAINT `event_registration_fields_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registration_answers` ADD CONSTRAINT `registration_answers_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registration_answers` ADD CONSTRAINT `registration_answers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`uuid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registration_answers` ADD CONSTRAINT `registration_answers_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registration_answers` ADD CONSTRAINT `registration_answers_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`uuid`) ON DELETE RESTRICT ON UPDATE CASCADE;
