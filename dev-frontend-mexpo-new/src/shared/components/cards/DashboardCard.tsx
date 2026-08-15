"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CalendarDays, MapPin, Users, BookOpen, ArrowRight, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Event, getEventRole, getRoleRoute } from "@/entities/event/event.entity";
import { formatDateRange, formatDateWithDay } from "@/shared/utils/format";
import { updateEvent } from "@/services/event.service";
import RoleBadge from "@/shared/components/ui/RoleBadge";


// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const isPublished = status === "PUBLISHED";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0
      ${isPublished ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? "bg-green-500" : "bg-amber-500"}`} />
      {isPublished ? "Dipublikasikan" : "Draf"}
    </span>
  );
}

function StatChip({ icon: Icon, value, label }: { icon: React.ElementType; value?: number; label: string }) {
  if (value === undefined) return null;
  return (
    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="font-medium text-gray-700">{value}</span>
      <span>{label}</span>
    </div>
  );
}

// ─── Info strips ──────────────────────────────────────────────────────────────

function CommitteeStrip({ event }: { event: Event }) {
  return (
    <div className="flex justify-between items-center bg-gray-50 px-5 py-2 border-gray-100 border-t text-gray-400 text-xs">
      <span className="flex items-center gap-1.5">
        <CalendarDays className="w-3 h-3 shrink-0" />
        Registrasi:{" "}
        <span className="ml-1 font-medium text-gray-600">
          {formatDateWithDay(event.registration_start)} – {formatDateWithDay(event.registration_deadline)}
        </span>
      </span>
      <span>oleh {event.creator.full_name}</span>
    </div>
  );
}

function TenantStrip({ event }: { event: Event }) {
  return (
    <div className="flex items-center gap-1.5 bg-gray-50 px-5 py-2 border-gray-100 border-t text-gray-400 text-xs">
      <CalendarDays className="w-3 h-3 shrink-0" />
      Registrasi ditutup:{" "}
      <span className="ml-1 font-medium text-gray-600">
        {formatDateWithDay(event.registration_deadline)}
      </span>
    </div>
  );
}

function VisitorStrip({ event }: { event: Event }) {
  return (
    <div className="flex items-center gap-4 bg-gray-50 px-5 py-2 border-gray-100 border-t text-gray-400 text-xs">
      <span className="flex items-center gap-1.5">
        <Users className="w-3 h-3 shrink-0" />
        Kuota:{" "}
        <span className="ml-1 font-medium text-gray-600">
          {event.quota > 0 ? `${event.quota} peserta` : "Tidak terbatas"}
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        <CalendarDays className="w-3 h-3 shrink-0" />
        Daftar hingga:{" "}
        <span className="ml-1 font-medium text-gray-600">
          {formatDateWithDay(event.registration_deadline)}
        </span>
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  data: Event;
  /** Called after the owner/committee updates the event photo (refetch list). */
  onPhotoUpdated?: () => void;
}

export default function CardCommitteeEvent({ data, onPhotoUpdated }: Props) {
  const eventRole  = getEventRole(data);
  const routeRole  = getRoleRoute(eventRole);
  const isCommittee = routeRole === "committee";
  const isTenant    = routeRole === "tenant";
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoUpdating, setPhotoUpdating] = useState(false);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|gif|jpg)$/.test(file.type)) {
      toast.error("Hanya file gambar (JPG/PNG/GIF) yang diizinkan.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5 MB.");
      return;
    }
    setPhotoUpdating(true);
    try {
      // Photo-only update: payload is empty, only the file is sent.
      const res = await updateEvent(data.uuid, {} as never, file);
      if (!res.status) throw new Error();
      toast.success("Foto event diperbarui.");
      onPhotoUpdated?.();
    } catch {
      toast.error("Gagal mengunggah foto.");
    } finally {
      setPhotoUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white border border-gray-100 hover:border-gray-200 rounded-xl overflow-hidden transition-colors"
    >
      <div className="flex sm:flex-row flex-col sm:items-stretch gap-4 px-5 py-4">
        {/* Event image — editable by committee/admin */}
        <div className="relative w-full sm:w-36 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.photo || "/images/cards/card-e.png"}
            alt={data.name}
            className="rounded-lg w-full sm:w-36 h-32 sm:h-24 object-cover"
          />
          {isCommittee && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={photoUpdating}
              title="Ganti foto event"
              className="absolute inset-0 flex justify-center items-center bg-gray-950/40 opacity-0 hover:opacity-100 disabled:opacity-50 rounded-lg text-white transition-opacity"
            >
              {photoUpdating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif"
            className="hidden"
            onChange={(e) => void handlePhotoChange(e)}
          />
        </div>

        {/* Name + meta */}
        <div className="flex-1 my-5 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-sm truncate">{data.name}</h3>
            <RoleBadge role={eventRole} />
            {(isCommittee || isTenant) && <StatusBadge status={data.status} />}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-500 text-xs">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {data.location}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3 h-3 shrink-0" />
              {formatDateRange(data.start_date, data.end_date)}
            </span>
          </div>
        </div>

        {/* Stats — committee only */}
        {isCommittee && (
          <div className="hidden md:flex items-center gap-4 shrink-0">
            <StatChip icon={Users}    value={data.count_user_registration} label="registrasi" />
            <StatChip icon={Users}    value={data.count_tenants}           label="tenant" />
            <StatChip icon={BookOpen} value={data.count_workshops}         label="workshop" />
          </div>
        )}

        {/* Single action button → /dashboard/[slug] */}
        <Link
          href={`/dashboard/${data.slug ?? data.uuid}`}
          className="inline-flex items-center self-center gap-1.5 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 border border-brand-200 hover:border-brand-300 rounded-lg w-full sm:w-fit font-medium text-secondary text-xs transition-colors shrink-0"
        >
          {isCommittee ? "Kelola" : isTenant ? "Masuk" : "Detail"}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Info strip */}
      {isCommittee  && <CommitteeStrip event={data} />}
      {isTenant     && <TenantStrip    event={data} />}
      {!isCommittee && !isTenant && <VisitorStrip event={data} />}
    </motion.div>
  );
}
