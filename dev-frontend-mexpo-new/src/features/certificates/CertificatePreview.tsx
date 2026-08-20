"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { Download, Printer } from "lucide-react";
import type { Stage as StageType } from "konva/lib/Stage";

import {
  CertificateData,
  CertificateTemplateEnvelope,
} from "@/entities/event/certificate-template.entity";
import { downloadCertificatePdf } from "./export-certificate";

// Konva is canvas-based and touches `window` — it must never render server-side.
const CertificateCanvas = dynamic(
  () =>
    import("@/features/certificates/CertificateStage").then(
      (m) => m.CertificateStage,
    ),
  { ssr: false },
);

interface CertificatePreviewProps {
  template: CertificateTemplateEnvelope;
  data: CertificateData;
  title: string;
}

/**
 * Read-only certificate preview rendered from an event template with the
 * recipient's data resolved. Offers PDF download + print via jsPDF.
 */
export function CertificatePreview({
  template,
  data,
  title,
}: CertificatePreviewProps) {
  const stageRef = useRef<StageType | null>(null);

  const handleExport = (print: boolean) => {
    const stage = stageRef.current;
    if (!stage) return;
    downloadCertificatePdf(
      stage,
      `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`,
      print,
    );
  };

  return (
    <div>
      <div
        className="w-full overflow-auto rounded-xl border border-gray-200 bg-white p-4"
        style={{ maxHeight: "60vh" }}
      >
        {template ? (
          <CertificateCanvas
            template={template}
            data={data}
            stageRef={stageRef}
          />
        ) : null}
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => handleExport(false)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary/80"
        >
          <Download className="h-4 w-4" /> Unduh PDF
        </button>
        <button
          type="button"
          onClick={() => handleExport(true)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          <Printer className="h-4 w-4" /> Cetak
        </button>
      </div>
    </div>
  );
}