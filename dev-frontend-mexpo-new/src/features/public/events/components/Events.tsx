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

type Category = "All Events" | "On Going" | "Upcoming" | "Past";

export default function Events({ events }: { events: Event[] }) {
  const [search, setSearch] = useState("");
  const params = useSearchParams();
  // Initialize from the `?filter=` query param instead of syncing via effect
  // (avoids setState-in-effect; the category buttons update the state).
  const [category, setCategory] = useState<Category>(
    () => (params.get("filter") as Category) || "All Events"
  );
  const [eventType, setEventType] = useState<EventType | "ALL">("ALL");

  // A7 — client-side event-type filter (the API also supports ?event_type=).
  const filteredByType =
    eventType === "ALL"
      ? events
      : events.filter((event) => event.event_type === eventType);

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
            Manage your event exhibition or expo easily with{" "}
            <span className="font-semibold">MEXPO!</span>
          </p>
          <h1 className="font-public-sans font-extrabold text-3xl sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-lg">
            {category}
          </h1>
          <div className="w-full max-w-md">
            <SearchBar search={search} setSearch={setSearch} placeholder="Search Events..." />
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 bg-white/95 backdrop-blur-sm p-1.5 sm:p-2 rounded-2xl w-fit shadow-md text-gray-800">
            <button
              className={`font-jakarta px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors ${category === "All Events"
                ? "bg-secondary text-white"
                : "bg-transparent text-gray-700 hover:bg-gray-100"
                }`}
              onClick={() => setCategory("All Events")}
            >
              All Events
            </button>
            <button
              className={`font-jakarta px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors ${category === "On Going"
                ? "bg-secondary text-white"
                : "bg-transparent text-gray-700 hover:bg-gray-100"
                }`}
              onClick={() => setCategory("On Going")}
            >
              On Going
            </button>
            <button
              className={`font-jakarta px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors ${category === "Upcoming"
                ? "bg-secondary text-white"
                : "bg-transparent text-gray-700 hover:bg-gray-100"
                }`}
              onClick={() => setCategory("Upcoming")}
            >
              Upcoming
            </button>
            <button
              className={`font-jakarta px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors ${category === "Past"
                ? "bg-secondary text-white"
                : "bg-transparent text-gray-700 hover:bg-gray-100"
                }`}
              onClick={() => setCategory("Past")}
            >
              Past
            </button>
          </div>
        </div>
      </motion.div>

      <ContentTitle1
        title='Uncover the world of '
        spanText='Events'
        description='Explore a diverse range of events tailored to your interests. From tech conferences to art exhibitions, find the perfect event to expand your horizons and connect with like-minded individuals.'
      />

      {/* Laris Manis Section */}
      <TrendingEvents events={events} />

      {/* Kategori Event Section */}
      <CategoryFilter eventType={eventType} setEventType={setEventType} />

      {/* List Event Terfilter */}
      <EventsLayout category={category} search={search} events={filteredByType} isLoading={false} />
    </div>
  );
}
