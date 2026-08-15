import React from "react";
import { Calendar, MapPin } from "lucide-react";

import { dateFormat } from "@/shared/utils/format";
import { Event } from "@/entities/event/event.entity";
import ContentTitle2 from "@/shared/components/ui/ContentTitle2";
import ViewDetails from "@/features/dashboard/shared/ViewDetails";

const InfoTab = ({ eventData }: { eventData: Event }) => {
  return (
    <div className="mx-auto px-2 sm:px-4 md:px-6 lg:px-0 w-full max-w-7xl animate-in duration-500 fade-in">
      <div className="flex flex-col mb-5">
        <ContentTitle2 title="Ringkasan" category="Tentang Event" />
      </div>
      <div className="gap-4 sm:gap-6 md:gap-8 grid grid-cols-1 md:grid-cols-2">
        <div>
          <p className="mb-4 sm:mb-6 font-jakarta text-gray-600 text-sm sm:text-base leading-relaxed">
            {eventData?.description}
          </p>

        <ViewDetails
          items={[
            {
              icon: Calendar,
              label: "Tanggal",
              value: `${dateFormat(eventData?.start_date)} - ${dateFormat(eventData?.end_date)}`,
            },
            {
              icon: MapPin,
              label: "Lokasi",
              value: eventData?.location,
            },
          ]}
        />
      </div>
    </div>
    </div>
  );
};

export default InfoTab;
