"use client";

import { CalendarDays, Eye, EyeOff, MapPin, Tag, Users, BookOpen } from "lucide-react";
import { Event } from "@/entities/event/event.entity";
import { dateFormat, formatDateRange } from "@/shared/utils/format";
import {
  EVENT_TYPE_LABELS,
  labelFor,
  EVENT_VISIBILITY_LABELS,
} from "@/shared/data/labels";
import ViewStats from "@/features/dashboard/shared/ViewStats";
import ViewDetails from "@/features/dashboard/shared/ViewDetails";
import DescriptionCard from "@/features/dashboard/shared/DescriptionCard";

interface EventOverviewProps {
  event: Event;
  /** Owner/Committee show stat cards + full detail rows; Tenant/Visitor omit stats. */
  showStats?: boolean;
  /** Label for the registration-deadline row (defaults to "Registrasi ditutup"). */
  deadlineLabel?: string;
}

/**
 * Shared Overview tab content for every role view.
 * - showStats → ViewStats + 6 detail rows (Owner/Committee)
 * - !showStats → 4 detail rows, no stats (Tenant/Visitor)
 * Always ends with the DescriptionCard so the visual structure stays identical.
 */
export default function EventOverview({
  event,
  showStats = false,
  deadlineLabel = "Registrasi ditutup",
}: EventOverviewProps) {
  return (
    <div className="space-y-6 mt-4">
      {showStats && (
        <ViewStats
          items={[
            { label: "Registrasi", value: event.count_user_registration ?? 0, icon: Users },
            { label: "Tenant", value: event.count_tenants ?? 0, icon: Users },
            { label: "Workshop", value: event.count_workshops ?? 0, icon: BookOpen },
          ]}
        />
      )}

      <ViewDetails
        items={[
          { icon: MapPin, label: "Lokasi", value: event.location },
          { icon: CalendarDays, label: "Tanggal event", value: formatDateRange(event.start_date, event.end_date) },
          ...(showStats
            ? [
                {
                  icon: CalendarDays,
                  label: "Registrasi",
                  value: `${dateFormat(event.registration_start)} – ${dateFormat(event.registration_deadline)}`,
                },
              ]
            : [
                {
                  icon: CalendarDays,
                  label: deadlineLabel,
                  value: dateFormat(event.registration_deadline),
                },
              ]),
          { icon: Users, label: "Kuota", value: event.quota > 0 ? `${event.quota} peserta` : "Tidak terbatas" },
          ...(showStats
            ? [
                { icon: Tag, label: "Jenis", value: labelFor(EVENT_TYPE_LABELS, event.event_type, event.event_type) },
                {
                  icon: event.visibility === "PRIVATE" ? EyeOff : Eye,
                  label: "Visibilitas",
                  value: labelFor(EVENT_VISIBILITY_LABELS, event.visibility, event.visibility),
                },
              ]
            : []),
        ]}
      />

      <DescriptionCard text={event.description} />
    </div>
  );
}