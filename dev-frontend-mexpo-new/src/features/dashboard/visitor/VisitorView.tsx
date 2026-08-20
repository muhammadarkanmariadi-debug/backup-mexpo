"use client";

import { useState } from "react";

import { Loader2, Award, IdCard, User, UserPlus, BookOpen, CalendarDays, Mic, Handshake, Phone, Store } from "lucide-react";

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

interface Props { event: Event }

export default function VisitorView({ event }: Props) {
  const isOpen = new Date() < new Date(event.registration_deadline);
  const [badgeOpen, setBadgeOpen] = useState(false);

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
