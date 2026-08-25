import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, FileSpreadsheet } from "lucide-react";

import SearchBar from "@/shared/components/form/SearchBar";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { Event } from "@/entities/event/event.entity";
import { Tenant, TenantStatus } from "@/entities/event/tenant.entity";
import { useApiMutation } from "@/lib/hooks/useApi";
import { getEventTenants } from "@/services/event-data.service";
import { verifyTenant, bulkImportTenants, BulkTenantItem } from "@/services/tenant.service";
import { useList } from "@/shared/hooks/useList";
import { APPROVAL_STATUS_LABELS, labelFor } from "@/shared/data/labels";
import LoadingState from "@/shared/components/ui/LoadingState";
import EmptyState from "@/shared/components/ui/EmptyState";
import Button from "@/shared/components/button/Button";
import BulkImportModal, { BulkColumnDef } from "@/shared/components/ui/BulkImportModal";

interface Props {
  event: Event;
}

const TENANT_TABS = ["", "PENDING", "APPROVED", "REJECTED"] as const;

const TENANT_IMPORT_COLUMNS: BulkColumnDef[] = [
  { key: "name", label: "Nama Tenant/Booth", required: true, placeholder: "Contoh: Telkom Coffee" },
  { key: "email", label: "Email PIC", required: true, type: "email", placeholder: "pic@contoh.com" },
  { key: "pic_name", label: "Nama PIC", placeholder: "Nama lengkap penanggung jawab" },
  { key: "phone", label: "No Telepon", placeholder: "08123456789" },
  { key: "booth_number", label: "No Booth", placeholder: "A-01" },
  { key: "description", label: "Deskripsi", placeholder: "Deskripsi booth atau produk" },
];

const TENANT_SAMPLE_DATA = [
  {
    "Nama Tenant/Booth": "Kopi Nusantara",
    "Email PIC": "pic.kopi@example.com",
    "Nama PIC": "Hendra Pratama",
    "No Telepon": "081234567890",
    "No Booth": "A-01",
    "Deskripsi": "Stand aneka kopi khas nusantara",
  },
  {
    "Nama Tenant/Booth": "Tech Innovate",
    "Email PIC": "contact@techinnovate.id",
    "Nama PIC": "Rina Wijaya",
    "No Telepon": "089876543210",
    "No Booth": "B-05",
    "Deskripsi": "Pameran produk IoT dan Robotics",
  },
];

function tabLabel(tab: string) {
  return tab === "" ? "Semua" : labelFor(APPROVAL_STATUS_LABELS, tab, tab);
}

export function TenantsTab({ event }: Props) {
  const [isImportOpen, setIsImportOpen] = useState(false);
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
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${(tenants.filters.status || "") === t ? "bg-secondary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {tabLabel(t)}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="xs"
            startIcon={<FileSpreadsheet className="h-4 w-4" />}
            onClick={() => setIsImportOpen(true)}
          >
            Import Excel
          </Button>
          <div className="w-full sm:w-64">
            <SearchBar search={tenants.search} setSearch={tenants.applySearch} placeholder="Cari penyewa..." />
          </div>
        </div>
      </div>
      
      {tenants.loading ? (
        <LoadingState type="skeleton-list" count={4} className="py-4" />
      ) : tenants.items.length === 0 ? (
        <EmptyState title="Tidak ada penyewa." />
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

      <BulkImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Massal Penyewa & Booth"
        description="Upload data penyewa/booth. Akun PIC otomatis dibuatkan akun aktif dengan password default pass1234 dan ditugaskan sebagai Owner Tenant."
        templateFilename={`template_tenant_${event.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.xlsx`}
        columns={TENANT_IMPORT_COLUMNS}
        sampleData={TENANT_SAMPLE_DATA}
        onConfirm={async (rows) => {
          return await bulkImportTenants(
            event.uuid,
            rows as unknown as BulkTenantItem[],
          );
        }}
        onSuccess={() => {
          tenants.refetch();
        }}
      />
    </div>
  );
}

