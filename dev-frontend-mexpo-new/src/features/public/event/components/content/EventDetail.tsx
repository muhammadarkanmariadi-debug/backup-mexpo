
import React, { useState } from "react";
import { EventSpeaker } from "@/entities/event/speaker.entity";
import { EventSponsor } from "@/entities/event/sponsor.entity";
import { EventRundown } from "@/entities/event/rundown.entity";
import { EventContact } from "@/entities/event/contact.entity";
import ContentTitle1 from "@/shared/components/ui/ContentTitle1";
import { Event } from "@/entities/event/event.entity";
import { WorkshopTab } from "../../../../../shared/components/tabs/Workshop";
import { Workshop } from "@/entities/event/workshop.entity";
import { TenantTab } from "../../../../../shared/components/tabs/Tenant";
import ContactsTab from "../../../../../shared/components/tabs/Contact";
import SponsorsTab from "../../../../../shared/components/tabs/Sponsors";
import SpeakersTab from "../../../../../shared/components/tabs/Speakers";
import AgendaTab from "../../../../../shared/components/tabs/Agenda";
import InfoTab from "../../../../../shared/components/tabs/Info";
import { Tenant } from "@/entities/event/tenant.entity";

// Localized tab labels — the array below must keep rendering localized text
// while the internal key stays lowercase ("info", "agenda", …).
const EVENT_TAB_LABELS: Record<string, string> = {
  info: "Informasi",
  agenda: "Agenda",
  speakers: "Pembicara",
  sponsors: "Sponsor",
  contact: "Kontak",
  workshop: "Lokakarya",
  tenant: "Penyewa",
};

const EventDetail = ({
  eventData,
  speakers,
  sponsors,
  rundown,
  contacts,
  workshops,
  tenants,
}: {
  eventData: Event;
  speakers: EventSpeaker[];
  sponsors: EventSponsor[];
  rundown: EventRundown[];
  contacts: EventContact[];
  workshops: Workshop[];
  tenants: Tenant[];
}) => {
  const [activeTab, setActiveTab] = useState("info");

  return (
    <section id="info" className="py-5 sm:py-10 md:py-14 lg:py-20">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-440">
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden">
          <div className="p-4 sm:p-6 md:p-8 lg:p-12">
            <ContentTitle1
              title={eventData?.name.split(" ").slice(0, 2).join(" ")}
              spanText={eventData?.name.split(" ")[2]}
              description={
                "Event ini terbuka untuk pelajar, sekolah, mitra industri, dan masyarakat umum. Penyelenggara berhak meninjau dan menyetujui pendaftaran."
              }
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:mx-20 mb-4 sm:mb-6 md:mb-8 border-gray-200 border-b overflow-x-auto scrollbar-hide">
              {["Info", "Agenda", "Speakers", "Sponsors", "Contact", "Workshop", "Tenant"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    className={`flex-shrink-0 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-semibold transition border-b-2 whitespace-nowrap ${activeTab === tab.toLowerCase()
                      ? "border-secondary text-secondary"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    {EVENT_TAB_LABELS[tab.toLowerCase()] ?? tab}
                  </button>
                ),
              )}
            </div>

            <div className="space-y-4 sm:space-y-6 md:space-y-8">
              {activeTab === "info" && (
                <InfoTab key={"info"} eventData={eventData} />
              )}

              {activeTab === "agenda" && (
                <AgendaTab key={"agenda"} rundown={rundown} />
              )}

              {activeTab === "speakers" && (
                <SpeakersTab key={"speakers"} speakers={speakers} />
              )}

              {activeTab === "sponsors" && (
                <SponsorsTab key={"sponsors"} sponsors={sponsors} />
              )}

              {activeTab === "contact" && (
                <ContactsTab key={"contact"} contactList={contacts} />
              )}

              {activeTab === "workshop" && (
                <WorkshopTab key={"workshop"} workshops={workshops} />
              )}

              {activeTab === "tenant" && (
                <TenantTab key={"tenant"} tenantData={tenants} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventDetail;
