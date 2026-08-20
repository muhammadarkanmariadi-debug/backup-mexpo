"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

import { Event } from "@/entities/event/event.entity";

// Konva is canvas-based — mount the whole designer client-side only.
const CertificateDesigner = dynamic(
  () =>
    import("@/features/dashboard/certificate-designer/CertificateDesigner").then(
      (m) => m.CertificateDesigner,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat desainer…
      </div>
    ),
  },
);

export default function CertificateDesignerWrapper({ event }: { event: Event }) {
  return <CertificateDesigner event={event} />;
}