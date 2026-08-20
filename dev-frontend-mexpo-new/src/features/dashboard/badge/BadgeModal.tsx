"use client";

import { useState } from "react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { Download, Loader2, Printer } from "lucide-react";

import { Event } from "@/entities/event/event.entity";
import { useAuthStore } from "@/stores/auth.store";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { getMyQr, MyQr } from "@/services/qr.service";
import { dateFormat } from "@/shared/utils/format";
import { Modal } from "@/shared/components/ui/Modal";
import Image from "next/image";
import { labelFor, ROLE_LABELS } from "@/shared/data/labels";

const BRAND = [60, 133, 243] as const; // #3c85f3
const BRAND_600 = [54, 65, 245] as const; // #3641f5

/** Load a remote photo to a base64 PNG via canvas. Returns null on CORS/error. */
function loadPhotoDataUrl(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const img = document.createElement("img");
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    } catch {
      resolve(null);
    }
  });
}

/**
 * ID Badge popup — replaces the old /badge page.
 * Shows a styled badge preview and renders an identical, printable PDF card
 * via jsPDF (Download / Print).
 */
export function BadgeModal({
  event,
  open,
  onClose,
}: {
  event: Event;
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuthStore();
  const { data: qr, isLoading } = useApiQuery<MyQr | null>(
    keys.qr.my(event.uuid),
    () => getMyQr(event.uuid),
    { retry: 0 },
  );
  const [busy, setBusy] = useState(false);

  const role = user?.role === "SUPERADMIN" ? "SUPERADMIN" : "VISITOR";
  const roleLabel = labelFor(ROLE_LABELS, role, role);

  const renderPdf = async (print: boolean) => {
    if (!user) return;
    setBusy(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [85, 135], // ID-badge card
      });
      const W = 85;

      // ── Header ──
      doc.setFillColor(...BRAND);
      doc.rect(0, 0, W, 36, "F");
      doc.setFillColor(...BRAND_600);
      doc.rect(0, 34, W, 2, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("MEXPO", W / 2, 13, { align: "center" });

      doc.setFontSize(10);
      doc.text(doc.splitTextToSize(event.name, W - 16), W / 2, 21, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(dateFormat(event.start_date), W / 2, 29, { align: "center" });

      // ── Avatar (photo circle, falls back to initial) ──
      const cx = W / 2;
      const cy = 51;
      const r = 10.5;
      let photoData: string | null = null;
      if (user.photo) photoData = await loadPhotoDataUrl(user.photo);
      if (photoData) {
        try {
          doc.addImage(photoData, "PNG", cx - r, cy - r, r * 2, r * 2, undefined, "FAST");
        } catch {
          photoData = null;
        }
      }
      if (!photoData) {
        doc.setFillColor(...BRAND);
        doc.circle(cx, cy, r, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(((user.full_name?.trim()[0] ?? "?").toUpperCase()), cx, cy + 5.5, { align: "center" });
      }

      // ── Identity ──
      let y = cy + r + 5;
      doc.setTextColor(24, 24, 27);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      const nameLines = doc.splitTextToSize(user.full_name ?? "-", W - 14);
      doc.text(nameLines, W / 2, y, { align: "center" });
      y += (nameLines.length > 1 ? 5 : 3) + 2;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 105);
      const emailLines = doc.splitTextToSize(user.email ?? "", W - 14);
      doc.text(emailLines, W / 2, y, { align: "center" });
      y += (emailLines.length > 1 ? 4 : 2.5) + 1.5;

      // Role chip
      doc.setFillColor(236, 243, 255); // brand-50
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      const chipW = doc.getTextWidth(roleLabel.toUpperCase()) + 6;
      doc.roundedRect(W / 2 - chipW / 2, y - 3, chipW, 5.5, 2.5, 2.5, "F");
      doc.setTextColor(42, 49, 216); // brand-700
      doc.text(roleLabel.toUpperCase(), W / 2, y + 0.6, { align: "center" });

      // ── QR ──
      if (qr?.image) {
        const qSize = 44;
        const qy = Math.max(y + 8, 82);
        doc.addImage(qr.image, "PNG", (W - qSize) / 2, qy, qSize, qSize, undefined, "FAST");
        doc.setTextColor(120, 120, 125);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.text(doc.splitTextToSize(qr.code_data ?? "", W - 10), W / 2, qy + qSize + 4, { align: "center" });
      }

      if (print) {
        doc.autoPrint();
        window.open(doc.output("bloburl"), "_blank");
      } else {
        doc.save(`id-badge-${(user.full_name ?? "user").toLowerCase().replace(/\s+/g, "-")}.pdf`);
      }
      toast.success(print ? "PDF badge dibuka untuk dicetak." : "PDF badge berhasil diunduh.");
    } catch {
      toast.error("Gagal membuat PDF badge.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="ID Badge" maxWidth="max-w-sm">
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
        </div>
      ) : (
        <>
          {/* Preview — same visual language as the generated PDF */}
          <div id="badge-print" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/90">Mexpo</p>
              <p className="mt-0.5 truncate font-bold text-white">{event.name}</p>
              <p className="text-xs text-white/90">{dateFormat(event.start_date)}</p>
            </div>
            <div className="flex flex-col items-center px-6 py-5">
              {user?.photo ? (
                <Image
                  src={user.photo}
                  alt={user.full_name}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-brand-500"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-2xl font-bold text-brand-600">
                  {(user?.full_name ?? "?")[0]}
                </div>
              )}
              <p className="mt-3 text-lg font-bold text-gray-900">{user?.full_name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              <span className="mt-2 rounded-full bg-brand-50 px-3 py-0.5 text-xs font-semibold uppercase text-brand-600">
                {roleLabel}
              </span>
              {qr?.image && (
                <Image src={qr.image} alt="QR Code" width={144} height={144} unoptimized className="mt-4 h-36 w-36" />
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => void renderPdf(false)}
              disabled={busy}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-white hover:bg-secondary/80 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Unduh PDF
            </button>
            <button
              type="button"
              onClick={() => void renderPdf(true)}
              disabled={busy}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              Cetak
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}