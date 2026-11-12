"use client";



import { useState } from "react";
import Image from "next/image";
import { Workshop } from "@/entities/event/workshop.entity";
import { useAuthStore } from "@/stores/auth.store";
import { Clock, MapPin, Loader2, CheckCircle2, Mic, UserCheck } from "lucide-react";
import { formatTime } from "@/shared/utils/format";




export const WorkshopCard = ({
  workshop,
  handleRegisterWorkshop,
  isSubmitting,
  showRegisterButton = true,
}: {
  workshop: Workshop;
  variant?: string;
  handleRefetchWorkshops?: () => void;
  handleRegisterWorkshop: () => void;
  isSubmitting: boolean;
  /** Hide the register CTA (public catalog view). Defaults to showing it. */
  showRegisterButton?: boolean;
}) => {

  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuthStore();
  const bookings = workshop.workshopBookings ?? [];
  // A cancelled booking is not a registration.
  const registered = bookings.filter((b) => b.status !== "CANCELLED").length;
  const checkedIn = bookings.filter(
    (b) => b.status !== "CANCELLED" && b.checkin_at != null,
  ).length;
  // Online registration closes at quota. The backend counts every booking row
  // (cancelled included) for that, so the button mirrors it (FIX-09).
  const isFull = workshop.quota > 0 && bookings.length >= workshop.quota;
  // Attendance slots = quota minus people who actually checked in. A no-show
  // leaves a slot free that a visitor without a booking can take by checking in.
  const slotsLeft = workshop.quota > 0 ? Math.max(0, workshop.quota - checkedIn) : null;

  // Speakers assigned to this workshop (only approved ones are public).
  const speakers = (workshop.workshopSpeakers ?? [])
    .map((ws) => ws.event_speaker)
    .filter((sp) => sp && (sp.status ?? "APPROVED") === "APPROVED");

  const isUserRegistered = workshop.workshopBookings?.some(
    (booking: { user_id?: string }) => booking.user_id === user?.uuid
  ) || false;


  const registeredPercentage =
    workshop.quota > 0 ? (registered / workshop.quota) * 100 : 0;
  // Attendance is measured against the quota (the seats in the room), not
  // against registrations: walk-ins can fill seats that no-shows left free.
  const checkInPercentage =
    workshop.quota > 0 ? (checkedIn / workshop.quota) * 100 : 0;



  return (
    <div className="bg-brand-50/50 p-4 sm:p-6 md:p-8 lg:p-10 rounded-xl sm:rounded-2xl animate-in duration-500 fade-in">
      <div className="mx-auto max-w-3xl text-center">
        {/* Title & Description */}
        <h2 className="mb-1 font-bold text-black text-xl sm:text-2xl md:text-3xl lg:text-4xl">
          {workshop.title.split(" ").slice(0, -1).join(" ")}{" "}
          <span className="text-brand-500">
            {workshop.title.split(" ").slice(-1)}
          </span>
        </h2>
        <p className="mx-auto mb-4 sm:mb-6 md:mb-8 max-w-2xl text-gray-600 text-xs sm:text-sm md:text-base">
          {workshop.description && workshop.description.length > 150 && !isExpanded
            ? `${workshop.description.substring(0, 150)}... `
            : `${workshop.description} `}
          {workshop.description && workshop.description.length > 150 && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="text-brand-500 font-semibold hover:underline"
            >
              {isExpanded ? "Tutup" : "Baca Selengkapnya"}
            </button>
          )}
        </p>

        {/* Meta Info */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8">
          <span className="inline-flex items-center gap-1.5 sm:gap-2 bg-brand-500 shadow-sm px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full font-semibold text-white text-xs sm:text-sm">
            <MapPin className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            {workshop.location}
          </span>
          <span className="inline-flex items-center gap-1.5 sm:gap-2 bg-brand-500 shadow-sm px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full font-semibold text-white text-xs sm:text-sm">
            <Clock className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            {formatTime(workshop.start_time)} - {formatTime(workshop.end_time)}
          </span>
        </div>

        {/* Speakers assigned to this workshop */}
        {speakers.length > 0 && (
          <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500">
              <Mic className="w-3.5 h-3.5" />
              Pembicara
            </span>
            <ul className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {speakers.map((sp) => (
                <li
                  key={sp.uuid}
                  title={sp.bio || sp.name}
                  className="inline-flex items-center gap-2 bg-white shadow-xs py-1 pr-3 sm:pr-4 pl-1 border border-brand-100 rounded-full"
                >
                  <span className="relative flex justify-center items-center bg-brand-100 rounded-full w-8 sm:w-9 h-8 sm:h-9 overflow-hidden font-bold text-brand-600 text-xs shrink-0">
                    {sp.photo ? (
                      <Image
                        src={sp.photo}
                        alt={sp.name}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      sp.name.trim().charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="font-semibold text-gray-800 text-xs sm:text-sm">
                    {sp.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Progress Bars */}
        <div className="bg-white shadow-sm mb-4 sm:mb-6 p-3 sm:p-4 md:p-6 border border-brand-100 rounded-lg sm:rounded-xl">
          <div className="gap-3 sm:gap-4 md:gap-8 grid grid-cols-1 sm:grid-cols-3">
            {/* Stats: Check In */}
            <div>
              <div className="flex items-center mb-2 text-sm">
                <span className="font-semibold text-gray-700">Kehadiran</span>
                <span className="ml-auto text-gray-500 text-xs">
                  {checkedIn}
                  {workshop.quota > 0 ? ` / ${workshop.quota}` : ""}
                </span>
              </div>
              <div className="bg-blue-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(checkInPercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Stats: Registered */}
            <div>
              <div className="flex items-center mb-2 text-sm">
                <span className="font-semibold text-gray-700">Terdaftar</span>
                <span className="ml-auto text-gray-500 text-xs">
                  {registered}
                </span>
              </div>
              <div className="bg-blue-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(registeredPercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Stats: Quota */}
            <div>
              <div className="flex items-center mb-2 text-sm">
                <span className="font-semibold text-gray-700">Total Kuota</span>
                <span className="ml-auto text-gray-500 text-xs">
                  {workshop.quota}
                </span>
              </div>
              <div className="bg-blue-100 rounded-full h-2">
                <div
                  className="bg-brand-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(checkInPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Attendance slots: open to people without a booking while any is free */}
        {slotsLeft !== null && (
          <p className="mb-4 sm:mb-6 inline-flex items-center justify-center gap-1.5 text-gray-600 text-xs sm:text-sm">
            <UserCheck className="w-4 h-4 text-brand-500 shrink-0" />
            {slotsLeft > 0
              ? `Slot kehadiran tersisa ${slotsLeft} dari ${workshop.quota}. Belum daftar? Tetap bisa check-in di lokasi selama slot masih ada.`
              : "Slot kehadiran sudah penuh."}
          </p>
        )}

        {/* Action Button — only rendered in the visitor dashboard
            (public event page hides it via showRegisterButton=false). */}
        {showRegisterButton ? (
        <button
            onClick={handleRegisterWorkshop}
            disabled={isFull || isSubmitting || isUserRegistered}
            className={`group flex items-center justify-center gap-1.5 sm:gap-2 mx-auto px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 md:py-4 rounded-full font-bold text-sm sm:text-base transition-all duration-300 ${isUserRegistered
              ? "bg-green-500 text-white cursor-not-allowed"
              : isFull || isSubmitting
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-brand-500 text-white hover:bg-brand-600 hover:shadow-xl active:scale-95"
              }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 animate-spin" />
                Memproses...
              </>
            ) : isUserRegistered ? (
              <>
                <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5" />
                Anda Sudah Terdaftar
              </>
            ) : isFull ? (
              "Kuota Penuh"
            ) : (
              "Daftar Lokakarya Sekarang"
            )}
          </button>
        ) : (
          <p className="mx-auto max-w-md text-sm text-gray-500">
            Pendaftaran lokakarya dilakukan dari dashboard pengunjung event Anda.
          </p>
        )}
      </div>
    </div>
  );
};