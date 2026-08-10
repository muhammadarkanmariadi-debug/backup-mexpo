"use client";

import { CalendarDays, MapPin, Users, ScanLine, Store } from "lucide-react";
import Link from "next/link";

import { Event } from "@/entities/event/event.entity";
import { dateFormat, formatDateRange } from "@/shared/utils/format";
import EventHero from "@/features/dashboard/shared/EventHero";

interface Props { event: Event }

export default function TenantView({ event }: Props) {
  return (
    <div className="mx-auto px-4 py-10 max-w-7xl">
      {/* ── Hero ── */}
      <EventHero event={event} roleLabel="Tenant" roleIcon={Store} roleBadge="bg-teal-50 text-teal-700" />

      {/* ── Actions ── */}
      <div className="flex flex-wrap items-center gap-2 mb-8 justify-end">
        <Link
          href={`/dashboard/${event.slug ?? event.uuid}/booth-checkin`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-teal-200 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
        >
          <ScanLine className="w-4 h-4" /> Scan Booth
        </Link>
        <Link
          href={`/dashboard/${event.slug ?? event.uuid}/tenant`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-blue-200 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          <Store className="w-4 h-4" /> Portal
        </Link>
      </div>

      {/* ── Detail ── */}
      <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-100 mb-6">
        <Row icon={MapPin}       label="Lokasi"             value={event.location} />
        <Row icon={CalendarDays} label="Tanggal event"      value={formatDateRange(event.start_date, event.end_date)} />
        <Row icon={CalendarDays} label="Registrasi ditutup" value={dateFormat(event.registration_deadline)} />
        <Row icon={Users}        label="Kuota"              value={event.quota > 0 ? `${event.quota} peserta` : "Tidak terbatas"} />
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Deskripsi</p>
        <p className="text-sm text-gray-700 leading-relaxed">{event.description}</p>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <span className="text-xs text-gray-400 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  );
}
