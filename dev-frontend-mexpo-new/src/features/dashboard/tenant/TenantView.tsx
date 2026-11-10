"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Loader2,
  ScanLine,
  Store,
  Package,
  Receipt,
  Users,
  IdCard,
  TrendingUp,
  BarChart3,
  FileText,
  Sparkles,
} from "lucide-react";

import { Event } from "@/entities/event/event.entity";
import { Tenant } from "@/entities/event/tenant.entity";
import EventHero from "@/features/dashboard/shared/EventHero";
import EventOverview from "@/features/dashboard/shared/EventOverview";
import ViewAction from "@/features/dashboard/shared/ViewAction";
import { getRoleBadge } from "@/shared/utils/role-badge";
import DashboardSidebarLayout, {
  SidebarTabGroup,
} from "@/features/dashboard/shared/DashboardSidebarLayout";
import PageShell from "@/shared/components/ui/PageShell";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { getMyTenants } from "@/services/event-data.service";
import { ProfileTab } from "@/features/dashboard/portal/tabs/ProfileTab";
import { ProductsTab } from "@/features/dashboard/portal/tabs/ProductsTab";
import { TeamTab } from "@/features/dashboard/portal/tabs/TeamTab";
import { TransactionsTab } from "@/features/dashboard/portal/tabs/TransactionsTab";
import { TenantReportsTab } from "@/features/dashboard/portal/tabs/TenantReportsTab";
import { BadgeModal } from "@/features/dashboard/badge/BadgeModal";
import BoothCheckInPage from "@/features/dashboard/booth/BoothCheckInPage";
import TenantSalesOverview from "./TenantSalesOverview";

interface Props {
  event: Event;
}

export default function TenantView({ event }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [badgeOpen, setBadgeOpen] = useState(false);

  // Helper to determine the group id from a subtab id
  const getGroupId = useCallback((tabId: string): string => {
    if (["sales", "laporan", "info"].includes(tabId)) return "analitik";
    if (["profil", "produk", "tim"].includes(tabId)) return "kelola";
    if (["pos", "scan"].includes(tabId)) return "transaksi";
    return "analitik";
  }, []);

  // Initialize with "sales" to guarantee identical HTML between Server (SSR) and Client during hydration
  const [activeTabKey, setActiveTabKey] = useState<string>("sales");

  const handleTabChange = useCallback((groupId: string, subTabId: string) => {
    setActiveTabKey(subTabId);
    try {
      localStorage.setItem(`mexpo:tenant-tab:${event.uuid}`, subTabId);
      const params = new URLSearchParams(window.location.search);
      params.set("tab", subTabId);
      window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    } catch {
      // ignore
    }
  }, [event.uuid, pathname]);

  // Sync tab state after client mount (avoids SSR hydration mismatch with localStorage/searchParams)
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) {
      setActiveTabKey(tabFromUrl);
      return;
    }
    try {
      const saved = localStorage.getItem(`mexpo:tenant-tab:${event.uuid}`);
      if (saved && saved !== "sales") {
        setActiveTabKey(saved);
      }
    } catch {
      // ignore
    }
  }, [searchParams, event.uuid]);

  // Fetch the tenant list ONCE here so every tab reuses the same data
  const { data: myTenants, isLoading } = useApiQuery(
    keys.tenants.mine({ event: event.uuid }),
    () => getMyTenants(event.uuid),
  );
  const tenant = myTenants?.[0];
  const tenantId = tenant?.uuid ?? "";

  const overviewContent = <EventOverview event={event} />;

  const sidebarGroups: SidebarTabGroup[] = [
    {
      id: "analitik",
      label: "Ringkasan & Penjualan",
      subTabs: [
        {
          id: "sales",
          label: "Penjualan & Performa",
          icon: TrendingUp,
          content: (
            <TenantSalesOverview
              event={event}
              tenantId={tenantId}
              onNavigateToTab={(tab) => handleTabChange(getGroupId(tab), tab)}
            />
          ),
        },
        {
          id: "laporan",
          label: "Laporan Ekspor",
          icon: BarChart3,
          content: (
            <TenantReportsTab eventId={event.uuid} tenantId={tenantId} />
          ),
        },
        {
          id: "info",
          label: "Informasi Event",
          icon: FileText,
          content: overviewContent,
        },
      ],
    },
    {
      id: "kelola",
      label: "Kelola Booth",
      subTabs: [
        {
          id: "profil",
          label: "Profil Penyewa",
          icon: Store,
          content: (
            <TenantTabContent
              tenant={tenant}
              tenantId={tenantId}
              isLoading={isLoading}
              activeTab="profil"
            />
          ),
        },
        {
          id: "produk",
          label: "Katalog Produk",
          icon: Package,
          content: (
            <TenantTabContent
              tenantId={tenantId}
              isLoading={isLoading}
              activeTab="produk"
            />
          ),
        },
        {
          id: "tim",
          label: "Tim Penyewa",
          icon: Users,
          content: (
            <TenantTabContent
              tenantId={tenantId}
              isLoading={isLoading}
              activeTab="tim"
            />
          ),
        },
      ],
    },
    {
      id: "transaksi",
      label: "Transaksi & Operasional",
      subTabs: [
        {
          id: "pos",
          label: "Transaksi (POS)",
          icon: Receipt,
          content: (
            <TenantTabContent
              tenantId={tenantId}
              isLoading={isLoading}
              activeTab="transaksi"
            />
          ),
        },
        {
          id: "scan",
          label: "Scan Pengunjung",
          icon: ScanLine,
          content: <BoothCheckInPage event={event} />,
        },
      ],
    },
  ];

  const sidebarHeader = (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-secondary flex items-center justify-center shrink-0">
          <Store className="w-5 h-5 text-secondary" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Portal Tenant
          </p>
          <h3 className="text-sm font-bold text-gray-900 truncate">
            {tenant?.name || "Booth Tenant"}
          </h3>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-secondary border border-blue-100">
          Penyewa Booth
        </span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 truncate max-w-[140px]">
          {event.name}
        </span>
      </div>
    </div>
  );

  const sidebarFooter = (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setBadgeOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100/80 text-teal-800 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
      >
        <IdCard className="w-4 h-4 text-teal-700" />
        <span>Cetak ID Badge Tenant</span>
      </button>
    </div>
  );

  return (
    <>
      <DashboardSidebarLayout
        groups={sidebarGroups}
        activeGroupId={getGroupId(activeTabKey)}
        activeSubTabId={activeTabKey}
        onTabChange={handleTabChange}
        sidebarHeader={sidebarHeader}
        sidebarFooter={sidebarFooter}
        backHref="/dashboard"
        backLabel="Kembali ke Dashboard"
        topHeader={
          <EventHero
            event={event}
            roleLabel="Penyewa"
            roleIcon={Store}
            roleBadge={getRoleBadge("TENANT")}
          />
        }
      />

      {/* ── ID Badge Modal ── */}
      <BadgeModal
        event={event}
        open={badgeOpen}
        onClose={() => setBadgeOpen(false)}
        role="TENANT"
      />
    </>
  );
}

/** Presentational tenant-tab content — data is hoisted into TenantView. */
function TenantTabContent({
  tenant,
  tenantId,
  isLoading,
  activeTab,
}: {
  tenant?: Tenant;
  tenantId: string;
  isLoading: boolean;
  activeTab: "profil" | "produk" | "tim" | "transaksi";
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="mx-auto px-4 py-16 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
        Kamu belum terdaftar sebagai penyewa yang disetujui di event ini.
      </div>
    );
  }

  return (
    <div className="py-2">
      {activeTab === "profil" && <ProfileTab tenantId={tenantId} tenant={tenant} />}
      {activeTab === "produk" && <ProductsTab tenantId={tenantId} />}
      {activeTab === "tim" && <TeamTab tenantId={tenantId} />}
      {activeTab === "transaksi" && <TransactionsTab tenantId={tenantId} />}
    </div>
  );
}
