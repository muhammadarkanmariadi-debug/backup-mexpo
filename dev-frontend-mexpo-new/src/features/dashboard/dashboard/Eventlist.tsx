"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Frown, Loader2, Plus, ShieldCheck, Users } from "lucide-react";

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

  // Server-backed list: page / quantity / search go to the backend
  // (GET /events/me supports page, quantity, search). Status, type and sort
  // are NOT backend query params, so they stay as client-side refinements.
  const list = useList<Event>((q) => getMyEvents(q), []);

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"latest" | "name_asc" | "name_desc">("latest");

  const visible = useMemo(() => {
    const filtered = (list.items ?? []).filter((e) => {
      const matchStatus = statusFilter === "ALL" || e.status === statusFilter;
      const matchType = typeFilter === "ALL" || e.event_type === typeFilter;
      return matchStatus && matchType;
    });
    if (sortBy === "name_asc") return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "name_desc") return [...filtered].sort((a, b) => b.name.localeCompare(a.name));
    return [...filtered].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")); // latest first
  }, [list.items, statusFilter, typeFilter, sortBy]);

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

        {!list.loading && (list.items ?? []).length > 0 && (
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
                onChange={(e) => {
                  setSortBy(e.target.value as typeof sortBy);
                }}
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
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    statusFilter === s
                      ? "bg-secondary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s === "ALL" ? "Semua" : labelFor(EVENT_STATUS_LABELS, s, s)}
                </button>
              ))}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
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
        )}

        <div className="mt-6 flex flex-col gap-2">
          {list.loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <Loader2 className="w-7 h-7 animate-spin mb-3" />
              <p className="text-sm">Memuat event...</p>
            </div>
          ) : visible.length > 0 ? (
            <>
              {visible.map((item) => (
                <DashboardCard
                  key={item.uuid}
                  data={item}
                  onPhotoUpdated={handlePhotoUpdated}
                />
              ))}
              <div className="mt-4">
                <DataPagination
                  currentPage={list.page}
                  totalPages={list.totalPages}
                  itemsPerPage={list.pageSize}
                  totalItems={list.total}
                  onPageChange={list.setPage}
                  onItemsPerPageChange={(size) => {
                    list.setPageSize(size);
                    list.setPage(1);
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <Frown className="w-10 h-10 mb-3" />
              <p className="text-sm">
                {list.search || statusFilter !== "ALL" || typeFilter !== "ALL"
                  ? "Tidak ada event yang cocok dengan pencarianmu."
                  : "Belum ada event."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}