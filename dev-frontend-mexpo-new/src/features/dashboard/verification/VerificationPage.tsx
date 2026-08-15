"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import SearchBar from "@/shared/components/form/SearchBar";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import PageHeader from "@/shared/components/ui/PageHeader";
import PageShell from "@/shared/components/ui/PageShell";
import { Event } from "@/entities/event/event.entity";
import { Tenant, TenantStatus } from "@/entities/event/tenant.entity";
import { useApiMutation } from "@/lib/hooks/useApi";
import { getEventTenants } from "@/services/event-data.service";
import { getEventUsers, verifyEventUser, EventUser } from "@/services/event-users.service";
import { verifyTenant } from "@/services/tenant.service";
import { useList } from "@/shared/hooks/useList";
import { APPROVAL_STATUS_LABELS, ROLE_LABELS, labelFor } from "@/shared/data/labels";

interface Props {
  event: Event;
}

const REQUEST_TABS = ["", "PENDING", "APPROVED", "REJECTED"] as const;
const TENANT_TABS = ["", "PENDING", "APPROVED", "REJECTED"] as const;

function tabLabel(tab: string) {
  return tab === "" ? "Semua" : labelFor(APPROVAL_STATUS_LABELS, tab, tab);
}

function TenantsTab({ event }: Props) {
  const tenants = useList<Tenant>(
    (q) => getEventTenants(event.uuid, q),
    [event.uuid],
  );

  const decideTenant = useApiMutation(
    (args: { t: Tenant; status: TenantStatus }) =>
      verifyTenant(args.t.uuid, args.status),
    {
      successMessage: "",
      errorMessage: "",
      notify: toast,
      onSuccess: (_data, { status }) => {
        toast.success(
          status === "APPROVED" ? "Penyewa disetujui." : "Penyewa ditolak.",
        );
        tenants.refetch();
      },
      onError: () => toast.error("Gagal memperbarui status penyewa."),
    },
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TENANT_TABS.map((t) => (
          <button
            key={t}
            onClick={() => tenants.applyFilter("status", t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${tenants.filters.status === t ? "bg-secondary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {tabLabel(t)}
          </button>
        ))}
        <div className="ml-auto w-full sm:w-64">
          <SearchBar search={tenants.search} setSearch={tenants.applySearch} placeholder="Cari penyewa..." />
        </div>
      </div>
      
      {tenants.loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-5 h-5 text-secondary animate-spin" />
        </div>
      ) : tenants.items.length === 0 ? (
        <p className="py-8 text-center text-gray-500 text-sm bg-white rounded-xl border border-gray-100">Tidak ada penyewa.</p>
      ) : (
        <div className="mb-6">
          <div className="space-y-3">
            {tenants.items.map((t) => (
              <div key={t.uuid} className="flex items-center gap-3 bg-white px-4 py-3 border border-gray-100 rounded-xl transition-shadow hover:shadow-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {t.email || "-"} • {labelFor(APPROVAL_STATUS_LABELS, t.status, t.status)}
                  </p>
                </div>
                {t.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => decideTenant.mutate({ t, status: "APPROVED" })}
                      disabled={decideTenant.isPending}
                      className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Setujui
                    </button>
                    <button
                      onClick={() => decideTenant.mutate({ t, status: "REJECTED" })}
                      disabled={decideTenant.isPending}
                      className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Tolak
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
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
    </div>
  );
}

function UsersTab({ event }: Props) {
  const requests = useList<EventUser>(
    (q) => getEventUsers(event.uuid, q),
    [event.uuid],
  );

  const decideUser = useApiMutation(
    (args: { u: EventUser; status: "APPROVED" | "REJECTED" }) =>
      verifyEventUser(args.u.uuid, args.status),
    {
      successMessage: "",
      errorMessage: "",
      notify: toast,
      onSuccess: (_data, { status }) => {
        toast.success(
          status === "APPROVED" ? "Permintaan disetujui." : "Permintaan ditolak.",
        );
        requests.refetch();
      },
      onError: () => toast.error("Gagal memperbarui status."),
    },
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {REQUEST_TABS.map((t) => (
          <button
            key={t}
            onClick={() => requests.applyFilter("status", t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${requests.filters.status === t ? "bg-secondary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
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
        <p className="py-8 text-center text-gray-500 text-sm bg-white rounded-xl border border-gray-100">Tidak ada permintaan.</p>
      ) : (
        <>
          <div className="space-y-3">
            {requests.items.map((u) => (
              <div key={u.uuid} className="flex items-center gap-3 bg-white px-4 py-3 border border-gray-100 rounded-xl transition-shadow hover:shadow-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{u.user?.full_name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {u.user?.email} • {labelFor(ROLE_LABELS, u.role, u.role)} • {labelFor(APPROVAL_STATUS_LABELS, u.status, u.status)}
                  </p>
                </div>
                {u.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => decideUser.mutate({ u, status: "APPROVED" })}
                      disabled={decideUser.isPending}
                      className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Setujui
                    </button>
                    <button
                      onClick={() => decideUser.mutate({ u, status: "REJECTED" })}
                      disabled={decideUser.isPending}
                      className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Tolak
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
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

export default function VerificationPage({ event }: Props) {
  const [activeTab, setActiveTab] = useState<"TENANT" | "USER">("TENANT");

  return (
    <PageShell className="py-8">
      <PageHeader title="Verifikasi" subtitle={event.name} />

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("TENANT")}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === "TENANT"
                ? "border-secondary text-secondary"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Penyewa
          </button>
          <button
            onClick={() => setActiveTab("USER")}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === "USER"
                ? "border-secondary text-secondary"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Tim & Panitia
          </button>
        </nav>
      </div>

      <div>
        {activeTab === "TENANT" && <TenantsTab event={event} />}
        {activeTab === "USER" && <UsersTab event={event} />}
      </div>
    </PageShell>
  );
}
