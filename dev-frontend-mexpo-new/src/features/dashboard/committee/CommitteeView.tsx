"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Users,
  BookOpen,
  CalendarCheck2,
  Pencil,
  Send,
  Ticket,
  ScanLine,
  ClipboardCheck,
  Gift,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  CalendarClock,
  Clock,
  Mic,
  Handshake,
  Phone,
  Award,
  Wallet,
  FileText,
  Store,
} from "lucide-react";
import { toast } from "sonner";

import { Event } from "@/entities/event/event.entity";
import { useApiMutation } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { publishRequest, finishEvent, reopenEvent } from "@/services/event.service";
import EventHero from "@/features/dashboard/shared/EventHero";
import EventOverview from "@/features/dashboard/shared/EventOverview";
import EventPopularStats from "@/features/dashboard/shared/EventPopularStats";
import { getRoleBadge } from "@/shared/utils/role-badge";
import DashboardSidebarLayout, {
  SidebarTabGroup,
} from "@/features/dashboard/shared/DashboardSidebarLayout";
import { useConfirm } from "@/shared/components/ui/ConfirmDialog";
import PageShell from "@/shared/components/ui/PageShell";

import EventForm from "@/features/dashboard/event-form/EventForm";
import VerificationPage from "@/features/dashboard/verification/VerificationPage";
import ReportsPage from "@/features/dashboard/reports/ReportsPage";
import {
  RundownSection,
  SpeakersSection,
  SponsorsSection,
  ContactsSection,
} from "@/features/dashboard/manage/EventManager";
import RegistrationManager from "@/features/dashboard/registration/RegistrationManager";
import CheckInTabWrapper from "@/features/dashboard/checkin/CheckInTabWrapper";
import SouvenirCounterPage from "@/features/dashboard/souvenir/SouvenirCounterPage";
import WorkshopsManager from "@/features/dashboard/workshops/WorkshopsManager";
import TenantsManager from "@/features/dashboard/tenants/TenantsManager";
import TeamManager from "@/features/dashboard/team/TeamManager";
import AttendancePage from "@/features/dashboard/attendance/AttendancePage";
import CertificateDesignerWrapper from "@/features/dashboard/certificate-designer/CertificateDesignerWrapper";
import BadgeDesignerWrapper from "@/features/dashboard/badge-designer/BadgeDesignerWrapper";
import { PaymentsFeature } from "@/features/dashboard/payments/PaymentsFeature";

interface Props {
  event: Event;
}

export default function CommitteeView({ event }: Props) {
  const router = useRouter();
  const isDrafted = event.status === "DRAFTED" || event.status === "REJECTED";
  const isPublished = event.status === "PUBLISHED";
  const isFinished = event.status === "FINISHED";

  const detailKey = keys.events.detail(event.uuid);
  const { confirm, dialogs } = useConfirm();

  const publish = useApiMutation(() => publishRequest(event.uuid), {
    invalidate: [detailKey, keys.events.my({})],
    errorMessage: "Gagal mengirim permintaan publikasi.",
    notify: toast,
    onSuccess: () => {
      toast.success("Pengajuan Publikasi Berhasil", {
        description: `Event "${event.name}" saat ini berstatus PENDING dan sedang menunggu verifikasi serta persetujuan dari Super Admin.`,
        duration: 6000,
      });
      router.refresh();
    },
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

  const loading = publish.isPending || finish.isPending || reopen.isPending;

  const handlePublishRequest = async () => {
    if (!(await confirm("Kirim permintaan publikasi untuk event ini?"))) return;
    publish.mutate();
  };

  const handleFinish = async () => {
    if (
      !(await confirm(
        `Selesaikan event "${event.name}"? Registrasi baru akan ditutup.`
      ))
    )
      return;
    finish.mutate();
  };

  const handleReopen = async () => {
    if (!(await confirm(`Buka kembali event "${event.name}"?`))) return;
    reopen.mutate();
  };

  const overviewContent = (
    <div className="space-y-6">
      <EventPopularStats eventId={event.uuid} />
      <EventOverview event={event} showStats />
    </div>
  );

  const tabGroups: SidebarTabGroup[] = [
    {
      id: "overview",
      label: "Ringkasan",
      subTabs: [
        {
          id: "info",
          label: "Informasi Event",
          icon: FileText,
          content: overviewContent,
        },
        {
          id: "laporan",
          label: "Laporan & Analitik",
          icon: BarChart3,
          content: <ReportsPage event={event} />,
        },
      ],
    },
    {
      id: "konten",
      label: "Konten Event",
      subTabs: [
        {
          id: "edit",
          label: "Detail & Edit Event",
          icon: Pencil,
          content: <EventForm event={event} />,
        },
        {
          id: "rundown",
          label: "Susunan Acara",
          icon: CalendarClock,
          content: <RundownSection eventId={event.uuid} event={event} />,
        },
        {
          id: "speakers",
          label: "Pembicara",
          icon: Mic,
          content: <SpeakersSection eventId={event.uuid} />,
        },
        {
          id: "sponsors",
          label: "Sponsor",
          icon: Handshake,
          content: <SponsorsSection eventId={event.uuid} />,
        },
        {
          id: "contact",
          label: "Kontak",
          icon: Phone,
          content: <ContactsSection eventId={event.uuid} />,
        },
        {
          id: "sertifikat",
          label: "Desain Sertifikat",
          icon: Award,
          content: <CertificateDesignerWrapper event={event} />,
        },
        {
          id: "id-badge",
          label: "Desain ID Badge",
          icon: Ticket,
          content: <BadgeDesignerWrapper event={event} />,
        },
      ],
    },
    {
      id: "manajemen",
      label: "Manajemen",
      subTabs: [
        {
          id: "tim",
          label: "Daftar Tim",
          icon: Users,
          content: <TeamManager event={event} />,
        },
        {
          id: "verifikasi",
          label: "Verifikasi Pendaftar",
          icon: ClipboardCheck,
          content: <VerificationPage event={event} />,
        },
        {
          id: "registrasi",
          label: "Registrasi & Tiket",
          icon: Ticket,
          content: <RegistrationManager event={event} />,
        },
        {
          id: "workshop",
          label: "Lokakarya (Workshop)",
          icon: BookOpen,
          content: <WorkshopsManager event={event} />,
        },
        {
          id: "tenant",
          label: "Penyewa (Tenant)",
          icon: Store,
          content: <TenantsManager event={event} />,
        },
        {
          id: "souvenir",
          label: "Syarat Souvenir",
          icon: Gift,
          content: <SouvenirCounterPage event={event} />,
        },
        {
          id: "pembayaran",
          label: "Rekening & Pembayaran",
          icon: Wallet,
          content: <PaymentsFeature event={event} />,
        },
      ],
    },
    {
      id: "operasional",
      label: "Operasional Hari-H",
      subTabs: [
        {
          id: "checkin",
          label: "Check-in Pintu",
          icon: ScanLine,
          content: <CheckInTabWrapper event={event} />,
        },
        {
          id: "absensi",
          label: "Data Absensi",
          icon: CalendarCheck2,
          content: <AttendancePage event={event} />,
        },
      ],
    },
  ];

  const sidebarHeader = (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
          <Image
            src={event.photo || "/images/cards/card-e.png"}
            alt={event.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Pengelolaan Event
          </p>
          <h3 className="text-sm font-extrabold text-gray-900 truncate">
            {event.name}
          </h3>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-secondary border border-blue-100">
          <ShieldCheck className="w-3 h-3 text-secondary" />
          Panitia Event
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isPublished
              ? "bg-emerald-100 text-emerald-700"
              : isDrafted
              ? "bg-amber-100 text-amber-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {event.status}
        </span>
      </div>
    </div>
  );

  const sidebarFooter = (
    <div className="space-y-2">
      {isPublished && (
        <button
          type="button"
          onClick={handleFinish}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Selesaikan Event</span>
        </button>
      )}

      {isFinished && (
        <button
          type="button"
          onClick={handleReopen}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Buka Kembali</span>
        </button>
      )}

      {isDrafted && (
        <button
          type="button"
          onClick={handlePublishRequest}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ajukan Publikasi</span>
        </button>
      )}

      {event.status === "PENDING" && (
        <div className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-xs text-center">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Menunggu Verifikasi Super Admin</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      <DashboardSidebarLayout
        groups={tabGroups}
        defaultGroupId="overview"
        defaultSubTabId="info"
        sidebarHeader={sidebarHeader}
        sidebarFooter={sidebarFooter}
        backHref="/dashboard"
        backLabel="Kembali ke Dashboard"
        topHeader={
          <div className="space-y-4">
            <EventHero
              event={event}
              roleLabel="Panitia"
              roleIcon={ShieldCheck}
              roleBadge={getRoleBadge("COMMITTEE")}
            />

            {event.status === "PENDING" && (
              <div className="bg-amber-50 p-4 border border-amber-200 rounded-2xl text-amber-900 text-sm flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-900">Menunggu Verifikasi Super Admin</div>
                  <p className="text-xs text-amber-700 mt-1">
                    Permintaan publikasi telah diajukan. Event ini sedang dalam antrean verifikasi dan akan segera ditinjau oleh Super Admin. Anda dapat memantau statusnya di sini.
                  </p>
                </div>
              </div>
            )}

            {event.status === "REJECTED" && event.rejection_reason && (
              <div className="bg-red-50 p-4 border border-red-200 rounded-2xl text-red-700 text-sm">
                <strong>Alasan penolakan:</strong> {event.rejection_reason}
              </div>
            )}
          </div>
        }
      />

      {dialogs}
    </>
  );
}
