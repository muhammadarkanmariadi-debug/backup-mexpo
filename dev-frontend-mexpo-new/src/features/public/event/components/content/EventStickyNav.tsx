"use client";

import React, { useState, useEffect } from "react";

interface EventStickyNavProps {
  hasRundown?: boolean;
  hasSpeakers?: boolean;
  hasLocation?: boolean;
  hasWorkshops?: boolean;
  hasTenants?: boolean;
  hasSponsors?: boolean;
  hasSouvenirs?: boolean;
}

export default function EventStickyNav({
  hasRundown = true,
  hasSpeakers = true,
  hasLocation = true,
  hasWorkshops = false,
  hasTenants = false,
  hasSponsors = false,
  hasSouvenirs = false,
}: EventStickyNavProps) {
  const navItems = [
    { id: "informasi", label: "Informasi" },
    ...(hasRundown ? [{ id: "agenda", label: "Agenda" }] : []),
    ...(hasSpeakers ? [{ id: "pembicara", label: "Pembicara" }] : []),
    ...(hasLocation ? [{ id: "lokasi", label: "Lokasi" }] : []),
    ...(hasWorkshops ? [{ id: "workshop", label: "Lokakarya" }] : []),
    ...(hasTenants ? [{ id: "tenant", label: "Penyewa" }] : []),
    ...(hasSouvenirs ? [{ id: "souvenir", label: "Souvenir" }] : []),
    ...(hasSponsors ? [{ id: "sponsor", label: "Sponsor" }] : []),
    { id: "faq", label: "FAQ" },
  ];

  const [activeTab, setActiveTab] = useState("informasi");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      for (let i = navItems.length - 1; i >= 0; i--) {
        const item = navItems[i];
        const el = document.getElementById(item.id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveTab(item.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [navItems]);

  const handleScrollTo = (id: string) => {
    setActiveTab(id);
    const el = document.getElementById(id);
    if (el) {
      const topOffset = el.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: topOffset, behavior: "smooth" });
    }
  };

  return (
    <div className="sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center space-x-6 sm:space-x-8 overflow-x-auto no-scrollbar py-3.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleScrollTo(item.id)}
                className={`text-xs sm:text-sm font-semibold transition-all whitespace-nowrap pb-1 relative ${
                  isActive
                    ? "text-secondary font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
