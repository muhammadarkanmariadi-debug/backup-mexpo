"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";

import EventsLayout from "./content/EventsLayout";
import TrendingEvents from "./content/TrendingEvents";
import CategoryFilter from "./content/CategoryFilter";

import { Event, EventType } from "@/entities/event/event.entity";
import SearchBar from "@/shared/components/form/SearchBar";
import ContentTitle1 from "@/shared/components/ui/ContentTitle1";
import { EVENT_CATEGORY_LABELS, labelFor } from "@/shared/data/labels";

type Category = "All Events" | "On Going" | "Upcoming" | "Past";

const INITIAL_VISIBLE = 12;
const STEP = 12;

export default function Events({ events }: { events: Event[] }) {
  const [search, setSearch] = useState("");
  const params = useSearchParams();
  // Initialize from the `?filter=` query param instead of syncing via effect
  // (avoids setState-in-effect; the category buttons update the state).
  const [category, setCategory] = useState<Category>(
    () => (params.get("filter") as Category) || "All Events"
  );
  const [eventType, setEventType] = useState<EventType | "ALL">("ALL");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  // A7 — client-side event-type filter (the API also supports ?event_type=).
  const filteredByType =
    eventType === "ALL"
      ? events
      : events.filter((event) => event.event_type === eventType);

  const visibleEvents = filteredByType.slice(0, visibleCount);
  const hasMore = visibleCount < filteredByType.length;

  const selectCategory = (next: Category) => {
    setCategory(next);
    setVisibleCount(INITIAL_VISIBLE);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <motion.div
        className="relative flex flex-col items-center justify-center w-full min-h-[320px] md:min-h-[400px] rounded-xl overflow-hidden mt-0 lg:mt-10 py-12 px-4 sm:px-6 md:px-8"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        {/* Image as background using fill */}
        <Image
          src="/images/cards/card-e.png"
          alt="Event 1"
          fill
          priority
       
        />

        {/* Konten diletakkan secara normal (relative), bukan absolute */}
        <div className="relative z-10 flex flex-col gap-4 sm:gap-3 md:gap-4 w-full max-w-7xl items-center text-white text-center">
          <p className="font-jakarta text-xs sm:text-sm md:text-base drop-shadow-md">
            Kelola event pameran atau expo Anda dengan mudah bersama{" "}
            <span className="font-semibold">MEXPO!</span>
          </p>
          <h1 className="font-public-sans font-extrabold text-3xl sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-lg">
            {labelFor(EVENT_CATEGORY_LABELS, category, category)}
          </h1>
          <div className="w-full max-w-md">
            <SearchBar
              search={search}
              setSearch={(v) => {
                setSearch(v);
                setVisibleCount(INITIAL_VISIBLE);
              }}
              placeholder="Cari Event..."
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 bg-white/95 backdrop-blur-sm p-1.5 sm:p-2 rounded-2xl w-fit shadow-md text-gray-800">
            <button
              className={`font-jakarta px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors ${category === "All Events"
                ? "bg-secondary text-white"
                : "bg-transparent text-gray-700 hover:bg-gray-100"
                }`}
              onClick={() => selectCategory("All Events")}
            >
              Semua Event
            </button>
            <button
              className={`font-jakarta px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors ${category === "On Going"
                ? "bg-secondary text-white"
                : "bg-transparent text-gray-700 hover:bg-gray-100"
                }`}
              onClick={() => selectCategory("On Going")}
            >
              Berlangsung
            </button>
            <button
              className={`font-jakarta px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors ${category === "Upcoming"
                ? "bg-secondary text-white"
                : "bg-transparent text-gray-700 hover:bg-gray-100"
                }`}
              onClick={() => selectCategory("Upcoming")}
            >
              Akan Datang
            </button>
            <button
              className={`font-jakarta px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors ${category === "Past"
                ? "bg-secondary text-white"
                : "bg-transparent text-gray-700 hover:bg-gray-100"
                }`}
              onClick={() => selectCategory("Past")}
            >
              Selesai
            </button>
          </div>
        </div>
      </motion.div>

      <ContentTitle1
        title='Jelajahi Dunia '
        spanText='Event'
        description='Temukan beragam event yang sesuai dengan minat Anda. Dari konferensi teknologi hingga pameran seni, temukan event yang tepat untuk memperluas wawasan dan terhubung dengan orang-orang yang sepemikiran.'
      />

      {/* Laris Manis Section */}
      <TrendingEvents events={events} />

      {/* Kategori Event Section */}
      <CategoryFilter
        eventType={eventType}
        setEventType={(t) => {
          setEventType(t);
          setVisibleCount(INITIAL_VISIBLE);
        }}
      />

      {/* List Event Terfilter */}
      <EventsLayout category={category} search={search} events={visibleEvents} isLoading={false} />

      {/* Browse more — reveal the rest of the bounded catalog. */}
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
