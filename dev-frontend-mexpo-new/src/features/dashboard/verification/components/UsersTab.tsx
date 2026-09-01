import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, FileSpreadsheet, Mail, Loader2, Send } from "lucide-react";

import SearchBar from "@/shared/components/form/SearchBar";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { Event } from "@/entities/event/event.entity";
import { useApiMutation } from "@/lib/hooks/useApi";
import {
  getEventUsers,
  verifyEventUser,
  bulkImportEventUsers,
  resendTicketEmail,
  broadcastTicketEmails,
  EventUser,
  BulkEventUserItem,
} from "@/services/event-users.service";
import { useList } from "@/shared/hooks/useList";
import { APPROVAL_STATUS_LABELS, ROLE_LABELS, labelFor } from "@/shared/data/labels";
import LoadingState from "@/shared/components/ui/LoadingState";
import EmptyState from "@/shared/components/ui/EmptyState";
import Button from "@/shared/components/button/Button";
import BulkImportModal, { BulkColumnDef } from "@/shared/components/ui/BulkImportModal";

interface Props {
  event: Event;
}

const REQUEST_TABS = ["", "PENDING", "APPROVED", "REJECTED"] as const;

const VISITOR_IMPORT_COLUMNS: BulkColumnDef[] = [
  { key: "full_name", label: "Nama Lengkap", required: true, placeholder: "Nama lengkap" },
  { key: "email", label: "Email", required: true, type: "email", placeholder: "email@example.com" },
  { key: "phone", label: "No Telepon", placeholder: "08123456789" },
  { key: "organization", label: "Instansi/Organisasi", placeholder: "SMK Telkom Malang" },
];

const VISITOR_SAMPLE_DATA = [
  {
    "Nama Lengkap": "Ahmad Fauzi",
    "Email": "ahmad.fauzi@example.com",
    "No Telepon": "081234567890",
    "Instansi/Organisasi": "SMK Telkom Malang",
  },
  {
    "Nama Lengkap": "Dewi Lestari",
    "Email": "dewi.lestari@example.com",
    "No Telepon": "089876543210",
    "Instansi/Organisasi": "Universitas Brawijaya",
  },
];

function tabLabel(tab: string) {
  return tab === "" ? "Semua" : labelFor(APPROVAL_STATUS_LABELS, tab, tab);
}

export function UsersTab({ event }: Props) {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [resendingUserId, setResendingUserId] = useState<string | null>(null);

  const requests = useList<EventUser>(
    (q) => getEventUsers(event.uuid, { ...q, role: "VISITOR" }),
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
          status === "APPROVED"
            ? "Permintaan disetujui & tiket/QR dikirimkan ke email peserta."
            : "Permintaan ditolak.",
        );
        requests.refetch();
      },
      onError: () => toast.error("Gagal memperbarui status."),
    },
  );

  const handleResendTicket = async (u: EventUser) => {
    if (!u.user?.uuid) return;
    try {
      setResendingUserId(u.user.uuid);
      const res = await resendTicketEmail(event.uuid, u.user.uuid);
      if (res?.status) {
        toast.success(`Tiket & QR berhasil dikirim ulang ke ${u.user.email}`);
      } else {
        toast.error(res?.message || "Gagal mengirim ulang email tiket.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengirim ulang tiket.");
    } finally {
      setResendingUserId(null);
    }
  };

  const handleBroadcast = async () => {
    try {
      setIsBroadcasting(true);
      const res = await broadcastTicketEmails(event.uuid, {
        status: "APPROVED",
        role: "VISITOR",
      });
      if (res?.status) {
        toast.success(res?.message || "Broadcast tiket & QR berhasil dikirimkan.");
        setIsBroadcastModalOpen(false);
      } else {
        toast.error(res?.message || "Gagal melakukan broadcast tiket.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat melakukan broadcast tiket.");
    } finally {
      setIsBroadcasting(false);
    }
  };


  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {REQUEST_TABS.map((t) => (
          <button
            key={t}
            onClick={() => requests.applyFilter("status", t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${(requests.filters.status || "") === t ? "bg-secondary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {tabLabel(t)}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="xs"
            startIcon={<Send className="h-4 w-4 text-blue-600" />}
            onClick={() => setIsBroadcastModalOpen(true)}
          >
            Broadcast Tiket
          </Button>
          <Button
            variant="outline"
            size="xs"
            startIcon={<FileSpreadsheet className="h-4 w-4" />}
            onClick={() => setIsImportOpen(true)}
          >
            Import Excel
          </Button>
          <div className="w-full sm:w-64">
            <SearchBar search={requests.search} setSearch={requests.applySearch} placeholder="Cari nama/email..." />
          </div>
        </div>
      </div>
      
      {requests.loading ? (
        <LoadingState type="skeleton-list" count={4} className="py-4" />
      ) : requests.items.length === 0 ? (
        <EmptyState title="Tidak ada permintaan." />
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

                <div className="flex items-center gap-2">
                  {u.status === "APPROVED" && (
                    <button
                      onClick={() => handleResendTicket(u)}
                      disabled={resendingUserId === u.user?.uuid}
                      title="Kirim ulang e-tiket & QR ke email"
                      className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors"
                    >
                      {resendingUserId === u.user?.uuid ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Mail className="w-3.5 h-3.5" />
                      )}
                      Kirim Ulang Tiket
                    </button>
                  )}

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

      {/* Broadcast Confirmation Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Broadcast Tiket & QR</h3>
                <p className="text-xs text-gray-500">Kirim email tiket ke semua peserta terverifikasi</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Sistem akan mengirimkan email konfirmasi e-tiket beserta kode QR check-in kepada seluruh peserta yang berstatus <strong>APPROVED</strong> di event <strong>{event.name}</strong>.
            </p>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsBroadcastModalOpen(false)}
                disabled={isBroadcasting}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleBroadcast}
                disabled={isBroadcasting}
                startIcon={isBroadcasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              >
                {isBroadcasting ? "Mengirim Email..." : "Kirim Broadcast"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <BulkImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Massal Pengunjung / Peserta Event"
        description="Upload data pengunjung untuk event ini. Pengguna baru otomatis dibuatkan akun aktif dengan password default pass1234."
        templateFilename={`template_pengunjung_${event.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.xlsx`}
        columns={VISITOR_IMPORT_COLUMNS}
        sampleData={VISITOR_SAMPLE_DATA}
        onConfirm={async (rows) => {
          return await bulkImportEventUsers(
            event.uuid,
            rows as unknown as BulkEventUserItem[],
          );
        }}
        onSuccess={() => {
          requests.refetch();
        }}
      />
    </div>
  );
}


