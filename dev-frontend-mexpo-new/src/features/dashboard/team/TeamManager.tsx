"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, UserPlus, XCircle } from "lucide-react";

import Input from "@/shared/components/form/Input";
import SearchBar from "@/shared/components/form/SearchBar";
import Button from "@/shared/components/button/Button";
import PageHeader from "@/shared/components/ui/PageHeader";
import { Modal } from "@/shared/components/ui/Modal";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { Event } from "@/entities/event/event.entity";
import {
  getEventUsers,
  addCommitteeMember,
  verifyEventUser,
  changeEventUserRole,
  removeEventUser,
  EventUser,
} from "@/services/event-users.service";
import { useList } from "@/shared/hooks/useList";
import RoleBadge from "@/shared/components/ui/RoleBadge";
import SortMenu from "@/shared/components/ui/SortMenu";
import Badge from "@/shared/components/ui/Badge";
import RowActions, { deleteAction } from "@/shared/components/ui/RowActions";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";
import EmptyState from "@/shared/components/ui/EmptyState";
import { useConfirm } from "@/shared/components/ui/ConfirmDialog";
import PageShell from "@/shared/components/ui/PageShell";
import { APPROVAL_STATUS_LABELS, ROLE_LABELS, labelFor } from "@/shared/data/labels";

const ROLES = ["OWNER", "COMMITTEE", "TENANT", "VISITOR"] as const;
const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export default function TeamManager({ event }: { event: Event }) {
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { confirm, dialogs } = useConfirm();

  const list = useList<EventUser>((q) => getEventUsers(event.uuid, q), [event.uuid]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await addCommitteeMember(event.uuid, email.trim());
      if (!res.status) throw new Error();
      toast.success("Panitia ditambahkan.");
      setEmail("");
      setIsModalOpen(false);
      list.refetch();
      list.applySearch("");
    } catch {
      toast.error("Gagal menambahkan panitia.");
    } finally {
      setBusy(false);
    }
  };

  const decide = async (m: EventUser, status: "APPROVED" | "REJECTED") => {
    const res = await verifyEventUser(m.uuid, status);
    if (!res.status) {
      toast.error("Gagal memperbarui status.");
      return;
    }
    toast.success(status === "APPROVED" ? "Disetujui." : "Ditolak.");
    list.refetch();
  };

  const changeRole = async (m: EventUser, role: EventUser["role"]) => {
    const res = await changeEventUserRole(m.uuid, role);
    if (!res.status) {
      toast.error("Gagal mengubah peran.");
      return;
    }
    toast.success("Peran diubah.");
    list.refetch();
  };

  const remove = async (m: EventUser) => {
    if (!(await confirm(`Hapus ${m.user?.full_name} dari event?`))) return;
    const res = await removeEventUser(m.uuid);
    if (!res.status) {
      toast.error("Gagal menghapus anggota.");
      return;
    }
    toast.success("Anggota dihapus.");
    list.refetch();
  };

  return (
<PageShell className="py-8">
<PageHeader
        title="Tim & Panitia"
        subtitle={event.name}
        action={
          <Button size="xs" startIcon={<UserPlus className="h-4 w-4" />} onClick={() => setIsModalOpen(true)}>
            Tambah
          </Button>
        }
      />

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEmail(""); }} title="Tambah Panitia" maxWidth="max-w-md">
        <form onSubmit={add} className="flex flex-col gap-4">
          <Input label="Email panitia" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="panitia@example.com" />
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={busy} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-white hover:bg-secondary/80 disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Tambah
            </button>
            <button type="button" onClick={() => { setIsModalOpen(false); setEmail(""); }} className="rounded-lg px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-100 flex-1">
              Batal
            </button>
          </div>
        </form>
      </Modal>

      <div className="mb-4 space-y-3 rounded-xl border border-gray-100 bg-white p-4">
        <SearchBar search={list.search} setSearch={list.applySearch} placeholder="Cari nama/email..." />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Role:</span>
          <button onClick={() => list.applyFilter("role", "")} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${!list.filters.role ? "bg-secondary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Semua</button>
          {ROLES.map((r) => (
            <button key={r} onClick={() => list.applyFilter("role", r)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${list.filters.role === r ? "bg-secondary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {labelFor(ROLE_LABELS, r, r)}
            </button>
          ))}
          <span className="ml-2 text-xs font-medium text-gray-500">Status:</span>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => list.applyFilter("status", s)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${list.filters.status === s ? "bg-secondary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {labelFor(APPROVAL_STATUS_LABELS, s, s)}
            </button>
          ))}
          <span className="ml-2 inline-flex items-center">
            <SortMenu
              options={[
                { key: "full_name", label: "Nama" },
                { key: "role", label: "Peran" },
                { key: "created_at", label: "Terdaftar" },
              ]}
              sortBy={list.sortBy}
              sortDir={list.sortDir}
              onChange={list.applySort}
            />
          </span>
        </div>
      </div>

      {list.loading ? (
        <LoadingSpinner className="py-10" />
      ) : list.items.length === 0 ? (
        <EmptyState title="Belum ada anggota terdaftar." className="py-8" />
      ) : (
        <>
          <div className="space-y-2">
            {list.items.map((m) => (
              <div key={m.uuid} className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3">
                {m.user?.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.user.photo} alt={m.user.full_name} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    {(m.user?.full_name ?? "?")[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900 text-sm">{m.user?.full_name}</p>
                  <p className="truncate text-xs text-gray-500">{m.user?.email}</p>
                </div>
                <RoleBadge role={m.role} />
                {m.status === "PENDING" ? (
                  <Badge tone="warning">Menunggu</Badge>
                ) : (
                  <Badge tone="success">{labelFor(APPROVAL_STATUS_LABELS, m.status, m.status)}</Badge>
                )}

                {m.role !== "OWNER" && (
                  <>
                    <select
                      value={m.role}
                      onChange={(e) => changeRole(m, e.target.value as EventUser["role"])}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-600"
                    >
                      <option value="COMMITTEE">Panitia</option>
                      <option value="VISITOR">Pengunjung</option>
                      <option value="TENANT">Penyewa</option>
                    </select>
                    {m.status === "PENDING" && (
                      <>
                        <button onClick={() => decide(m, "APPROVED")} className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-green-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Setujui
                        </button>
                        <button onClick={() => decide(m, "REJECTED")} className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                          <XCircle className="h-3.5 w-3.5" /> Tolak
                        </button>
                      </>
                    )}
                    <RowActions actions={[deleteAction(() => remove(m))]} busy={busy} />
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <DataPagination
              currentPage={list.page}
              totalPages={list.totalPages}
              itemsPerPage={list.pageSize}
              totalItems={list.total}
              onPageChange={list.setPage}
              onItemsPerPageChange={(size) => { list.setPageSize(size); list.setPage(1); }}
            />
          </div>
        </>
      )}

      {dialogs}
    </PageShell>
  );
}