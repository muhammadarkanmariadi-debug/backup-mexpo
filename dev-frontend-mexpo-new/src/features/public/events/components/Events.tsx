"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Filter, RotateCcw } from "lucide-react";
import { useQueries, useQuery } from "@tanstack/react-query";

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
import {
  EVENT_SECTION_KEYS,
  eventSectionParams,
  type EventSectionFilters,
  type EventSections,
  type EventSectionTotals,
} from "../utils/eventSections";

type Category = "All Events" | "On Going" | "Upcoming" | "Past";
type TicketFilter = "ALL" | "FREE" | "PAID";
type SortOption = "date-asc" | "date-desc" | "name-asc" | "name-desc";

type EventsResponse = Awaited<ReturnType<typeof getEvents>>;

const asEventsResponse = (events: Event[], total: number): EventsResponse => ({
  data: events,
  meta: {
    counts: total,
    count: total,
    page: 1,
    quantity: events.length,
    totalPages: 1,
  },
  status: true,
  code: 200,
  message: "OK",
});

export default function Events({
  events: initialEvents,
  initialSections,
  initialSectionTotals,
  initialCategory = "All Events",
}: {
  events: Event[];
  initialSections: EventSections;
  initialSectionTotals: EventSectionTotals;
  initialCategory?: Category;
}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<Category>(initialCategory);
  const [eventType, setEventType] = useState<EventType | "ALL">("ALL");
  const [ticketFilter, setTicketFilter] = useState<TicketFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("date-asc");
  const [page, setPage] = useState(1);

  const isAllEvents = category === "All Events";

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Filters shared by the overview sections and the single-category grid.
  const sectionFilters = useMemo(() => {
    const f: EventSectionFilters = {};
    if (debouncedSearch.trim()) f.search = debouncedSearch.trim();
    if (eventType !== "ALL") f.event_type = eventType;
    if (ticketFilter !== "ALL") f.ticket_mode = ticketFilter;
    return f;
  }, [debouncedSearch, eventType, ticketFilter]);
  const hasSectionFilters = Object.keys(sectionFilters).length > 0;

  // "Semua Event": one query per section (akan datang / berlangsung / selesai),
  // seeded from the server render while no filter is active.
  const sectionQueries = useQueries({
    queries: EVENT_SECTION_KEYS.map((section) => {
      const params = eventSectionParams(section, sectionFilters);
      return {
        queryKey: keys.events.list(params),
        queryFn: () => getEvents(params),
        enabled: isAllEvents,
        placeholderData: (previousData: EventsResponse | undefined) => previousData,
        initialData: hasSectionFilters
          ? undefined
          : asEventsResponse(initialSections[section], initialSectionTotals[section]),
      };
    }),
  });

  const sections = {} as EventSections;
  const sectionTotals = {} as EventSectionTotals;
  EVENT_SECTION_KEYS.forEach((section, i) => {
    sections[section] = sectionQueries[i].data?.data ?? [];
    sectionTotals[section] = sectionQueries[i].data?.meta.counts ?? 0;
  });
  const sectionsLoading = sectionQueries.some((q) => q.isLoading);

  // Single-category tab ("Berlangsung" / "Akan Datang" / "Selesai"): paginated grid.
  const queryParams = useMemo(() => {
    const p: Record<string, string> = {
      page: String(page),
      quantity: "12",
      category,
    };
    if (sectionFilters.search) p.search = sectionFilters.search;
    if (sectionFilters.event_type) p.event_type = sectionFilters.event_type;
    if (sectionFilters.ticket_mode) p.ticket_mode = sectionFilters.ticket_mode;
    if (sortBy) p.sort_by = sortBy;
    return p;
  }, [page, category, sectionFilters, sortBy]);

  const { data: response, isLoading: listLoading } = useQuery({
    queryKey: keys.events.list(queryParams),
    queryFn: () => getEvents(queryParams),
    enabled: !isAllEvents,
    placeholderData: (previousData) => previousData,
  });

  const displayedEvents = response?.data ?? [];
  const meta = response?.meta;
  const totalCount = meta?.counts ?? displayedEvents.length;
  const totalPages = meta?.totalPages ?? Math.ceil(totalCount / 12);

  const selectCategory = (next: Category) => {
    setCategory(next);
    setPage(1);
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
        events={displayedEvents}
        sections={sections}
        sectionTotals={sectionTotals}
        onSeeAll={(section) => {
          selectCategory(section);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        isLoading={isAllEvents ? sectionsLoading : listLoading}
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

    </div>
  );
}
