"use client";

import { useState } from "react";
import { Loader2, ScanLine, Store, Package, Receipt, Users, IdCard } from "lucide-react";
import { Event } from "@/entities/event/event.entity";
import EventHero from "@/features/dashboard/shared/EventHero";
import EventOverview from "@/features/dashboard/shared/EventOverview";
import ViewAction from "@/features/dashboard/shared/ViewAction";
import { getRoleBadge } from "@/shared/utils/role-badge";
import DashboardTabs, { TabGroup } from "@/features/dashboard/shared/DashboardTabs";
import PageShell from "@/shared/components/ui/PageShell";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { getMyTenants } from "@/services/event-data.service";
import { ProfileTab } from "@/features/dashboard/portal/tabs/ProfileTab";
import { ProductsTab } from "@/features/dashboard/portal/tabs/ProductsTab";
import { TeamTab } from "@/features/dashboard/portal/tabs/TeamTab";
import { TransactionsTab } from "@/features/dashboard/portal/tabs/TransactionsTab";
import { BadgeModal } from "@/features/dashboard/badge/BadgeModal";

import BoothCheckInPage from "@/features/dashboard/booth/BoothCheckInPage";

interface Props { event: Event }

export default function TenantView({ event }: Props) {
  const [badgeOpen, setBadgeOpen] = useState(false);

  // Fetch the tenant list ONCE here so every tab reuses the same data
  // instead of firing an independent query per tab (previously 4×).
  const { data: myTenants, isLoading } = useApiQuery(
    keys.tenants.mine({ event: event.uuid }),
    () => getMyTenants(event.uuid),
  );
  const tenantId = myTenants?.[0]?.uuid ?? "";

  const overviewContent = <EventOverview event={event} />;

  const tabGroups: TabGroup[] = [
    {
      id: "overview",
      label: "Ringkasan",
      subTabs: [
        { id: "info", label: "Informasi" },
      ],
      content: overviewContent,
    },
    {
      id: "kelola",
      label: "Kelola Booth",
      subTabs: [
        { id: "profil", label: "Profil Penyewa", icon: Store, content: <TenantTabContent tenantId={tenantId} isLoading={isLoading} activeTab="profil" /> },
        { id: "produk", label: "Produk", icon: Package, content: <TenantTabContent tenantId={tenantId} isLoading={isLoading} activeTab="produk" /> },
        { id: "tim", label: "Tim Penyewa", icon: Users, content: <TenantTabContent tenantId={tenantId} isLoading={isLoading} activeTab="tim" /> },
      ],
    },
    {
      id: "transaksi",
      label: "Transaksi & Operasional",
      subTabs: [
        { id: "pos", label: "Transaksi (POS)", icon: Receipt, content: <TenantTabContent tenantId={tenantId} isLoading={isLoading} activeTab="transaksi" /> },
        { id: "scan", label: "Scan Pengunjung", icon: ScanLine, content: <BoothCheckInPage event={event} /> },
      ]
    }
  ];

  return (
    <PageShell className="py-10">
      {/* ── Hero ── */}
      <EventHero event={event} roleLabel="Penyewa" roleIcon={Store} roleBadge={getRoleBadge("TENANT")} />

      {/* ── Actions ── */}
      <div className="flex flex-wrap items-center gap-2 mb-8 justify-end">
        <ViewAction onClick={() => setBadgeOpen(true)} variant="secondary">
          <IdCard className="w-4 h-4 text-teal-600" /> ID Badge
        </ViewAction>
      </div>

      {/* ── Tabs Content ── */}
      <DashboardTabs groups={tabGroups} />

      {/* ── ID Badge Modal ── */}
      <BadgeModal event={event} open={badgeOpen} onClose={() => setBadgeOpen(false)} role="TENANT" />
    </PageShell>
  );
}

/** Presentational tenant-tab content — data is hoisted into TenantView. */
function TenantTabContent({
  tenantId,
  isLoading,
  activeTab,
}: {
  tenantId: string;
  isLoading: boolean;
  activeTab: "profil" | "produk" | "tim" | "transaksi";
}) {
  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-teal-600 animate-spin" /></div>;
  }

  if (!tenantId) {
    return <div className="mx-auto px-4 py-16 text-center text-gray-500">Kamu belum terdaftar sebagai penyewa yang disetujui di event ini.</div>;
  }

  return (
    <div className="py-4">
      {activeTab === "profil" && <ProfileTab tenantId={tenantId} />}
      {activeTab === "produk" && <ProductsTab tenantId={tenantId} />}
      {activeTab === "tim" && <TeamTab tenantId={tenantId} />}
      {activeTab === "transaksi" && <TransactionsTab tenantId={tenantId} />}
    </div>
  );
}