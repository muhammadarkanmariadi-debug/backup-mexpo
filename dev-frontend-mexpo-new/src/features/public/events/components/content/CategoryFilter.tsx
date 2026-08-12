import React from "react";
import { motion } from "framer-motion";
import { EventType } from "@/entities/event/event.entity";
import ContentTitle2 from "@/shared/components/ui/ContentTitle2";
import {
  LayoutGrid,
  Store,
  Briefcase,
  Mic,
  GraduationCap,
  Images,
  ShoppingBag,
  Landmark,
  School,
  MoreHorizontal,
} from "lucide-react";

interface CategoryFilterProps {
  eventType: EventType | "ALL";
  setEventType: (type: EventType | "ALL") => void;
}

const CATEGORY_ICONS: Record<EventType | "ALL", React.ElementType> = {
  ALL: LayoutGrid,
  EXPO: Store,
  CAREER_FAIR: Briefcase,
  SEMINAR: Mic,
  GRADUATION: GraduationCap,
  EXHIBITION: Images,
  MARKETPLACE: ShoppingBag,
  GOVERNMENT: Landmark,
  CAMPUS_SCHOOL: School,
  OTHER: MoreHorizontal,
};

const CATEGORY_LABELS: Record<EventType | "ALL", string> = {
  ALL: "Semua",
  EXPO: "Expo",
  CAREER_FAIR: "Bursa Kerja",
  SEMINAR: "Seminar",
  GRADUATION: "Kelulusan",
  EXHIBITION: "Pameran",
  MARKETPLACE: "Pasar",
  GOVERNMENT: "Pemerintah",
  CAMPUS_SCHOOL: "Kampus/Sekolah",
  OTHER: "Lainnya",
};

export default function CategoryFilter({
  eventType,
  setEventType,
}: CategoryFilterProps) {
  const categories = Object.keys(CATEGORY_LABELS) as Array<EventType | "ALL">;

  return (
    <section className="mt-12 mb-8 px-4 sm:px-6 md:px-8 mx-auto max-w-7xl">
      <ContentTitle2 
        category="EKSPLORASI"
        title="Kategori Event"
      />

      {/* Horizontal Scrollable Container */}
      <div className="flex overflow-x-auto pt-4 pb-6 -mx-4 px-4 sm:mx-0 sm:px-4 hide-scrollbar gap-4 sm:gap-6 lg:justify-between">
        {categories.map((type, i) => {
          const Icon = CATEGORY_ICONS[type];
          const isActive = eventType === type;

          return (
            <motion.button
              key={type}
              onClick={() => setEventType(type)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex flex-col items-center gap-3 min-w-[70px] sm:min-w-[80px] group outline-none"
            >
              {/* Circular Icon */}
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full transition-all duration-300 shadow-sm ${
                  isActive
                    ? "bg-secondary text-white scale-110 shadow-md"
                    : "bg-white text-secondary border border-secondary/20 hover:border-secondary hover:bg-secondary/5"
                }`}
              >
                <Icon size={28} strokeWidth={isActive ? 2.5 : 2} />
              </div>

              {/* Pill Button / Label */}
              <div
                className={`w-full px-2 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold text-center border transition-all duration-300 ${
                  isActive
                    ? "bg-secondary border-secondary text-white"
                    : "bg-white border-secondary/40 text-secondary group-hover:border-secondary"
                }`}
              >
                {CATEGORY_LABELS[type]}
              </div>
            </motion.button>
          );
        })}
      </div>
      
      {/* Utility style for hiding scrollbar if needed globally, but added here directly via tailwind arbitrary or just standard classes */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </section>
  );
}
