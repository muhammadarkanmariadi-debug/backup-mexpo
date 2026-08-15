"use client";

import { Event } from "@/entities/event/event.entity";
import HeroBanner from "@/shared/components/ui/HeroBanner";
import Badge, { BadgeTone } from "@/shared/components/ui/Badge";

const STATUS_META: Record<Event["status"], { label: string; tone: BadgeTone }> = {
  DRAFTED: { label: "Draf", tone: "warning" },
  PENDING: { label: "Menunggu Persetujuan", tone: "info" },
  PUBLISHED: { label: "Terbit", tone: "success" },
  REJECTED: { label: "Ditolak", tone: "danger" },
  FINISHED: { label: "Selesai", tone: "neutral" },
};

interface Props {
  event: Event;
  roleLabel: string;
  roleIcon: React.ElementType;
  roleBadge?: string;
}

/** Shared hero banner used by all role views (owner/committee/tenant/visitor). */
export default function EventHero({ event, roleLabel, roleIcon: RoleIcon, roleBadge }: Props) {
  const statusMeta = STATUS_META[event.status] ?? STATUS_META.DRAFTED;

  return (
    <HeroBanner>
      <div>
        <div className="flex justify-center items-center gap-2 mb-1">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-xs ${
              roleBadge ?? "bg-brand-50 text-brand-700"
            }`}
          >
            <RoleIcon className="w-3 h-3" /> {roleLabel}
          </span>
          <Badge tone={statusMeta.tone} dot>
            {statusMeta.label}
          </Badge>
        </div>
        <h1 className="font-extrabold text-4xl sm:text-5xl md:text-6xl leading-tight">{event.name}</h1>
        <p className="bg-white mx-auto mt-4 px-4 py-2 rounded-full w-fit font-semibold text-secondary text-sm">
          oleh {event.organizer_name}
        </p>
      </div>
    </HeroBanner>
  );
}