"use client";

import { useState } from "react";
import { Award, Loader2, Printer, X } from "lucide-react";

import { Event } from "@/entities/event/event.entity";
import { useAuthStore } from "@/stores/auth.store";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { getMyCertificates, Certificate } from "@/services/workshop.service";
import { formatDateWithDay } from "@/shared/utils/format";
import BackLink from "@/features/dashboard/shared/BackLink";

export default function CertificatesPage({ event }: { event: Event }) {
  const { user } = useAuthStore();
  const [open, setOpen] = useState<Certificate | null>(null);

  const { data: items, isLoading: loading } = useApiQuery<Certificate[]>(
    keys.certificates.mine,
    () => getMyCertificates(event.uuid),
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <BackLink href={`/dashboard/${event.slug ?? event.uuid}`} />
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-gray-900">Sertifikat</h1>
        <p className="text-sm text-gray-500">
          Sertifikat untuk workshop yang sudah kamu ikuti
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
        </div>
      ) : (items ?? []).length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500">
          Belum ada sertifikat. Sertifikat diterbitkan setelah kamu check-in ke
          sebuah workshop.
        </div>
      ) : (
        <div className="space-y-2">
          {(items ?? []).map((c) => (
            <div
              key={c.uuid}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Award className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{c.workshop.title}</p>
                <p className="text-xs text-gray-500">
                  {c.checkin_at
                    ? `Check-in ${formatDateWithDay(c.checkin_at)}`
                    : "Selesai"}
                </p>
              </div>
              <button
                onClick={() => setOpen(c)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                <Award className="h-3.5 w-3.5" /> Lihat
              </button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6">
            <div id="certificate-print" className="rounded-xl border-4 border-double border-amber-400 p-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
                Sertifikat Partisipasi
              </p>
              <p className="mt-4 text-sm text-gray-500">Diberikan kepada</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{user?.full_name}</p>
              <p className="mt-6 text-sm text-gray-600">
                atas partisipasinya dalam workshop
              </p>
              <p className="mt-1 text-lg font-bold text-brand-600">{open.workshop.title}</p>
              <p className="mt-6 text-sm text-gray-500">{event.name}</p>
              <p className="mt-1 text-xs text-gray-400">
                {open.checkin_at ? formatDateWithDay(open.checkin_at) : ""}
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary/80"
              >
                <Printer className="h-4 w-4" /> Cetak
              </button>
              <button
                onClick={() => setOpen(null)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                <X className="h-4 w-4" /> Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
