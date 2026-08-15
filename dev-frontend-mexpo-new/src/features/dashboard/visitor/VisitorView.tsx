"use client";

import { Loader2, Award, IdCard, User, UserPlus } from "lucide-react";

import DashboardTabs, { TabGroup } from "@/features/dashboard/shared/DashboardTabs";
import { Info, QrCode } from "lucide-react";


import { Event } from "@/entities/event/event.entity";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { getMyQr, MyQr } from "@/services/qr.service";
import EventHero from "@/features/dashboard/shared/EventHero";
import EventOverview from "@/features/dashboard/shared/EventOverview";
import ViewAction from "@/features/dashboard/shared/ViewAction";
import { getRoleBadge } from "@/shared/utils/role-badge";
import PageShell from "@/shared/components/ui/PageShell";

interface Props { event: Event }

export default function VisitorView({ event }: Props) {
  const isOpen = new Date() < new Date(event.registration_deadline);

  const { data: qr, isLoading: loadingQr } = useApiQuery<MyQr | null>(
    keys.qr.my(event.uuid),
    () => getMyQr(event.uuid),
    { retry: 0 },
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
    </div>
  );

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
        <ViewAction href={`/dashboard/${event.slug ?? event.uuid}/badge`} variant="secondary">
          <IdCard className="w-4 h-4 text-secondary" /> ID Badge
        </ViewAction>
        <ViewAction href={`/dashboard/${event.slug ?? event.uuid}/certificates`} variant="secondary">
          <Award className="w-4 h-4 text-amber-500" /> Sertifikat
        </ViewAction>
      </div>

      {/* "?"? Tabs Content "?"? */}
      <DashboardTabs groups={tabGroups} />
    </PageShell>
  );
}
