"use client";

import React from "react";
import { MapPin, Navigation } from "lucide-react";
import { Event } from "@/entities/event/event.entity";
import ContentTitle2 from "@/shared/components/ui/ContentTitle2";
import { resolveMapsEmbedUrl } from "@/shared/utils/maps-embed";

interface LocationSectionProps {
  eventData: Event;
}

export default function LocationSection({ eventData }: LocationSectionProps) {
  if (!eventData.location && !eventData.features?.maps_embed_url) return null;

  const locationText = eventData.location || eventData.name;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`;
  const embedUrl = resolveMapsEmbedUrl(eventData.features?.maps_embed_url, locationText);

  return (
    <section id="lokasi" className="py-12 sm:py-16 bg-white ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ContentTitle2
          category="Lokasi Event"
          title={`Lokasi ${eventData.name}`}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-6">
          {/* Left Column: Address info & CTA */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-start gap-3 text-gray-600 text-sm">
              <MapPin className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900 text-base">
                  {eventData.location}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Tempat pelaksanaan resmi acara {eventData.name}.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-secondary hover:bg-brand-600 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <Navigation className="w-4 h-4" />
                <span>Petunjuk Arah</span>
              </a>
            </div>
          </div>

          {/* Right Column: Embedded Map */}
          <div className="lg:col-span-7">
            <div className="h-64 sm:h-72 lg:h-80 w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative bg-gray-100">
              <iframe
                title={`Peta Lokasi ${eventData.name}`}
                src={embedUrl}
                className="border-0 w-full h-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
