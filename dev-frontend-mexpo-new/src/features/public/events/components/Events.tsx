"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpDown, Filter, RotateCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import EventsLayout from "./content/EventsLayout";
import TrendingEvents from "./content/TrendingEvents";
import CategoryFilter from "./content/CategoryFilter";

import { Event, EventType } from "@/entities/event/event.entity";
import SearchBar from "@/shared/components/form/SearchBar";
import ContentTitle1 from "@/shared/components/ui/ContentTitle1";
import {
  EVENT_CATEGORY_LABELS,
  EVENT_TYPE_LABELS,
  labelFor,
} from "@/shared/data/labels";
import { getEvents } from "@/services/public.service";
import { keys } from "@/lib/query-keys";
import { GeometricBannerBg } from "@/shared/components/ui/GeometricBanner";

type Category = "All Events" | "On Going" | "Upcoming" | "Past";
type TicketFilter = "ALL" | "FREE" | "PAID";
type SortOption = "date-asc" | "date-desc" | "name-asc" | "name-desc";

const INITIAL_VISIBLE = 12;
const STEP = 12;

export default function Events({ events: initialEvents }: { events: Event[] }) {
  const params = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<Category>(
    () => (params.get("filter") as Category) || "All Events",
  );
  const [eventType, setEventType] = useState<EventType | "ALL">("ALL");
  const [ticketFilter, setTicketFilter] = useState<TicketFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("date-asc");
  const [page, setPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const isAllEvents = category === "All Events";

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Build server query parameters
  const queryParams = useMemo(() => {
    const p: Record<string, string> = {
      page: isAllEvents ? "1" : String(page),
      quantity: isAllEvents ? String(visibleCount) : "12",
    };
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
    if (!isAllEvents) p.category = category;
    if (eventType !== "ALL") p.event_type = eventType;
    if (ticketFilter !== "ALL") p.ticket_mode = ticketFilter;
    if (sortBy) p.sort_by = sortBy;
    return p;
  }, [
    isAllEvents,
    page,
    visibleCount,
    debouncedSearch,
    category,
    eventType,
    ticketFilter,
    sortBy,
  ]);

  // Fetch server data via TanStack Query
  const { data: response, isLoading } = useQuery({
    queryKey: keys.events.list(queryParams),
    queryFn: () => getEvents(queryParams),
    placeholderData: (previousData) => previousData,
    initialData:
      isAllEvents && !debouncedSearch && eventType === "ALL" && ticketFilter === "ALL" && sortBy === "date-asc" && page === 1 && visibleCount === INITIAL_VISIBLE
        ? {
            data: initialEvents,
            meta: {
              counts: initialEvents.length,
              count: initialEvents.length,
              page: 1,
              quantity: 12,
              totalPages: 1,
            },
            status: true,
            code: 200,
            message: "OK",
          }
        : undefined,
  });

  const displayedEvents = response?.data ?? initialEvents;
  const meta = response?.meta;
  const totalCount = meta?.counts ?? displayedEvents.length;
  const totalPages = meta?.totalPages ?? Math.ceil(totalCount / 12);
  const hasMore = isAllEvents && visibleCount < totalCount;

  const selectCategory = (next: Category) => {
    setCategory(next);
    setPage(1);
    setVisibleCount(INITIAL_VISIBLE);
  };

  const hasActiveFilters =
    eventType !== "ALL" ||
    ticketFilter !== "ALL" ||
    sortBy !== "date-asc" ||
    search.trim() !== "";

  const handleResetFilters = () => {
    setEventType("ALL");
    setTicketFilter("ALL");
    setSortBy("date-asc");
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
    setVisibleCount(INITIAL_VISIBLE);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="relative mt-0 flex min-h-[320px] w-full flex-col items-center justify-center overflow-hidden sm:rounded-xl px-4 py-12 sm:px-6 md:min-h-[400px] md:px-8 lg:mt-10">
        <GeometricBannerBg />

        <div className="relative z-10 flex w-full max-w-7xl flex-col items-center gap-4 text-center text-white sm:gap-3 md:gap-4">
          <p className="font-jakarta text-xs drop-shadow-md sm:text-sm md:text-base">
            Kelola event pameran atau expo Anda dengan mudah bersama{" "}
            <span className="font-semibold">MEXPO!</span>
          </p>
          <h1 className="font-public-sans text-3xl font-extrabold drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl">
            {labelFor(EVENT_CATEGORY_LABELS, category, category)}
          </h1>
          <div className="w-full max-w-md">
            <SearchBar
              search={search}
              setSearch={(v) => {
                setSearch(v);
              }}
              placeholder="Cari Event..."
            />
          </div>
          <div className="flex w-fit flex-wrap justify-center gap-2 rounded-2xl bg-white/95 dark:bg-gray-900/95 p-1.5 text-gray-800 dark:text-gray-100 shadow-md backdrop-blur-sm sm:gap-3 sm:p-2 md:gap-4">
            <button
              className={`font-jakarta whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm ${
                category === "All Events"
                  ? "bg-secondary dark:bg-secondary text-white shadow-sm"
                  : "bg-transparent text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              onClick={() => selectCategory("All Events")}
            >
              Semua Event
            </button>
            <button
              className={`font-jakarta whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm ${
                category === "On Going"
                  ? "bg-secondary dark:bg-secondary text-white shadow-sm"
                  : "bg-transparent text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              onClick={() => selectCategory("On Going")}
            >
              Berlangsung
            </button>
            <button
              className={`font-jakarta whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm ${
                category === "Upcoming"
                  ? "bg-secondary dark:bg-secondary text-white shadow-sm"
                  : "bg-transparent text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              onClick={() => selectCategory("Upcoming")}
            >
              Akan Datang
            </button>
            <button
              className={`font-jakarta whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm ${
                category === "Past"
                  ? "bg-secondary dark:bg-secondary text-white shadow-sm"
                  : "bg-transparent text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              onClick={() => selectCategory("Past")}
            >
              Selesai
            </button>
          </div>
        </div>
      </div>

      {/* When on "All Events": show title, trending events, and category filter */}
      {isAllEvents && (
        <>
          <ContentTitle1
            title="Jelajahi Dunia "
            spanText="Event"
            description="Temukan beragam event yang sesuai dengan minat Anda. Dari konferensi teknologi hingga pameran seni, temukan event yang tepat untuk memperluas wawasan dan terhubung dengan orang-orang yang sepemikiran."
          />

          {/* Laris Manis Section */}
          <TrendingEvents events={initialEvents} />

          {/* Kategori Event Section */}
          <CategoryFilter
            eventType={eventType}
            setEventType={(t) => {
              setEventType(t);
              setPage(1);
            }}
          />
        </>
      )}

      {/* When on "Berlangsung", "Akan Datang", or "Selesai": show tab filter & sort toolbar */}
      {!isAllEvents && (
        <div className="mt-8 mb-6 px-4 sm:px-6 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Tipe Event Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500">Tipe:</span>
                <select
                  value={eventType}
                  onChange={(e) => {
                    setEventType(e.target.value as EventType | "ALL");
                    setPage(1);
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:border-brand-500 focus:outline-none"
                >
                  <option value="ALL">Semua Tipe</option>
                  {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ticket Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-500">Tiket:</span>
                <select
                  value={ticketFilter}
                  onChange={(e) => {
                    setTicketFilter(e.target.value as TicketFilter);
                    setPage(1);
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:border-brand-500 focus:outline-none"
                >
                  <option value="ALL">Semua Tiket</option>
                  <option value="FREE">Gratis (Free)</option>
                  <option value="PAID">Berbayar (Paid)</option>
                </select>
              </div>

              {/* Reset button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  title="Reset Filter"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              )}
            </div>

            {/* Sort Dropdown & Count */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                Menampilkan <strong>{totalCount}</strong> event
              </span>
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500">Urutkan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as SortOption);
                    setPage(1);
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:border-brand-500 focus:outline-none"
                >
                  <option value="date-asc">Tanggal Terdekat</option>
                  <option value="date-desc">Tanggal Terbaru</option>
                  <option value="name-asc">Nama (A - Z)</option>
                  <option value="name-desc">Nama (Z - A)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List Event Terfilter */}
      <EventsLayout
        category={category}
        search={debouncedSearch}
        events={displayedEvents}
        isLoading={isLoading}
        serverPagination={
          !isAllEvents
            ? {
                currentPage: page,
                totalPages,
                totalItems: totalCount,
                itemsPerPage: 12,
                onPageChange: (newPage) => setPage(newPage),
              }
            : undefined
        }
      />

      {/* Browse more — reveal the rest of the bounded catalog (All Events tab). */}
      {hasMore && (
        <div className="mt-8 flex justify-center pb-10">
          <button
            onClick={() => setVisibleCount((c) => c + STEP)}
            className="rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
          >
            Muat Lebih Banyak
          </button>
        </div>
      )}
    </div>
  );
}
