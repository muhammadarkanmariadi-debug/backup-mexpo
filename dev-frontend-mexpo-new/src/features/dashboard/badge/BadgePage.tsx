"use client";

import { Loader2, Printer } from "lucide-react";

import { Event } from "@/entities/event/event.entity";
import { useAuthStore } from "@/stores/auth.store";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { getMyQr, MyQr } from "@/services/qr.service";
import { dateFormat } from "@/shared/utils/format";
import PageHeader from "@/shared/components/ui/PageHeader";
import PageShell from "@/shared/components/ui/PageShell";
import { labelFor, ROLE_LABELS } from "@/shared/data/labels";

export default function BadgePage({ event }: { event: Event }) {
  const { user } = useAuthStore();
  const { data: qr, isLoading: loading } = useApiQuery<MyQr | null>(
    keys.qr.my(event.uuid),
    () => getMyQr(event.uuid),
    { retry: 0 },
  );

  const role = user?.role === "SUPERADMIN" ? "SUPERADMIN" : "VISITOR";

  return (
    <PageShell className="py-8">
      <PageHeader title="ID Badge" subtitle={event.name} align="center" />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
        </div>
      ) : (
        <div id="badge-print" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* header */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Mexpo</p>
            <p className="mt-1 truncate font-bold text-white">{event.name}</p>
            <p className="text-xs text-white/80">{dateFormat(event.start_date)}</p>
          </div>
          {/* body */}
          <div className="flex flex-col items-center px-6 py-6">
            {user?.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photo}
                alt={user.full_name}
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
              {labelFor(ROLE_LABELS, role, role)}
            </span>
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr.image} alt="QR Code" className="mt-4 h-36 w-36" />
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => window.print()}
        className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-secondary px-5 py-3 text-sm font-semibold text-white hover:bg-secondary/80"
      >
        <Printer className="h-4 w-4" /> Cetak Badge
      </button>
    </PageShell>
  );
}
