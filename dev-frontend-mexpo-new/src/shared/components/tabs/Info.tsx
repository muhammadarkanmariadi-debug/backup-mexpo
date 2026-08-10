import React from "react";
import { Calendar, CheckCircle, Clock, MapPin } from "lucide-react";

import { dateFormat } from "@/shared/utils/format";
import { Event } from "@/entities/event/event.entity";
import ContentTitle2 from "@/shared/components/ui/ContentTitle2";

const InfoTab = ({ eventData }: { eventData: Event }) => {
  return (
    <div className="gap-4 sm:gap-6 md:gap-8 grid grid-cols-1 md:grid-cols-2 mx-auto px-2 sm:px-4 md:px-0 max-w-7xl">
      <div>
        <ContentTitle2 variant="tertiary" title="Overview" category="About Event" />
        <p className="mb-4 sm:mb-6 font-jakarta text-gray-600 text-sm sm:text-base leading-relaxed">
          {eventData?.description}
        </p>

        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <Calendar className="flex-shrink-0 mt-1 w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
            <div>
              <div className="font-public-sans font-semibold text-gray-900 text-sm sm:text-base">
                Date
              </div>
              <div className="font-jakarta text-gray-600 text-xs sm:text-sm">
                {dateFormat(eventData?.start_date)} -{" "}
                {dateFormat(eventData?.end_date)}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 sm:gap-3">
            <MapPin className="flex-shrink-0 mt-1 w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
            <div>
              <div className="font-public-sans font-semibold text-gray-900 text-sm sm:text-base">
                Location
              </div>
              <div className="font-jakarta text-gray-600 text-xs sm:text-sm">
                {eventData?.location}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoTab;
