"use client";

import { CalendarCheck, Loader2 } from "lucide-react";

import { DataPagination } from "@/shared/components/ui/DataPagination";
import { Event } from "@/entities/event/event.entity";
import { getEventAttendance, AttendanceLog } from "@/services/attendance.service";
import { useList } from "@/shared/hooks/useList";
import SortMenu from "@/shared/components/ui/SortMenu";
import PageHeader from "@/shared/components/ui/PageHeader";
import Badge from "@/shared/components/ui/Badge";
import PageShell from "@/shared/components/ui/PageShell";

function toInputValue(d?: string): string {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function AttendancePage({ event }: { event: Event }) {
  const list = useList<AttendanceLog>(
    (q) => getEventAttendance(event.uuid, q),
    [event.uuid],
  );

  const dateInputClass =
    "h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white text-gray-800";

  return (
    <PageShell className="py-8">
      <PageHeader
        title="Kehadiran"
        subtitle={event.name}
        icon={{ node: <CalendarCheck className="h-5 w-5" />, className: "bg-brand-50 text-secondary" }}
      />

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-gray-100 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Dari</label>
          <input
            type="date"
            value={toInputValue(list.filters.start_date)}
            onChange={(e) => list.applyFilter("start_date", e.target.value ? new Date(e.target.value).toISOString() : "")}
            className={dateInputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Sampai</label>
          <input
            type="date"
            value={toInputValue(list.filters.end_date)}
            onChange={(e) => list.applyFilter("end_date", e.target.value ? new Date(e.target.value).toISOString() : "")}
            className={dateInputClass}
          />
        </div>
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-500">Cari nama</label>
          <input
            type="text"
            value={list.search}
            onChange={(e) => list.applySearch(e.target.value)}
            placeholder="Nama pengunjung"
            className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
          />
        </div>
        <div className="flex items-end">
          <SortMenu
            options={[
              { key: "created_at", label: "Waktu" },
              { key: "full_name", label: "Nama" },
            ]}
            sortBy={list.sortBy}
            sortDir={list.sortDir}
            onChange={list.applySort}
          />
        </div>
      </div>

      {list.loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <span className="text-sm font-semibold text-gray-900">Daftar Kehadiran</span>
            <Badge tone="info">{list.total} org</Badge>
          </div>
          {list.items.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-500">
              Belum ada data kehadiran.
            </p>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400">
                    <th className="px-5 py-2">Nama</th>
                    <th className="px-5 py-2">Waktu Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {list.items.map((r) => (
                    <tr key={r.uuid}>
                      <td className="px-5 py-2.5 font-medium text-gray-800">{r.user?.full_name}</td>
                      <td className="px-5 py-2.5 text-gray-500">
                        {new Date(r.created_at).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-3">
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
      )}
    </PageShell>
  );
}