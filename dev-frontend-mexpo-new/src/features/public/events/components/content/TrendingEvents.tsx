import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Event } from "@/entities/event/event.entity";
import { CalendarDays, MapPin } from "lucide-react";
import ContentTitle2 from "@/shared/components/ui/ContentTitle2";
import { validateEventRegistration } from "@/shared/utils/validateEventCategory";

interface TrendingEventsProps {
  events: Event[];
}

export default function TrendingEvents({ events }: TrendingEventsProps) {
  // Ambil 3 event dengan pendaftar terbanyak (Laris Manis) yang registrasinya masih buka
  const trendingEvents = events
    .filter((event) => {
      const { canRegister } = validateEventRegistration(
        event.registration_start ?? null,
        event.registration_deadline ?? null
      );
      return canRegister;
    })
    .sort((a, b) => (b.count_user_registration || 0) - (a.count_user_registration || 0))
    .slice(0, 3);

  if (trendingEvents.length === 0) return null;

  const mainEvent = trendingEvents[0];
  const sideEvents = trendingEvents.slice(1, 3);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(new Date(dateString));
  };

  const formatDateShort = (dateString: string) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short"
    }).format(new Date(dateString));
  };

  return (
    <section className="mt-16 mb-8 px-4 sm:px-6 md:px-8 mx-auto max-w-7xl">
      <ContentTitle2 
        category="TRENDING"
        title="Mungkin Kamu Sukai"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main Event (Kiri - Lebar 2 Kolom) */}
        {mainEvent && (
          <Link
            href={`/event/${mainEvent.slug || mainEvent.uuid}`}
            className="lg:col-span-2 group relative block w-full aspect-video lg:aspect-auto lg:h-[400px] rounded-3xl overflow-hidden shadow-sm"
          >
            <Image
              src={mainEvent.photo || "/images/cards/card-e.png"}
              alt={mainEvent.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
            
            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 w-full p-6 text-white">
              <h3 className="font-public-sans font-bold text-2xl md:text-4xl mb-2 drop-shadow-md">
                {mainEvent.name}
              </h3>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                <div className="flex items-center gap-1.5">
                  <CalendarDays size={16} className="text-secondary" />
                  <span>
                    {formatDate(mainEvent.start_date)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 line-clamp-1">
                  <MapPin size={16} className="text-secondary" />
                  <span className="line-clamp-1">{mainEvent.location}</span>
                </div>
                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs ml-auto">
                  {mainEvent.count_user_registration} Pendaftar
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Side Events (Kanan - 1 Kolom dibagi 2 baris vertikal atau tumpuk) */}
        <div className="flex flex-col gap-4 md:gap-6">
          {sideEvents.map((event) => (
            <Link
              key={event.uuid}
              href={`/event/${event.slug || event.uuid}`}
              className="group relative block w-full h-[200px] lg:h-[188px] rounded-3xl overflow-hidden shadow-sm"
            >
              <Image
                src={event.photo || "/images/cards/card-e.png"}
                alt={event.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              
              <div className="absolute bottom-0 left-0 w-full p-4 text-white">
                <h3 className="font-public-sans font-bold text-lg md:text-xl mb-2 line-clamp-2 drop-shadow-md">
                  {event.name}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                  <div className="flex items-center gap-1">
                    <CalendarDays size={14} className="text-secondary" />
                    <span>
                      {formatDateShort(event.start_date)}
                    </span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full ml-auto">
                    {event.count_user_registration} Pendaftar
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
