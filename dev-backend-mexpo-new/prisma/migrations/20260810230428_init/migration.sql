-- CreateEnum
CREATE TYPE "departureMonth" AS ENUM ('Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember');

-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('PARTICIPANT', 'SUPERVISOR');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'USER');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFTED', 'PENDING', 'PUBLISHED', 'REJECTED', 'FINISHED');

-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('EXPO', 'CAREER_FAIR', 'SEMINAR', 'GRADUATION', 'EXHIBITION', 'MARKETPLACE', 'GOVERNMENT', 'CAMPUS_SCHOOL', 'OTHER');

-- CreateEnum
CREATE TYPE "TicketMode" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('RESERVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TenantMemberRole" AS ENUM ('OWNER', 'STAFF');

-- CreateEnum
CREATE TYPE "RegistrationFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'EMAIL', 'SELECT', 'DATE', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "USER_EVENT_STATUS" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EventRole" AS ENUM ('OWNER', 'COMMITTEE', 'TENANT', 'VISITOR');

-- CreateEnum
CREATE TYPE "SponsorLevel" AS ENUM ('PLATINUM', 'GOLD', 'SILVER', 'BRONZE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('REGISTERED', 'CHECKED_IN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "uuid" TEXT NOT NULL,
    "full_name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL DEFAULT '',
    "verify_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT NOT NULL DEFAULT '',
    "photo" TEXT NOT NULL DEFAULT '',
    "organization" TEXT NOT NULL DEFAULT '',
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "users_bio" (
    "uuid" TEXT NOT NULL,
    "city" TEXT,
    "role_type" "RoleType",
    "destination_country" TEXT,
    "departure_month" "departureMonth",
    "user_id" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "users_bio_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "email_verification" (
    "uuid" TEXT NOT NULL,
    "user_id" TEXT NOT NULL DEFAULT '',
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_verification_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "email_reset_password" (
    "uuid" TEXT NOT NULL,
    "user_id" TEXT NOT NULL DEFAULT '',
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_reset_password_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "events" (
    "uuid" TEXT NOT NULL,
    "slug" TEXT,
    "name" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registration_deadline" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registration_start" TIMESTAMP(3),
    "organizer_name" TEXT NOT NULL DEFAULT '',
    "quota" INTEGER NOT NULL DEFAULT 0,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFTED',
    "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLIC',
    "event_type" "EventType" NOT NULL DEFAULT 'OTHER',
    "ticket_mode" "TicketMode" NOT NULL DEFAULT 'FREE',
    "features" JSONB,
    "rejection_reason" TEXT,
    "photo" TEXT NOT NULL DEFAULT '',
    "souvenir_rules" JSONB,
    "approved_by" TEXT,
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "user_event_roles" (
    "uuid" TEXT NOT NULL,
    "user_id" TEXT NOT NULL DEFAULT '',
    "event_id" TEXT NOT NULL DEFAULT '',
    "role" "EventRole" NOT NULL DEFAULT 'VISITOR',
    "status" "USER_EVENT_STATUS" NOT NULL DEFAULT 'PENDING',
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "verify_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_event_roles_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "event_contact" (
    "uuid" TEXT NOT NULL,
    "event_id" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "phone_number" TEXT NOT NULL DEFAULT '',
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_contact_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "event_rundown" (
    "uuid" TEXT NOT NULL,
    "event_id" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_rundown_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "event_speakers" (
    "uuid" TEXT NOT NULL,
    "event_id" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL,
    "photo" TEXT NOT NULL DEFAULT '',
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_speakers_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "event_rundown_speaker" (
    "uuid" TEXT NOT NULL,
    "rundown_id" TEXT NOT NULL DEFAULT '',
    "speaker_id" TEXT NOT NULL DEFAULT '',
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_rundown_speaker_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "event_sponsors" (
    "uuid" TEXT NOT NULL,
    "event_id" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL DEFAULT '',
    "logo" TEXT NOT NULL DEFAULT '',
    "level" "SponsorLevel" NOT NULL DEFAULT 'PLATINUM',
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_sponsors_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "workshops" (
    "uuid" TEXT NOT NULL,
    "slug" TEXT,
    "event_id" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quota" INTEGER NOT NULL DEFAULT 0,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshops_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "workshop_speaker" (
    "uuid" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL DEFAULT '',
    "speaker_id" TEXT NOT NULL DEFAULT '',
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_speaker_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "workshop_bookings" (
    "uuid" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL DEFAULT '',
    "user_id" TEXT NOT NULL DEFAULT '',
    "checkin_at" TIMESTAMP(3),
    "status" "BookingStatus" NOT NULL DEFAULT 'REGISTERED',
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_bookings_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "tenant_categories" (
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_categories_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "tenants" (
    "uuid" TEXT NOT NULL,
    "slug" TEXT,
    "event_id" TEXT NOT NULL DEFAULT '',
    "status" "TenantStatus" NOT NULL DEFAULT 'PENDING',
    "name" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "logo" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "booth_number" TEXT NOT NULL DEFAULT '',
    "category_id" TEXT,
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "tenant_members" (
    "uuid" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT '',
    "user_id" TEXT NOT NULL DEFAULT '',
    "created_by" TEXT NOT NULL DEFAULT '',
    "status" "TenantStatus" NOT NULL DEFAULT 'PENDING',
    "role" "TenantMemberRole" NOT NULL DEFAULT 'STAFF',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_members_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "tenant_events" (
    "uuid" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT '',
    "event_id" TEXT NOT NULL DEFAULT '',
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_events_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "tenant_products" (
    "uuid" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT '',
    "event_id" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "photo" TEXT NOT NULL DEFAULT '',
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_products_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "tenant_transactions" (
    "uuid" TEXT NOT NULL,
    "event_id" TEXT NOT NULL DEFAULT '',
    "tenant_id" TEXT NOT NULL DEFAULT '',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_method" TEXT NOT NULL DEFAULT '',
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "visitor_id" TEXT,
    "proof" TEXT NOT NULL DEFAULT '',
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_transactions_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "tenant_transaction_details" (
    "id" SERIAL NOT NULL,
    "transaction_id" TEXT NOT NULL DEFAULT '',
    "product_id" TEXT NOT NULL DEFAULT '',
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "purchase_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_transaction_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booth_visits" (
    "uuid" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL DEFAULT '',
    "event_id" TEXT NOT NULL DEFAULT '',
    "user_id" TEXT NOT NULL DEFAULT '',
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booth_visits_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "log_attendances" (
    "uuid" TEXT NOT NULL,
    "event_id" TEXT NOT NULL DEFAULT '',
    "user_id" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_attendances_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "qr_codes" (
    "uuid" TEXT NOT NULL,
    "code_data" TEXT NOT NULL DEFAULT '',
    "event_id" TEXT NOT NULL DEFAULT '',
    "user_id" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qr_codes_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "souvenirs" (
    "id" SERIAL NOT NULL,
    "event_id" TEXT NOT NULL DEFAULT '',
    "user_id" TEXT NOT NULL DEFAULT '',
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "souvenirs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_types" (
    "uuid" TEXT NOT NULL,
    "event_id" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL DEFAULT '',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "tickets" (
    "uuid" TEXT NOT NULL,
    "event_id" TEXT NOT NULL DEFAULT '',
    "user_id" TEXT NOT NULL DEFAULT '',
    "ticket_type_id" TEXT DEFAULT '',
    "status" "TicketStatus" NOT NULL DEFAULT 'RESERVED',
    "payment_reference" TEXT NOT NULL DEFAULT '',
    "payment_method" TEXT NOT NULL DEFAULT '',
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "event_registration_fields" (
    "uuid" TEXT NOT NULL,
    "event_id" TEXT NOT NULL DEFAULT '',
    "field_key" TEXT NOT NULL DEFAULT '',
    "label" TEXT NOT NULL DEFAULT '',
    "type" "RegistrationFieldType" NOT NULL DEFAULT 'TEXT',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "condition" JSONB,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_registration_fields_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "registration_answers" (
    "uuid" TEXT NOT NULL,
    "event_id" TEXT NOT NULL DEFAULT '',
    "user_id" TEXT NOT NULL DEFAULT '',
    "field_key" TEXT NOT NULL DEFAULT '',
    "value" TEXT NOT NULL DEFAULT '',
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_answers_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_bio_user_id_key" ON "users_bio"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "workshops_slug_key" ON "workshops"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "qr_codes_code_data_key" ON "qr_codes"("code_data");

-- AddForeignKey
ALTER TABLE "users_bio" ADD CONSTRAINT "users_bio_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification" ADD CONSTRAINT "email_verification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_reset_password" ADD CONSTRAINT "email_reset_password_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_event_roles" ADD CONSTRAINT "user_event_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_event_roles" ADD CONSTRAINT "user_event_roles_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_event_roles" ADD CONSTRAINT "user_event_roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_event_roles" ADD CONSTRAINT "user_event_roles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_contact" ADD CONSTRAINT "event_contact_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_contact" ADD CONSTRAINT "event_contact_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_contact" ADD CONSTRAINT "event_contact_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rundown" ADD CONSTRAINT "event_rundown_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rundown" ADD CONSTRAINT "event_rundown_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rundown" ADD CONSTRAINT "event_rundown_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_speakers" ADD CONSTRAINT "event_speakers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_speakers" ADD CONSTRAINT "event_speakers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_speakers" ADD CONSTRAINT "event_speakers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rundown_speaker" ADD CONSTRAINT "event_rundown_speaker_rundown_id_fkey" FOREIGN KEY ("rundown_id") REFERENCES "event_rundown"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rundown_speaker" ADD CONSTRAINT "event_rundown_speaker_speaker_id_fkey" FOREIGN KEY ("speaker_id") REFERENCES "event_speakers"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rundown_speaker" ADD CONSTRAINT "event_rundown_speaker_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rundown_speaker" ADD CONSTRAINT "event_rundown_speaker_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sponsors" ADD CONSTRAINT "event_sponsors_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sponsors" ADD CONSTRAINT "event_sponsors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sponsors" ADD CONSTRAINT "event_sponsors_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshops" ADD CONSTRAINT "workshops_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshops" ADD CONSTRAINT "workshops_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshops" ADD CONSTRAINT "workshops_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_speaker" ADD CONSTRAINT "workshop_speaker_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_speaker" ADD CONSTRAINT "workshop_speaker_speaker_id_fkey" FOREIGN KEY ("speaker_id") REFERENCES "event_speakers"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_speaker" ADD CONSTRAINT "workshop_speaker_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_speaker" ADD CONSTRAINT "workshop_speaker_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_bookings" ADD CONSTRAINT "workshop_bookings_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_bookings" ADD CONSTRAINT "workshop_bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_bookings" ADD CONSTRAINT "workshop_bookings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_bookings" ADD CONSTRAINT "workshop_bookings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_categories" ADD CONSTRAINT "tenant_categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_categories" ADD CONSTRAINT "tenant_categories_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "tenant_categories"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_events" ADD CONSTRAINT "tenant_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_events" ADD CONSTRAINT "tenant_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_events" ADD CONSTRAINT "tenant_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_events" ADD CONSTRAINT "tenant_events_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_products" ADD CONSTRAINT "tenant_products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_products" ADD CONSTRAINT "tenant_products_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_products" ADD CONSTRAINT "tenant_products_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_products" ADD CONSTRAINT "tenant_products_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_transactions" ADD CONSTRAINT "tenant_transactions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_transactions" ADD CONSTRAINT "tenant_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_transactions" ADD CONSTRAINT "tenant_transactions_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "users"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_transactions" ADD CONSTRAINT "tenant_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_transactions" ADD CONSTRAINT "tenant_transactions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_transaction_details" ADD CONSTRAINT "tenant_transaction_details_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "tenant_transactions"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_transaction_details" ADD CONSTRAINT "tenant_transaction_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tenant_products"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booth_visits" ADD CONSTRAINT "booth_visits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booth_visits" ADD CONSTRAINT "booth_visits_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booth_visits" ADD CONSTRAINT "booth_visits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booth_visits" ADD CONSTRAINT "booth_visits_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booth_visits" ADD CONSTRAINT "booth_visits_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_attendances" ADD CONSTRAINT "log_attendances_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_attendances" ADD CONSTRAINT "log_attendances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "souvenirs" ADD CONSTRAINT "souvenirs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "souvenirs" ADD CONSTRAINT "souvenirs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "souvenirs" ADD CONSTRAINT "souvenirs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "souvenirs" ADD CONSTRAINT "souvenirs_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registration_fields" ADD CONSTRAINT "event_registration_fields_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registration_fields" ADD CONSTRAINT "event_registration_fields_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registration_fields" ADD CONSTRAINT "event_registration_fields_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_answers" ADD CONSTRAINT "registration_answers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_answers" ADD CONSTRAINT "registration_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_answers" ADD CONSTRAINT "registration_answers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_answers" ADD CONSTRAINT "registration_answers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
