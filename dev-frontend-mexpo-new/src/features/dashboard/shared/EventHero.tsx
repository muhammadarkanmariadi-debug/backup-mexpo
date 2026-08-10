"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Event } from "@/entities/event/event.entity";

const STATUS_META: Record<Event["status"], { label: string; badge: string; dot: string }> = {
  DRAFTED: { label: "Drafted", badge: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  PENDING: { label: "Pending Approval", badge: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  PUBLISHED: { label: "Published", badge: "bg-green-50 text-green-700", dot: "bg-green-500" },
  REJECTED: { label: "Rejected", badge: "bg-red-50 text-red-700", dot: "bg-red-500" },
  FINISHED: { label: "Finished", badge: "bg-gray-100 text-gray-700", dot: "bg-gray-500" },
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
    <motion.div
      className="relative mt-0 lg:mt-10 mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Image
        src="/images/cards/card-e.png"
        alt="Events banner"
        width={1800}
        height={1000}
        loading="eager"
        className="rounded-2xl w-full h-100 md:h-80 object-cover"
      />

      <div className="absolute inset-0 flex flex-col justify-center items-center gap-5 px-4 text-white text-center">
        <div>
          <div className="flex justify-center items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-xs ${
                roleBadge ?? "bg-purple-50 text-purple-700"
              }`}
            >
              <RoleIcon className="w-3 h-3" /> {roleLabel}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMeta.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
              {statusMeta.label}
            </span>
          </div>
          <h1 className="font-extrabold text-4xl sm:text-5xl md:text-6xl leading-tight">{event.name}</h1>
          <p className="bg-white mx-auto mt-4 px-4 py-2 rounded-full w-fit font-semibold text-secondary text-sm">
            oleh {event.organizer_name}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
