"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import SearchBar from "@/shared/components/form/SearchBar";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { useAuthStore } from "@/stores/auth.store";
import { Event } from "@/entities/event/event.entity";
import { formatDateRange } from "@/shared/utils/format";
import { getApprovalQueue, approveEvent } from "@/services/event.service";
import BackLink from "@/features/dashboard/shared/BackLink";
import { useList } from "@/features/dashboard/shared/useList";

export default function ApprovalQueue() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [busyId, setBusyId] = useState<string | null>(null);

  const isSuperAdmin = user?.role === "SUPERADMIN";
  const list = useList<Event>((q) => getApprovalQueue(q), [isSuperAdmin]);

  const handleApprove = async (event: Event) => {
    setBusyId(event.uuid);
    try {
      const res = await approveEvent(event.uuid, { approved: true });
      if (!res.status) throw new Error();
      toast.success(`"${event.name}" disetujui dan dipublikasikan.`);
      list.refetch();
      router.refresh();
    } catch {
      toast.error("Gagal menyetujui event.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (event: Event) => {
    const reason =
      prompt(`Alasan penolakan untuk "${event.name}"?`)?.trim() ||
      "Tidak ada alasan";
    setBusyId(event.uuid);
    try {
      const res = await approveEvent(event.uuid, {
        approved: false,
        rejection_reason: reason,
      });
      if (!res.status) throw new Error();
      toast.success(`"${event.name}" ditolak.`);
      list.refetch();
      router.refresh();
    } catch {
      toast.error("Gagal menolak event.");
    } finally {
      setBusyId(null);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="mx-auto px-4 py-12 max-w-7xl text-center">
        <p className="text-gray-500">
          Halaman ini khusus Super Admin. Anda tidak memiliki akses.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 py-10 max-w-7xl">
      <BackLink href="/dashboard" />
      <h1 className="mb-1 font-bold text-gray-900 text-2xl">Persetujuan Publikasi</h1>
      <p className="mb-8 text-gray-500 text-sm">
        Tinjau event yang menunggu approval dari owner.
      </p>

      <div className="mb-4 rounded-xl border border-gray-100 bg-white p-4">
        <SearchBar search={list.search} setSearch={list.applySearch} placeholder="Cari event..." />
      </div>

      {list.loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-secondary animate-spin" />
        </div>
      ) : list.items.length === 0 ? (
        <div className="bg-white p-10 border border-gray-100 rounded-xl text-gray-500 text-sm text-center">
          Tidak ada event yang menunggu persetujuan.
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {list.items.map((event) => (
              <div
                key={event.uuid}
                className="flex sm:flex-row flex-col sm:items-center gap-4 bg-white p-4 border border-gray-100 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{event.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        event.status === "PENDING"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {event.status === "PENDING" ? "Pending" : "Rejected"}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs">
                    oleh {event.organizer_name} ·{" "}
                    {formatDateRange(event.start_date, event.end_date)}
                  </p>
                  {event.status === "REJECTED" && event.rejection_reason && (
                    <p className="mt-1 text-red-600 text-xs">
                      Alasan: {event.rejection_reason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {event.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleApprove(event)}
                        disabled={busyId === event.uuid}
                        className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 px-3 py-1.5 rounded-lg font-semibold text-white text-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(event)}
                        disabled={busyId === event.uuid}
                        className="inline-flex items-center gap-1.5 bg-white hover:bg-red-50 disabled:opacity-50 px-3 py-1.5 border border-red-200 rounded-lg font-semibold text-red-600 text-xs transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <DataPagination
              currentPage={list.page}
              totalPages={list.totalPages}
              itemsPerPage={list.pageSize}
              totalItems={list.total}
              onPageChange={list.setPage}
              onItemsPerPageChange={(size) => { list.setPageSize(size); list.setPage(1); }}
            />
          </div>
        </>
      )}
    </div>
  );
}