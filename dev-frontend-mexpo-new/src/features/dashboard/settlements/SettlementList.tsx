"use client";

import { Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

import SearchBar from "@/shared/components/form/SearchBar";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { useAuthStore } from "@/stores/auth.store";
import { Event } from "@/entities/event/event.entity";
import { formatDateRange } from "@/shared/utils/format";
import { getAllEvents } from "@/services/event.service";
import { useList } from "@/shared/hooks/useList";
import PageHeader from "@/shared/components/ui/PageHeader";
import PageShell from "@/shared/components/ui/PageShell";

export default function SettlementList() {
  const { user } = useAuthStore();

  const isSuperAdmin = user?.role === "SUPERADMIN";
  const list = useList<Event>((q) => getAllEvents(q), [isSuperAdmin]);

  // Only show events that are FINISHED or PUBLISHED and likely to have a settlement
  // We can filter this client-side or we can just show all of them.
  // Actually, we'll just show all of them, the superadmin can search.
  
  if (!isSuperAdmin) {
    return (
      <PageShell className="py-12 text-center">
        <p className="text-gray-500">
          Halaman ini khusus Super Admin. Anda tidak memiliki akses.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell className="py-10">
      <PageHeader title="Daftar Settlement" subtitle="Pilih event untuk mengelola settlement pembayaran." />

      <div className="mb-4 rounded-xl border border-gray-100 bg-white p-4">
        <SearchBar search={list.search} setSearch={list.applySearch} placeholder="Cari event..." />
      </div>

      {list.loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-secondary animate-spin" />
        </div>
      ) : list.items.length === 0 ? (
        <div className="bg-white p-10 border border-gray-100 rounded-xl text-gray-500 text-sm text-center">
          Tidak ada event ditemukan.
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
                        event.status === "FINISHED"
                          ? "bg-green-50 text-green-700"
                          : event.status === "PUBLISHED"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-gray-50 text-gray-700"
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs">
                    oleh {event.organizer_name} ·{" "}
                    {formatDateRange(event.start_date, event.end_date)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/dashboard/${event.uuid}/settlement`}
                    className="inline-flex items-center gap-1.5 bg-secondary hover:bg-secondary/90 px-3 py-1.5 rounded-lg font-semibold text-white text-xs transition-colors"
                  >
                    Buka Settlement <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
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
    </PageShell>
  );
}
