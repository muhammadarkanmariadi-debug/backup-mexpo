"use client";

import { useRouter } from "next/navigation";
import { Users, BookOpen, CalendarCheck2,
  Pencil, Send, Trash2, Crown, Ticket, ScanLine, ClipboardCheck, Gift, BarChart3,
  CheckCircle2, RotateCcw, CalendarClock, Mic, Handshake, Phone, Award, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";

import { Event } from "@/entities/event/event.entity";
import { useApiMutation } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { publishRequest, deleteEvent, finishEvent, reopenEvent } from "@/services/event.service";
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
import CertificateDesignerWrapper from "@/features/dashboard/certificate-designer/CertificateDesignerWrapper";
import BadgeDesignerWrapper from "@/features/dashboard/badge-designer/BadgeDesignerWrapper";
import { PaymentsFeature } from "@/features/dashboard/payments/PaymentsFeature";

interface Props { event: Event }

export default function OwnerView({ event }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "SUPERADMIN";
  const isDrafted = event.status === "DRAFTED" || event.status === "REJECTED";
  const isPublished = event.status === "PUBLISHED";
  const isFinished = event.status === "FINISHED";

  const detailKey = keys.events.detail(event.uuid);

  const { confirm, dialogs } = useConfirm();

  // A3 — owner submits a publish request; super admin approves.
  const publish = useApiMutation(() => publishRequest(event.uuid), {
    invalidate: [detailKey],
    successMessage: "Permintaan publikasi dikirim. Menunggu persetujuan super admin.",
    errorMessage: "Gagal mengirim permintaan publikasi.",
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

  const handlePublishRequest = async () => {
    if (!(await confirm("Kirim permintaan publikasi untuk event ini?"))) return;
    publish.mutate();
  };

  const handleDelete = async () => {
    if (!(await confirm(`Hapus event "${event.name}"?`))) return;
    remove.mutate();
  };

  const handleFinish = async () => {
    if (!(await confirm(`Selesaikan event "${event.name}"? Registrasi baru akan ditutup.`))) return;
    finish.mutate();
  };

  const handleReopen = async () => {
    if (!(await confirm(`Buka kembali event "${event.name}"?`))) return;
    reopen.mutate();
  };

  const anyPending = publish.isPending || remove.isPending || finish.isPending || reopen.isPending;

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
        { id: "sertifikat", label: "Sertifikat", icon: Award, content: <CertificateDesignerWrapper event={event} /> },
        { id: "id-badge", label: "Desain ID Badge", icon: Ticket, content: <BadgeDesignerWrapper event={event} /> },
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
          { id: "pembayaran", label: "Pembayaran", icon: Wallet, content: <PaymentsFeature event={event} /> },
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
      {/* — Hero — */}
      <EventHero event={event} roleLabel="Pemilik" roleIcon={Crown} roleBadge={getRoleBadge("OWNER")} />

      {/* A3 — rejection reason */}
      {event.status === "REJECTED" && event.rejection_reason && (
        <div className="bg-error-50 mb-6 p-4 border border-error-200 rounded-xl text-error-700 text-sm">
          <strong>Alasan penolakan:</strong> {event.rejection_reason}
        </div>
      )}

      {/* ── Tabs Content ── */}
            {/* ── Actions ── */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {isPublished && (
          <ViewAction onClick={handleFinish} disabled={anyPending} variant="warning">
            <CheckCircle2 className="w-4 h-4" /> Selesaikan Event
          </ViewAction>
        )}
        {isFinished && (
          <ViewAction onClick={handleReopen} disabled={anyPending} variant="primary">
            <RotateCcw className="w-4 h-4" /> Buka Kembali
          </ViewAction>
        )}
        {isDrafted && (
          <ViewAction onClick={handlePublishRequest} disabled={anyPending} variant="success">
            <Send className="w-4 h-4" /> Ajukan Publikasi
          </ViewAction>
        )}
        <ViewAction onClick={handleDelete} disabled={anyPending} variant="danger">
          <Trash2 className="w-4 h-4" /> Hapus Event
        </ViewAction>
      </div>

      <DashboardTabs groups={tabGroups} />
      {dialogs}
    </PageShell>
  );
}
