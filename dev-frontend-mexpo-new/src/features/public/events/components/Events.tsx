"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";

import EventsLayout from "./content/EventsLayout";
import { Event, EventType } from "@/entities/event/event.entity";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/shared/components/form/SearchBar";

const EVENT_TYPES: { value: EventType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Types" },
  { value: "EXPO", label: "Expo" },
  { value: "CAREER_FAIR", label: "Career Fair" },
  { value: "SEMINAR", label: "Seminar" },
  { value: "GRADUATION", label: "Graduation" },
  { value: "EXHIBITION", label: "Exhibition" },
  { value: "MARKETPLACE", label: "Marketplace" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "CAMPUS_SCHOOL", label: "Campus/School" },
  { value: "OTHER", label: "Other" },
];

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
        className="relative flex flex-col mt-0 lg:mt-10"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Image
          src="/images/cards/card-e.png"
          alt="Event 1"
          width={1800}
          height={1000}
          loading="eager"
          className="rounded-lg w-full h-80 md:h-96 object-cover"
        />
        <div className="top-1/2 left-1/2 absolute flex flex-col gap-4 sm:gap-3 md:gap-4 px-4 sm:px-6 md:px-8 w-full max-w-7xl text-white text-center -translate-x-1/2 -translate-y-2/3 transform">
          <p className="font-jakarta text-xs sm:text-sm md:text-base">
            Manage your event exhibition or expo easily with{" "}
            <span className="font-semibold">MEXPO!</span>
          </p>
          <h1 className="font-public-sans font-extrabold text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
            {category}
          </h1>
          <div className="mx-auto w-full max-w-md">
            <SearchBar search={search} setSearch={setSearch} placeholder="Search Events..." />
          </div>
          <div className="flex flex-wrap sm:justify-center gap-2 sm:gap-3 md:gap-4 bg-white mx-auto p-1.5 sm:p-2 rounded-2xl w-fit">
            <button
              className={`font-jakarta px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap ${category === "All Events"
                ? "bg-secondary text-white"
                : "bg-gray-200 text-gray-700"
                }`}
              onClick={() => setCategory("All Events")}
            >
              All Events
            </button>
            <button
              className={`font-jakarta px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap ${category === "On Going"
                ? "bg-secondary text-white"
                : "bg-gray-200 text-gray-700"
                }`}
              onClick={() => setCategory("On Going")}
            >
              On Going
            </button>
            <button
              className={`font-jakarta px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap ${category === "Upcoming"
                ? "bg-secondary text-white"
                : "bg-gray-200 text-gray-700"
                }`}
              onClick={() => setCategory("Upcoming")}
            >
              Upcoming
            </button>
            <button
              className={`font-jakarta px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap ${category === "Past"
                ? "bg-secondary text-white"
                : "bg-gray-200 text-gray-700"
                }`}
              onClick={() => setCategory("Past")}
            >
              Past
            </button>
          </div>

        </div>
        {/* A7 — event-type filter */}
        <div className="flex flex-wrap sm:justify-center gap-1.5 sm:gap-2 bg-white/95 mx-auto p-1.5 sm:p-2 rounded-2xl w-fit">
          {EVENT_TYPES.map(({ value, label }) => (
            <button
              key={value}
              className={`font-jakarta px-2.5 sm:px-3 py-1 rounded-full font-semibold text-[11px] sm:text-xs whitespace-nowrap ${eventType === value
                ? "bg-gray-900 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              onClick={() => setEventType(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      <EventsLayout category={category} search={search} events={filteredByType} isLoading={false} />
    </div>
  );
}
