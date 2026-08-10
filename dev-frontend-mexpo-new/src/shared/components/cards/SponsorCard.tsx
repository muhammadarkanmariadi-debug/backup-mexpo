import Image from "next/image";
import { EventSponsor, SponsorLevel } from "@/entities/event/sponsor.entity";

export const SponsorCard = ({ sponsor }: { sponsor: EventSponsor }) => {
  const levelColors: Record<SponsorLevel, string> = {
    PLATINUM: "bg-purple-100 text-purple-700",
    GOLD: "bg-yellow-100 text-yellow-700",
    SILVER: "bg-gray-100 text-gray-700",
    BRONZE: "bg-orange-50 text-orange-700",
  };

  return (
    <div className="bg-white hover:shadow-md border border-gray-100 shadow-sm rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center text-center transition-shadow min-h-[200px]">
      <div className="relative w-24 sm:w-28 h-24 sm:h-28 mb-4">
        {sponsor.logo ? (
          <Image
            src={sponsor.logo}
            alt={sponsor.name}
            fill
            className="object-contain"
          />
        ) : (
          <div className="w-full h-full bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
            Logo
          </div>
        )}
      </div>
      <h4 className="font-bold text-gray-900 text-base mb-2">{sponsor.name}</h4>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${levelColors[sponsor.level] || "bg-gray-100 text-gray-600"}`}>
        {sponsor.level || "Sponsor"}
      </span>
    </div>
  );
};
