"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Frown, Loader2, Plus, ShieldCheck, Users, Wallet } from "lucide-react";

import { useAuthStore } from "@/stores/auth.store";
import { useList } from "@/shared/hooks/useList";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import SearchBar from "@/shared/components/form/SearchBar";
import HeroBanner from "@/shared/components/ui/HeroBanner";

import { Event, EventStatus, EventType } from "@/entities/event/event.entity";
import { getMyEvents } from "@/services/public.service";
import DashboardCard from "@/shared/components/cards/DashboardCard";
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS, labelFor } from "@/shared/data/labels";

const EVENT_STATUS_FILTERS: Array<EventStatus | "ALL"> = [
  "ALL",
  "DRAFTED",
  "PENDING",
  "PUBLISHED",
  "REJECTED",
  "FINISHED",
];

const EVENT_TYPE_FILTERS: EventType[] = [
  "EXPO",
  "CAREER_FAIR",
  "SEMINAR",
  "GRADUATION",
  "EXHIBITION",
  "MARKETPLACE",
  "GOVERNMENT",
  "CAMPUS_SCHOOL",
  "OTHER",
];

export default function EventList() {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === "SUPERADMIN";

  // Full server-side list: page / quantity / search / status / event_type / sort
  // are all evaluated and paginated by the backend database.
  const list = useList<Event>((q) => getMyEvents(q), [], 10);

  const [sortBy, setSortBy] = useState<"latest" | "name_asc" | "name_desc">("latest");

  const handleSortChange = (val: "latest" | "name_asc" | "name_desc") => {
    setSortBy(val);
    if (val === "name_asc") {
      list.applySort("name", "asc");
    } else if (val === "name_desc") {
      list.applySort("name", "desc");
    } else {
      list.applySort("created_at", "desc");
    }
  };

  // Refresh after a DashboardCard photo update (data mutation → refetch).
  const handlePhotoUpdated = () => list.refetch();

  return (
    <div className="pb-20">
      {/* ── Hero ── */}
      <HeroBanner>
        <h1 className="font-extrabold text-4xl sm:text-5xl md:text-6xl leading-tight">
          Event Saya
        </h1>
        {/* Tombol create untuk semua user yang sudah login */}
        <Link
          href="/dashboard/create"
          className="inline-flex items-center gap-2 bg-white text-secondary font-semibold text-sm px-5 py-2.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-md"
        >
          <Plus className="w-4 h-4" />
          Buat Event
        </Link>

        {/* Link admin hanya untuk SUPERADMIN */}
        {isSuperAdmin && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard/approvals"
              className="inline-flex items-center gap-2 bg-white/95 text-secondary font-semibold text-sm px-5 py-2.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-md"
            >
              <ShieldCheck className="w-4 h-4" />
              Persetujuan
            </Link>
            <Link
              href="/dashboard/users"
              className="inline-flex items-center gap-2 bg-white/95 text-secondary font-semibold text-sm px-5 py-2.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-md"
            >
              <Users className="w-4 h-4" />
              Manajemen Pengguna
            </Link>
            <Link
              href="/dashboard/settlements"
              className="inline-flex items-center gap-2 bg-white/95 text-secondary font-semibold text-sm px-5 py-2.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-md"
            >
              <Wallet className="w-4 h-4" />
              Settlement
            </Link>
          </div>
        )}
      </HeroBanner>

      {/* ── Content ── */}
      <div className="bg-white rounded-2xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900">Dasbor Event</h2>
          <p className="text-sm text-gray-500 mt-1">
            Kelola dan pantau semua event Anda dalam satu tempat
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[200px] flex-1">
              <SearchBar
                search={list.search}
                setSearch={list.applySearch}
                placeholder="Cari event..."
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
            >
              <option value="latest">Terbaru</option>
              <option value="name_asc">Nama A–Z</option>
              <option value="name_desc">Nama Z–A</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Status:</span>
            {EVENT_STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => list.applyFilter("status", s === "ALL" ? "" : s)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  (list.filters.status || "ALL") === s
                    ? "bg-secondary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s === "ALL" ? "Semua" : labelFor(EVENT_STATUS_LABELS, s, s)}
              </button>
            ))}
            <select
              value={list.filters.event_type || "ALL"}
              onChange={(e) =>
                list.applyFilter(
                  "event_type",
                  e.target.value === "ALL" ? "" : e.target.value,
                )
              }
              className="ml-auto h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-600"
            >
              <option value="ALL">Semua Tipe Event</option>
              {EVENT_TYPE_FILTERS.map((t) => (
                <option key={t} value={t}>
                  {labelFor(EVENT_TYPE_LABELS, t, t)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          {list.loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <Loader2 className="w-7 h-7 animate-spin mb-3" />
              <p className="text-sm">Memuat event...</p>
            </div>
          ) : list.items.length > 0 ? (
            <>
              {list.items.map((item) => (
                <DashboardCard
                  key={item.uuid}
                  data={item}
                  onPhotoUpdated={handlePhotoUpdated}
                />
              ))}

              <DataPagination
                currentPage={list.page}
                totalPages={list.totalPages}
                itemsPerPage={list.pageSize}
                totalItems={list.total}
                onPageChange={list.setPage}
                onItemsPerPageChange={list.setPageSize}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <Frown className="w-12 h-12 stroke-[1.5] mb-3 text-gray-300" />
              <p className="font-semibold text-gray-600 text-base">
                Tidak ada event ditemukan
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs text-center">
                {list.search
                  ? `Tidak ada event dengan kata kunci "${list.search}"`
                  : "Mulai buat event baru untuk melihatnya di sini."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}