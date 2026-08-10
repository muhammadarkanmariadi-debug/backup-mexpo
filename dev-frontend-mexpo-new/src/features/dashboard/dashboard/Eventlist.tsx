"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Frown, Loader2, Plus, ShieldCheck, Users } from "lucide-react";

import { useAuthStore } from "@/stores/auth.store";

import { DataPagination } from "@/shared/components/ui/DataPagination";
import SearchBar from "@/shared/components/form/SearchBar";

import { Event, EventStatus, EventType } from "@/entities/event/event.entity";
import { getMyEvents } from "@/services/public.service";
import DashboardCard from "@/shared/components/cards/DashboardCard";

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

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"latest" | "name_asc" | "name_desc">("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchEvents = useCallback(async () => {
    const res = await getMyEvents();
    if (res.data) setEvents(res.data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMyEvents();
        if (!cancelled && res.data) setEvents(res.data);
      } catch (error) {
        console.error("Failed to fetch events", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = events.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || e.status === statusFilter;
    const matchType = typeFilter === "ALL" || e.event_type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "name_asc") return a.name.localeCompare(b.name);
    if (sortBy === "name_desc") return b.name.localeCompare(a.name);
    return (b.created_at ?? "").localeCompare(a.created_at ?? ""); // latest first
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated = sorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="pb-20">
      {/* ── Hero banner ── */}
      <motion.div
        className="relative mb-12 mt-0 lg:mt-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Image
          src="/images/cards/card-e.png"
          alt="Events banner"
          width={1800}
          height={1000}
          loading="eager"
          className="w-full h-100 md:h-80 object-cover rounded-2xl"
        />
     

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-4 text-white text-center">
          <h1 className="font-extrabold text-4xl sm:text-5xl md:text-6xl leading-tight">
            My Events
          </h1>
          {/* Tombol create untuk semua user yang sudah login */}
          <Link
            href="/dashboard/create"
            className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-md"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Link>

          {/* Link admin hanya untuk SUPERADMIN */}
          {isSuperAdmin && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard/approvals"
                className="inline-flex items-center gap-2 bg-white/95 text-blue-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-md"
              >
                <ShieldCheck className="w-4 h-4" />
                Approvals
              </Link>
              <Link
                href="/dashboard/users"
                className="inline-flex items-center gap-2 bg-white/95 text-blue-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-md"
              >
                <Users className="w-4 h-4" />
                User Management
              </Link>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Content ── */}
      <div className="bg-white rounded-2xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900">Event Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track all your events in one place
          </p>
        </div>

        {!loading && events.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[200px] flex-1">
                <SearchBar
                  search={search}
                  setSearch={(val) => {
                    setSearch(val);
                    setCurrentPage(1);
                  }}
                  placeholder="Search events..."
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as typeof sortBy);
                  setCurrentPage(1);
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
                  onClick={() => {
                    setStatusFilter(s);
                    setCurrentPage(1);
                  }}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    statusFilter === s
                      ? "bg-secondary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s === "ALL" ? "Semua" : s}
                </button>
              ))}
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="ml-auto h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-600"
              >
                <option value="ALL">Semua Tipe Event</option>
                {EVENT_TYPE_FILTERS.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <Loader2 className="w-7 h-7 animate-spin mb-3" />
              <p className="text-sm">Loading events...</p>
            </div>
          ) : paginated.length > 0 ? (
            <>
              {paginated.map((item) => (
                <DashboardCard
                  key={item.uuid}
                  data={item}
                  onPhotoUpdated={fetchEvents}
                />
              ))}
              <div className="mt-4">
                <DataPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={filtered.length}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(size) => {
                    setItemsPerPage(size);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <Frown className="w-10 h-10 mb-3" />
              <p className="text-sm">
                {search
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