"use client";

import { useRouter } from "next/navigation";
import { Users, BookOpen, CalendarCheck2,
  Pencil, Send, Ticket, ScanLine, ClipboardCheck, Gift, BarChart3, ShieldCheck,
  CheckCircle2, RotateCcw, CalendarClock, Mic, Handshake, Phone } from "lucide-react";
import { toast } from "sonner";

import { Event } from "@/entities/event/event.entity";
import { useApiMutation } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { publishRequest, finishEvent, reopenEvent } from "@/services/event.service";
import EventHero from "@/features/dashboard/shared/EventHero";
import EventOverview from "@/features/dashboard/shared/EventOverview";
import ViewAction from "@/features/dashboard/shared/ViewAction";
import { getRoleBadge } from "@/shared/utils/role-badge";
import DashboardTabs, { TabGroup } from "@/features/dashboard/shared/DashboardTabs";
import { useConfirm } from "@/shared/components/ui/ConfirmDialog";
import PageShell from "@/shared/components/ui/PageShell";

import EventForm from "@/features/dashboard/event-form/EventForm";
import VerificationPage from "@/features/dashboard/verification/VerificationPage";
import ReportsPage from "@/features/dashboard/reports/ReportsPage";
import { RundownSection, SpeakersSection, SponsorsSection, ContactsSection } from "@/features/dashboard/manage/EventManager";
import RegistrationManager from "@/features/dashboard/registration/RegistrationManager";
import CheckInTabWrapper from "@/features/dashboard/checkin/CheckInTabWrapper";
import SouvenirCounterPage from "@/features/dashboard/souvenir/SouvenirCounterPage";
import WorkshopsManager from "@/features/dashboard/workshops/WorkshopsManager";
import TeamManager from "@/features/dashboard/team/TeamManager";
import AttendancePage from "@/features/dashboard/attendance/AttendancePage";

interface Props { event: Event }

export default function CommitteeView({ event }: Props) {
  const router = useRouter();
  const isDrafted = event.status === "DRAFTED" || event.status === "REJECTED";
  const isPublished = event.status === "PUBLISHED";
  const isFinished = event.status === "FINISHED";

  const detailKey = keys.events.detail(event.uuid);

  const { confirm, dialogs } = useConfirm();

  const publish = useApiMutation(() => publishRequest(event.uuid), {
    invalidate: [detailKey],
    successMessage: "Permintaan publikasi dikirim. Menunggu persetujuan super admin.",
    errorMessage: "Gagal mengirim permintaan publikasi.",
    notify: toast,
    onSuccess: () => router.refresh(),
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

  const handlePublishRequest = () => publish.mutate();
  const handleFinish = async () => {
    if (!(await confirm(`Selesaikan event "${event.name}"? Registrasi baru akan ditutup.`))) return;
    finish.mutate();
  };
  const handleReopen = async () => {
    if (!(await confirm(`Buka kembali event "${event.name}"?`))) return;
    reopen.mutate();
  };

  const overviewContent = <EventOverview event={event} showStats />;

  const tabGroups: TabGroup[] = [
    {
      id: "overview",
      label: "Ringkasan",
      subTabs: [
        { id: "info", label: "Informasi" },
        { id: "laporan", label: "Laporan", icon: BarChart3, content: <ReportsPage event={event} /> },
      ],
      content: overviewContent,
    },
    {
      id: "konten",
      label: "Konten Event",
      subTabs: [
        { id: "edit", label: "Detail Event", icon: Pencil, content: <EventForm event={event} /> },
        { id: "rundown", label: "Susunan Acara", icon: CalendarClock, content: <RundownSection eventId={event.uuid} /> },
        { id: "speakers", label: "Pembicara", icon: Mic, content: <SpeakersSection eventId={event.uuid} /> },
        { id: "sponsors", label: "Sponsor", icon: Handshake, content: <SponsorsSection eventId={event.uuid} /> },
        { id: "contact", label: "Kontak", icon: Phone, content: <ContactsSection eventId={event.uuid} /> },
      ],
    },
    {
      id: "manajemen",
      label: "Manajemen",
      subTabs: [
        { id: "tim", label: "Daftar Tim", icon: Users, content: <TeamManager event={event} /> },
        { id: "verifikasi", label: "Verifikasi Pendaftar", icon: ClipboardCheck, content: <VerificationPage event={event} /> },
        { id: "registrasi", label: "Registrasi & Tiket", icon: Ticket, content: <RegistrationManager event={event} /> },
        { id: "workshop", label: "Lokakarya", icon: BookOpen, content: <WorkshopsManager event={event} /> },
        { id: "souvenir", label: "Syarat Souvenir", icon: Gift, content: <SouvenirCounterPage event={event} /> },
      ],
    },
    {
      id: "operasional",
      label: "Operasional Hari-H",
      subTabs: [
        { id: "checkin", label: "Check-in Pintu", icon: ScanLine, content: <CheckInTabWrapper event={event} /> },
        { id: "absensi", label: "Absensi", icon: CalendarCheck2, content: <AttendancePage event={event} /> },
      ],
    }
  ];

  return (
    <PageShell className="py-10">
      {/* ── Hero ── */}
      <EventHero event={event} roleLabel="Panitia" roleIcon={ShieldCheck} roleBadge={getRoleBadge("COMMITTEE")} />

      {event.status === "REJECTED" && event.rejection_reason && (
        <div className="bg-error-50 mb-6 p-4 border border-error-200 rounded-xl text-error-700 text-sm">
          <strong>Alasan penolakan:</strong> {event.rejection_reason}
        </div>
      )}

      {/* ── Tabs Content ── */}
            {/* ── Actions ── */}
      {(isPublished || isFinished || isDrafted) && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {isPublished && (
            <ViewAction onClick={handleFinish} disabled={loading} variant="warning">
              <CheckCircle2 className="w-4 h-4" /> Selesaikan Event
            </ViewAction>
          )}
          {isFinished && (
            <ViewAction onClick={handleReopen} disabled={loading} variant="primary">
              <RotateCcw className="w-4 h-4" /> Buka Kembali
            </ViewAction>
          )}
          {isDrafted && (
            <ViewAction onClick={handlePublishRequest} disabled={loading} variant="success">
              <Send className="w-4 h-4" /> Ajukan Publikasi
            </ViewAction>
          )}
        </div>
      )}

      <DashboardTabs groups={tabGroups} />
      {dialogs}
    </PageShell>
  );
}
