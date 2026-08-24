"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

import { Event } from "@/entities/event/event.entity";

// Konva is canvas-based — mount the designer client-side only.
const BadgeDesigner = dynamic(
  () =>
    import("@/features/dashboard/badge-designer/BadgeDesigner").then(
      (m) => m.BadgeDesigner,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat desainer badge…
      </div>
    ),
  },
);

export default function BadgeDesignerWrapper({ event }: { event: Event }) {
  return <BadgeDesigner event={event} />;
}
