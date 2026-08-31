-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "SpeakerStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable event_speakers
ALTER TABLE "event_speakers" ADD COLUMN IF NOT EXISTS "status" "SpeakerStatus" NOT NULL DEFAULT 'APPROVED';

-- CreateTable contact_message
CREATE TABLE IF NOT EXISTS "contact_message" (
    "uuid" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "subject" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_message_pkey" PRIMARY KEY ("uuid")
);
