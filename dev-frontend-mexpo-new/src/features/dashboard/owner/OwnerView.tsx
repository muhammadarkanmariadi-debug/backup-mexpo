"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays, MapPin, Users, BookOpen, CalendarCheck2,
  Pencil, Send, Trash2, Crown, Eye, EyeOff, Tag, Settings2, Ticket, ScanLine, ClipboardCheck, Gift, BarChart3,
  CheckCircle2, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import { dateFormat, formatDateRange } from "@/shared/utils/format";
import { Event } from "@/entities/event/event.entity";
import { useApiMutation } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { publishRequest, deleteEvent, finishEvent, reopenEvent } from "@/services/event.service";
import EventHero from "@/features/dashboard/shared/EventHero";
import KelolaMenu, { KelolaItem } from "@/features/dashboard/shared/KelolaMenu";

interface Props { event: Event }

const EVENT_TYPE_LABELS: Record<string, string> = {
  EXPO: "Expo",
  CAREER_FAIR: "Career Fair",
  SEMINAR: "Seminar",
  GRADUATION: "Graduation",
  EXHIBITION: "Exhibition",
  MARKETPLACE: "Marketplace",
  GOVERNMENT: "Government",
  CAMPUS_SCHOOL: "Campus/School",
  OTHER: "Other",
};

export default function OwnerView({ event }: Props) {
  const router = useRouter();
  const isDrafted = event.status === "DRAFTED" || event.status === "REJECTED";
  const isPublished = event.status === "PUBLISHED";
  const isFinished = event.status === "FINISHED";

  const detailKey = keys.events.detail(event.uuid);

  // A3 â€” owner submits a publish request; super admin approves.
  const publish = useApiMutation(() => publishRequest(event.uuid), {
    invalidate: [detailKey],
    successMessage: "Publish request dikirim. Menunggu persetujuan super admin.",
    errorMessage: "Gagal mengirim publish request.",
    notify: toast,
    onSuccess: () => router.refresh(),
  });

  const remove = useApiMutation(() => deleteEvent(event.uuid), {
    invalidate: [detailKey],
    successMessage: "Event berhasil dihapus.",
    errorMessage: "Gagal menghapus event.",
    notify: toast,
    onSuccess: () => router.push("/dashboard"),
  });

  const finish = useApiMutation(() => finishEvent(event.uuid), {
    invalidate: [detailKey],
    successMessage: "Event ditandai selesai.",
    errorMessage: "Gagal menyelesaikan event.",
    notify: toast,
    onSuccess: () => router.refresh(),
  });

  const reopen = useApiMutation(() => reopenEvent(event.uuid), {
    invalidate: [detailKey],
    successMessage: "Event dibuka kembali.",
    errorMessage: "Gagal membuka kembali event.",
    notify: toast,
    onSuccess: () => router.refresh(),
  });

  const handlePublishRequest = () => {
    if (!confirm("Kirim publish request event ini?")) return;
    publish.mutate();
  };

  const handleDelete = () => {
    if (!confirm(`Hapus event "${event.name}"?`)) return;
    remove.mutate();
  };

  const handleFinish = () => {
    if (!confirm(`Selesaikan event "${event.name}"? Registrasi baru akan ditutup.`)) return;
    finish.mutate();
  };

  const handleReopen = () => {
    if (!confirm(`Buka kembali event "${event.name}"?`)) return;
    reopen.mutate();
  };

  const anyPending = publish.isPending || remove.isPending || finish.isPending || reopen.isPending;

  const kelolaItems: KelolaItem[] = [
    { label: "Kelola Konten", href: `/dashboard/${event.slug ?? event.uuid}/manage`, icon: Settings2 },
    { label: "Registrasi", href: `/dashboard/${event.slug ?? event.uuid}/registration`, icon: Ticket },
    { label: "Check-in", href: `/dashboard/${event.slug ?? event.uuid}/check-in`, icon: ScanLine },
    { label: "Souvenir", href: `/dashboard/${event.slug ?? event.uuid}/souvenir`, icon: Gift },
    { label: "Workshop", href: `/dashboard/${event.slug ?? event.uuid}/workshops`, icon: BookOpen },
    { label: "Tim", href: `/dashboard/${event.slug ?? event.uuid}/team`, icon: Users },
    { label: "Absensi", href: `/dashboard/${event.slug ?? event.uuid}/attendance`, icon: CalendarCheck2 },
  ];

  return (
    <div className="mx-auto px-4 py-10 max-w-7xl">
      {/* â”€â”€ Hero â”€â”€ */}
      <EventHero event={event} roleLabel="Owner" roleIcon={Crown} roleBadge="bg-secondary text-white" />

      {/* â”€â”€ Main actions â”€â”€ */}
      <div className="flex flex-wrap justify-end items-center gap-2 mb-8">
        <Link
          href={`/dashboard/${event.slug ?? event.uuid}/edit`}
          className="inline-flex items-center gap-1.5 hover:bg-gray-50 px-3 py-1.5 border border-gray-200 rounded-lg font-medium text-gray-500 hover:text-gray-800 text-xs transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </Link>
        <Link
          href={`/dashboard/${event.slug ?? event.uuid}/verification`}
          className="inline-flex items-center gap-1.5 hover:bg-gray-50 px-3 py-1.5 border border-gray-200 rounded-lg font-medium text-gray-500 hover:text-gray-800 text-xs transition-colors"
        >
          <ClipboardCheck className="w-3.5 h-3.5" /> Verifikasi
        </Link>
        <Link
          href={`/dashboard/${event.slug ?? event.uuid}/reports`}
          className="inline-flex items-center gap-1.5 hover:bg-gray-50 px-3 py-1.5 border border-gray-200 rounded-lg font-medium text-gray-500 hover:text-gray-800 text-xs transition-colors"
        >
          <BarChart3 className="w-3.5 h-3.5" /> Laporan
        </Link>
        <KelolaMenu
          items={kelolaItems}
          extra={
            <>
              {isPublished && (
                <button
                  onClick={handleFinish}
                  disabled={anyPending}
                  className="flex items-center gap-2 hover:bg-emerald-50 disabled:opacity-50 px-3 py-2 w-full text-emerald-600 text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> {finish.isPending ? "..." : "Selesaikan Event"}
                </button>
              )}
              {isFinished && (
                <button
                  onClick={handleReopen}
                  disabled={anyPending}
                  className="flex items-center gap-2 hover:bg-amber-50 disabled:opacity-50 px-3 py-2 w-full text-amber-600 text-sm"
                >
                  <RotateCcw className="w-4 h-4" /> {reopen.isPending ? "..." : "Buka Kembali"}
                </button>
              )}
              {isDrafted && (
                <button
                  onClick={handlePublishRequest}
                  disabled={anyPending}
                  className="flex items-center gap-2 hover:bg-blue-50 disabled:opacity-50 px-3 py-2 w-full text-blue-600 text-sm"
                >
                  <Send className="w-4 h-4" /> Ajukan Publikasi
                </button>
              )}
            </>
          }
        />
        <button
          onClick={handleDelete}
          disabled={anyPending}
          className="inline-flex items-center gap-1.5 hover:bg-red-50 disabled:opacity-50 px-3 py-1.5 border border-gray-200 hover:border-red-200 rounded-lg font-medium text-gray-500 hover:text-red-700 text-xs transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {remove.isPending ? "..." : "Hapus"}
        </button>
      </div>

      {/* A3 â€” rejection reason */}
      {event.status === "REJECTED" && event.rejection_reason && (
        <div className="bg-red-50 mb-6 p-4 border border-red-200 rounded-xl text-red-700 text-sm">
          <strong>Alasan penolakan:</strong> {event.rejection_reason}
        </div>
      )}

      {/* â”€â”€ Stats â”€â”€ */}
      <div className="gap-3 grid grid-cols-3 mb-8">
        {[
          { label: "Registrasi", value: event.count_user_registration ?? 0, icon: Users },
          { label: "Tenant", value: event.count_tenants ?? 0, icon: Users },
          { label: "Workshop", value: event.count_workshops ?? 0, icon: BookOpen },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-gray-50 p-4 rounded-xl">
            <p className="flex items-center gap-1.5 mb-1 text-gray-500 text-xs">
              <Icon className="w-3.5 h-3.5" /> {label}
            </p>
            <p className="font-semibold text-gray-900 text-2xl">{value}</p>
          </div>
        ))}
      </div>

      {/* â”€â”€ Detail â”€â”€ */}
      <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-100">
        <Row icon={MapPin} label="Lokasi" value={event.location} />
        <Row icon={CalendarDays} label="Tanggal event" value={formatDateRange(event.start_date, event.end_date)} />
        <Row icon={CalendarDays} label="Registrasi" value={`${dateFormat(event.registration_start)} â€“ ${dateFormat(event.registration_deadline)}`} />
        <Row icon={Users} label="Kuota" value={event.quota > 0 ? `${event.quota} peserta` : "Tidak terbatas"} />
        <Row icon={Tag} label="Jenis" value={EVENT_TYPE_LABELS[event.event_type] ?? event.event_type} />
        <Row
          icon={event.visibility === "PRIVATE" ? EyeOff : Eye}
          label="Visibilitas"
          value={event.visibility === "PRIVATE" ? "Private" : "Public"}
        />
      </div>

      {/* â”€â”€ Description â”€â”€ */}
      <div className="bg-white mt-6 p-5 border border-gray-100 rounded-xl">
        <p className="mb-2 text-gray-400 text-xs uppercase tracking-wider">Deskripsi</p>
        <p className="text-gray-700 text-sm leading-relaxed">{event.description}</p>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <span className="w-32 text-gray-400 text-xs shrink-0">{label}</span>
      <span className="font-medium text-gray-800 text-sm">{value}</span>
    </div>
  );
}

