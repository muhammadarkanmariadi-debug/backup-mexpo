"use client";

import { CalendarDays, MapPin, Users, UserPlus, Loader2, Award, IdCard, User } from "lucide-react";
import Link from "next/link";

import { Event } from "@/entities/event/event.entity";
import { dateFormat, formatDateRange } from "@/shared/utils/format";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { getMyQr, MyQr } from "@/services/qr.service";
import EventHero from "@/features/dashboard/shared/EventHero";

interface Props { event: Event }

export default function VisitorView({ event }: Props) {
  const isOpen = new Date() < new Date(event.registration_deadline);

  // QR is unavailable (status:false) for unregistered visitors — treated as
  // a normal "no QR yet" state via the fallback branch below.
  const { data: qr, isLoading: loadingQr } = useApiQuery<MyQr | null>(
    keys.qr.my(event.uuid),
    () => getMyQr(event.uuid),
    { retry: 0 },
  );

  return (
    <div className="mx-auto px-4 py-10 max-w-7xl">
      {/* ── Hero ── */}
      <EventHero event={event} roleLabel="Visitor" roleIcon={User} roleBadge="bg-gray-100 text-gray-600" />

      {/* ── Actions ── */}
      <div className="flex flex-wrap items-center gap-2 mb-8 justify-end">
        {isOpen ? (
          <Link
            href={`/event/${event.slug ?? event.uuid}/register`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-blue-200 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Daftar
          </Link>
        ) : (
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-medium text-gray-400">
            Registrasi ditutup
          </span>
        )}
        <Link
          href={`/dashboard/${event.slug ?? event.uuid}/badge`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors"
        >
          <IdCard className="w-4 h-4 text-secondary" /> ID Badge
        </Link>
        <Link
          href={`/dashboard/${event.slug ?? event.uuid}/certificates`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors"
        >
          <Award className="w-4 h-4 text-amber-500" /> Sertifikat
        </Link>
      </div>

      {/* ── My QR (A4) ── */}
      <div className="mb-6 flex flex-col items-center rounded-xl border border-gray-100 bg-white p-6 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          QR Saya — universal untuk check-in
        </p>
        {loadingQr ? (
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        ) : qr ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.image} alt="QR Code" className="h-40 w-40" />
            <p className="mt-3 text-xs text-gray-400 break-all max-w-xs">{qr.code_data}</p>
          </>
        ) : (
          <p className="text-sm text-gray-400">
            QR tersedia setelah kamu terdaftar sebagai visitor event ini.
          </p>
        )}
      </div>

      {/* ── Detail ── */}
      <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-100 mb-6">
        <Row icon={MapPin}       label="Lokasi"        value={event.location} />
        <Row icon={CalendarDays} label="Tanggal event" value={formatDateRange(event.start_date, event.end_date)} />
        <Row icon={CalendarDays} label="Daftar hingga" value={dateFormat(event.registration_deadline)} />
        <Row icon={Users}        label="Kuota"         value={event.quota > 0 ? `${event.quota} peserta` : "Tidak terbatas"} />
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
      <span className="text-xs text-gray-400 w-32 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  );
}
