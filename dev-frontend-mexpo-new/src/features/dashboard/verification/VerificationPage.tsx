"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import SearchBar from "@/shared/components/form/SearchBar";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { Event } from "@/entities/event/event.entity";
import { Tenant, TenantStatus } from "@/entities/event/tenant.entity";
import { getEventTenants } from "@/services/event-data.service";
import { getEventUsers, verifyEventUser, EventUser } from "@/services/event-users.service";
import { verifyTenant } from "@/services/tenant.service";
import BackLink from "@/features/dashboard/shared/BackLink";
import { useList } from "@/features/dashboard/shared/useList";

interface Props {
  event: Event;
}

const REQUEST_TABS = ["", "PENDING", "APPROVED", "REJECTED"] as const;
const TENANT_TABS = ["", "PENDING", "APPROVED", "REJECTED"] as const;

function tabLabel(tab: string) {
  return tab === "" ? "Semua" : tab.charAt(0) + tab.slice(1).toLowerCase();
}

export default function VerificationPage({ event }: Props) {
  const [busy, setBusy] = useState<string | null>(null);

  const requests = useList<EventUser>(
    (q) => getEventUsers(event.uuid, q),
    [event.uuid],
  );
  const tenants = useList<Tenant>(
    (q) => getEventTenants(event.uuid, q),
    [event.uuid],
  );

  const decideTenant = async (t: Tenant, status: TenantStatus) => {
    setBusy(`t-${t.uuid}`);
    try {
      const res = await verifyTenant(t.uuid, status);
      if (!res.status) throw new Error();
      toast.success(status === "APPROVED" ? "Tenant disetujui." : "Tenant ditolak.");
      tenants.refetch();
      requests.refetch();
    } catch {
      toast.error("Gagal memperbarui status tenant.");
    } finally {
      setBusy(null);
    }
  };

  const decideUser = async (u: EventUser, status: "APPROVED" | "REJECTED") => {
    setBusy(`u-${u.uuid}`);
    try {
      const res = await verifyEventUser(u.uuid, status);
      if (!res.status) throw new Error();
      toast.success(status === "APPROVED" ? "Permintaan disetujui." : "Permintaan ditolak.");
      requests.refetch();
      tenants.refetch();
    } catch {
      toast.error("Gagal memperbarui status.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto px-4 py-8 max-w-7xl">
      <BackLink href={`/dashboard/${event.slug ?? event.uuid}`} />
      <h1 className="mb-1 font-bold text-gray-900 text-2xl">Verifikasi</h1>
      <p className="mb-6 text-gray-500 text-sm">{event.name}</p>

      {/* ── Tenant requests ── */}
      <h2 className="mb-3 font-semibold text-gray-400 text-sm uppercase tracking-wider">Tenant</h2>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {TENANT_TABS.map((t) => (
          <button
            key={t}
            onClick={() => tenants.applyFilter("status", t)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${tenants.filters.status === t ? "bg-secondary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {tabLabel(t)}
          </button>
        ))}
        <div className="ml-auto w-full sm:w-64">
          <SearchBar search={tenants.search} setSearch={tenants.applySearch} placeholder="Cari tenant..." />
        </div>
      </div>
      {tenants.loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-5 h-5 text-secondary animate-spin" />
        </div>
      ) : tenants.items.length === 0 ? (
        <p className="mb-6 text-gray-500 text-sm">Tidak ada tenant.</p>
      ) : (
        <div className="mb-6">
          <div className="space-y-2">
            {tenants.items.map((t) => (
              <div key={t.uuid} className="flex items-center gap-3 bg-white px-4 py-3 border border-gray-100 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">
                    {t.email || "-"} · {t.status}
                  </p>
                </div>
                {t.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => decideTenant(t, "APPROVED")}
                      disabled={busy === `t-${t.uuid}`}
                      className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 px-3 py-1.5 rounded-lg font-semibold text-white text-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                    </button>
                    <button
                      onClick={() => decideTenant(t, "REJECTED")}
                      disabled={busy === `t-${t.uuid}`}
                      className="inline-flex items-center gap-1 bg-white hover:bg-red-50 disabled:opacity-50 px-3 py-1.5 border border-red-200 rounded-lg font-semibold text-red-600 text-xs"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Tolak
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3">
            <DataPagination
              currentPage={tenants.page}
              totalPages={tenants.totalPages}
              itemsPerPage={tenants.pageSize}
              totalItems={tenants.total}
              onPageChange={tenants.setPage}
              onItemsPerPageChange={(size) => { tenants.setPageSize(size); tenants.setPage(1); }}
            />
          </div>
        </div>
      )}

      {/* ── Committee/tenant requests ── */}
      <h2 className="mb-3 font-semibold text-gray-400 text-sm uppercase tracking-wider">Permintaan committee/tenant</h2>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {REQUEST_TABS.map((t) => (
          <button
            key={t}
            onClick={() => requests.applyFilter("status", t)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${requests.filters.status === t ? "bg-secondary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {tabLabel(t)}
          </button>
        ))}
        <div className="ml-auto w-full sm:w-64">
          <SearchBar search={requests.search} setSearch={requests.applySearch} placeholder="Cari nama/email..." />
        </div>
      </div>
      {requests.loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-5 h-5 text-secondary animate-spin" />
        </div>
      ) : requests.items.length === 0 ? (
        <p className="text-gray-500 text-sm">Tidak ada permintaan.</p>
      ) : (
        <>
          <div className="space-y-2">
            {requests.items.map((u) => (
              <div key={u.uuid} className="flex items-center gap-3 bg-white px-4 py-3 border border-gray-100 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{u.user?.full_name}</p>
                  <p className="text-gray-500 text-xs">
                    {u.user?.email} · {u.role} · {u.status}
                  </p>
                </div>
                {u.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => decideUser(u, "APPROVED")}
                      disabled={busy === `u-${u.uuid}`}
                      className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 px-3 py-1.5 rounded-lg font-semibold text-white text-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                    </button>
                    <button
                      onClick={() => decideUser(u, "REJECTED")}
                      disabled={busy === `u-${u.uuid}`}
                      className="inline-flex items-center gap-1 bg-white hover:bg-red-50 disabled:opacity-50 px-3 py-1.5 border border-red-200 rounded-lg font-semibold text-red-600 text-xs"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Tolak
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3">
            <DataPagination
              currentPage={requests.page}
              totalPages={requests.totalPages}
              itemsPerPage={requests.pageSize}
              totalItems={requests.total}
              onPageChange={requests.setPage}
              onItemsPerPageChange={(size) => { requests.setPageSize(size); requests.setPage(1); }}
            />
          </div>
        </>
      )}
    </div>
  );
}