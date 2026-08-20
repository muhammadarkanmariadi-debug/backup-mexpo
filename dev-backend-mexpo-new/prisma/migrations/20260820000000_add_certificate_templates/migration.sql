-- CreateTable
CREATE TABLE "certificate_templates" (
    "uuid" TEXT NOT NULL,
    "event_id" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'WORKSHOP',
    "template" JSONB,
    "background" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL DEFAULT '',
    "updated_by" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_templates_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "certificate_templates_event_id_idx" ON "certificate_templates"("event_id");

-- AddForeignKey
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;