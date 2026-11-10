"use client";

import React from "react";
import Hero from "./content/Hero";
import AboutAndInfoSection from "./content/AboutAndInfoSection";
import EventStickyNav from "./content/EventStickyNav";
import AgendaSection from "./content/AgendaSection";
import SpeakersSection from "./content/SpeakersSection";
import RegistrationFlow from "./content/RegistrationFlow";
import LocationSection from "./content/LocationSection";
import SponsorsSection from "./content/SponsorsSection";
import SouvenirCatalogSection from "./content/SouvenirCatalogSection";
import FaqSection from "./content/FaqSection";
import BottomCtaSection from "./content/BottomCtaSection";
import { Event } from "@/entities/event/event.entity";
import { WorkshopTab } from "@/shared/components/tabs/Workshop";
import { TenantTab } from "@/shared/components/tabs/Tenant";

export default function EventdetailPage({ eventData }: { eventData: Event }) {
  const speakers = eventData.eventSpeakers ?? [];
  const sponsors = eventData.eventSponsors ?? [];
  const rundown = eventData.eventRundowns ?? [];
  const workshops = eventData.workshops ?? [];
  const tenants = eventData.tenants ?? [];
  const souvenirCatalog = eventData.souvenir_catalog ?? [];

  return (
    <div className="overflow-hidden bg-white text-gray-900">
      {/* 1. Hero Section */}
      <Hero eventData={eventData} />

      {/* 2. Tentang Event & Kartu Ringkasan Informasi */}
      <AboutAndInfoSection eventData={eventData} />

      {/* 3. Sticky In-Page Navigation Bar */}
      <EventStickyNav
        hasRundown={rundown.length > 0}
        hasSpeakers={speakers.length > 0}
        hasLocation={Boolean(eventData.location)}
        hasWorkshops={workshops.length > 0}
        hasTenants={tenants.length > 0}
        hasSponsors={sponsors.length > 0}
        hasSouvenirs={souvenirCatalog.length > 0}
      />

      {rundown.length > 0 && (
        <AgendaSection rundown={rundown} />
      )}
      {/* 5. Pembicara Utama */}
      {speakers.length > 0 && (
        <SpeakersSection speakers={speakers} />
      )}
      {/* 6. Alur Pendaftaran (3 Langkah Berbasis QR) */}
      <RegistrationFlow />

      {/* 7. Lokasi & Peta Interaktif (jika location ada) */}
      <LocationSection eventData={eventData} />

      {/* 8. Workshop / Lokakarya (Hanya jika event memiliki data workshops) */}
      {workshops.length > 0 && (
        <section id="workshop" className="py-12 sm:py-16 ">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <WorkshopTab workshops={workshops} showRegisterButton={false} />
          </div>
        </section>
      )}

      {/* 9. Penyewa / Tenants (Hanya jika event memiliki data tenants) */}
      {tenants.length > 0 && (
        <section id="tenant" className="py-12 sm:py-16 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <TenantTab tenantData={tenants} />
          </div>
        </section>
      )}

      {/* Katalog souvenir (sistem poin) */}
      <SouvenirCatalogSection items={souvenirCatalog} />

      {/* 10. Sponsor & Partner (Hanya jika event memiliki data sponsors) */}
      <SponsorsSection sponsors={sponsors} />

      {/* 11. Pertanyaan Umum (FAQ) */}
      <FaqSection />

      {/* 12. Bottom Conversion CTA Banner */}
      <BottomCtaSection eventData={eventData} />
    </div>
  );
}
