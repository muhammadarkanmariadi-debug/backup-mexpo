"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Award, IdCard, User, UserPlus, BookOpen, CalendarDays, Mic, Handshake, Phone, Store, CreditCard } from "lucide-react";

import DashboardTabs, { TabGroup } from "@/features/dashboard/shared/DashboardTabs";
import { Info, QrCode } from "lucide-react";


import { Event } from "@/entities/event/event.entity";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { getMyQr, MyQr } from "@/services/qr.service";
import { getEventByUuidByMe } from "@/services/event.service";
import EventHero from "@/features/dashboard/shared/EventHero";
import EventOverview from "@/features/dashboard/shared/EventOverview";
import ViewAction from "@/features/dashboard/shared/ViewAction";
import { getRoleBadge } from "@/shared/utils/role-badge";
import PageShell from "@/shared/components/ui/PageShell";
import Image from "next/image";
import { WorkshopTab } from "@/shared/components/tabs/Workshop";
import { TenantTab } from "@/shared/components/tabs/Tenant";
import AgendaTab from "@/shared/components/tabs/Agenda";
import SpeakersTab from "@/shared/components/tabs/Speakers";
import SponsorsTab from "@/shared/components/tabs/Sponsors";
import ContactsTab from "@/shared/components/tabs/Contact";
import { BadgeModal } from "@/features/dashboard/badge/BadgeModal";
import { checkout } from "@/services/payment.service";
import { loadSnapScript, payWithSnap } from "@/shared/utils/snap";
import { PaymentIntent } from "@/entities/payment/payment.entity";

interface Props { event: Event }

export default function VisitorView({ event }: Props) {
  const isOpen = new Date() < new Date(event.registration_deadline);
  const [badgeOpen, setBadgeOpen] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);

  const { data: qr, isLoading: loadingQr } = useApiQuery<MyQr | null>(
    keys.qr.my(event.uuid),
    () => getMyQr(event.uuid),
    { retry: 0 },
  );

  // The event prop already carries every relation from GET /events/me/:uuid
  // (workshops + bookings, tenants, rundowns, speakers, sponsors, contacts) —
  // no per-entity fetches needed. This query is enabled:false and only refetches
  // that same endpoint after a workshop registration so "Anda Sudah Terdaftar"
  // updates without a page reload.
  const { data: liveEvent, refetch: refetchEvent } = useApiQuery<Event>(
    keys.events.me(event.uuid),
    () => getEventByUuidByMe(event.uuid),
    { enabled: false },
  );

  const userRole = liveEvent?.userEventRoles?.[0]?.role ?? event.userEventRoles?.[0]?.role;
  const roleStatus = liveEvent?.userEventRoles?.[0]?.status ?? event.userEventRoles?.[0]?.status;
  const isPending = roleStatus === "PENDING";

  const handleResumePayment = async () => {
    setPaymentBusy(true);
    try {
      const res = await checkout(event.uuid, {});
      if (!res.status || !res.data) {
        throw new Error(res.message || "Gagal membuat transaksi");
      }
      const intent = res.data as unknown as PaymentIntent;
      
      if (intent.snap_token) {
        const ready = await loadSnapScript();
        if (!ready) throw new Error("Gagal memuat Midtrans Snap");
        
        localStorage.setItem("mexpo_payment_redirect", `/dashboard/${event.slug ?? event.uuid}`);
        payWithSnap(intent.snap_token, {
          onSuccess: () => void refetchEvent(),
          onPending: () => void refetchEvent(),
          onError: () => toast.error("Pembayaran gagal"),
          onClose: () => toast.info("Pembayaran belum selesai"),
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan sistem");
    } finally {
      setPaymentBusy(false);
    }
  };

  const overviewContent = <EventOverview event={event} deadlineLabel="Daftar hingga" />;

  const ticketContent = (
    <div className="space-y-6 mt-4">
      <div className="flex flex-col items-center rounded-xl border border-gray-100 bg-white p-6 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          QR Saya universal untuk check-in
        </p>
        {loadingQr ? (
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        ) : qr ? (
<>
            {/* QR image is a data URL — next/image optimization does not apply here. */}
            { }
            <Image src={qr.image} alt="QR Code" width={160} height={160} unoptimized className="h-40 w-40" />
            <p className="mt-3 text-xs text-gray-400 break-all max-w-xs">{qr.code_data}</p>
          </>
        ) : (
          <p className="text-sm text-gray-400">
            QR tersedia setelah kamu terdaftar sebagai visitor event ini.
          </p>
        )}
      </div>
    </div>
  );

  const workshopContent = (
    <div className="mt-4">
      <WorkshopTab
        workshops={liveEvent?.workshops ?? event.workshops ?? []}
        showRegisterButton
        onRefetchWorkshops={() => { void refetchEvent(); }}
      />
    </div>
  );

  const agendaContent = <AgendaTab rundown={event.eventRundowns ?? []} />;
  const speakersContent = <SpeakersTab speakers={event.eventSpeakers ?? []} />;
  const sponsorsContent = <SponsorsTab sponsors={event.eventSponsors ?? []} />;
  const contactsContent = <ContactsTab contactList={event.eventContacts ?? []} />;
  const tenantsContent = <TenantTab tenantData={event.tenants ?? []} />;

  const tabGroups: TabGroup[] = [
{
      id: "overview",
      label: "Ringkasan",
      subTabs: [
        { id: "info", label: "Informasi", icon: Info },
      ],
      content: overviewContent,
    },
    {
      id: "tiket",
      label: "Tiket & Kehadiran",
      subTabs: [
        { id: "qr", label: "QR Saya", icon: QrCode },
      ],
      content: ticketContent,
    },
    {
      id: "lokakarya",
      label: "Lokakarya",
      subTabs: [
        { id: "list", label: "Daftar Lokakarya", icon: BookOpen },
      ],
      content: workshopContent,
    },
    {
      id: "agenda",
      label: "Agenda",
      subTabs: [
        { id: "list", label: "Agenda", icon: CalendarDays },
      ],
      content: agendaContent,
    },
    {
      id: "pembicara",
      label: "Pembicara",
      subTabs: [
        { id: "list", label: "Pembicara", icon: Mic },
      ],
      content: speakersContent,
    },
    {
      id: "sponsor",
      label: "Sponsor",
      subTabs: [
        { id: "list", label: "Sponsor", icon: Handshake },
      ],
      content: sponsorsContent,
    },
    {
      id: "kontak",
      label: "Kontak",
      subTabs: [
        { id: "list", label: "Kontak", icon: Phone },
      ],
      content: contactsContent,
    },
    {
      id: "penyewa",
      label: "Penyewa",
      subTabs: [
        { id: "list", label: "Penyewa", icon: Store },
      ],
      content: tenantsContent,
    }
  ];

  if (isPending) {
    if (userRole === "TENANT") {
      return (
        <PageShell className="py-10 flex items-center justify-center min-h-[60vh]">
          <div className="max-w-md w-full rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
            <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Store className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-amber-900 mb-2">Menunggu Verifikasi Penyewa</h2>
            <p className="text-amber-700 text-sm mb-6">
              Pengajuan Anda sebagai penyewa (tenant) sedang ditinjau oleh manajer event. Silakan cek kembali nanti secara berkala.
            </p>
          </div>
        </PageShell>
      );
    }

    if (userRole === "COMMITTEE") {
      return (
        <PageShell className="py-10 flex items-center justify-center min-h-[60vh]">
          <div className="max-w-md w-full rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
            <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-amber-900 mb-2">Menunggu Persetujuan Panitia</h2>
            <p className="text-amber-700 text-sm mb-6">
              Pengajuan Anda sebagai panitia (committee) sedang ditinjau oleh manajer event.
            </p>
          </div>
        </PageShell>
      );
    }

    return (
      <PageShell className="py-10 flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-amber-900 mb-2">Menunggu Pembayaran</h2>
          <p className="text-amber-700 text-sm mb-6">
            Kamu sudah terdaftar di <strong>{event.name}</strong>, tapi pembayaran tiket belum selesai. Silakan selesaikan pembayaran untuk mengakses dashboard event.
          </p>
          <button
            onClick={handleResumePayment}
            disabled={paymentBusy}
            className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 px-6 py-3 rounded-xl font-semibold text-white transition-colors"
          >
            {paymentBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
            Selesaikan Pembayaran
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="py-10">
{/* "?"? Hero "?"? */}
      <EventHero event={event} roleLabel="Pengunjung" roleIcon={User} roleBadge={getRoleBadge("VISITOR")} />

      {/* "?"? Actions "?"? */}
      <div className="flex flex-wrap items-center gap-2 mb-8 justify-end">
        {isOpen ? (
          <ViewAction href={`/event/${event.slug ?? event.uuid}/register`} variant="primary">
            <UserPlus className="w-4 h-4" /> Daftar
          </ViewAction>
        ) : (
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-medium text-gray-400">
            Registrasi ditutup
          </span>
        )}
        <ViewAction onClick={() => setBadgeOpen(true)} variant="secondary">
          <IdCard className="w-4 h-4 text-secondary" /> ID Badge
        </ViewAction>
        <ViewAction href={`/dashboard/${event.slug ?? event.uuid}/certificates`} variant="secondary">
          <Award className="w-4 h-4 text-amber-500" /> Sertifikat
        </ViewAction>
      </div>

      {/* "?"? Tabs Content "?"? */}
      <DashboardTabs groups={tabGroups} />

      {/* ID Badge popup (PDF) — replaces the old /dashboard/[uuid]/badge page. */}
      <BadgeModal event={event} open={badgeOpen} onClose={() => setBadgeOpen(false)} />
    </PageShell>
  );
}
