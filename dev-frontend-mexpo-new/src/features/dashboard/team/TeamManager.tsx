"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus, FileSpreadsheet } from "lucide-react";

import Input from "@/shared/components/form/Input";
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
  bulkImportEventUsers,
  EventUser,
  BulkEventUserItem,
} from "@/services/event-users.service";
import BulkImportModal, { BulkColumnDef } from "@/shared/components/ui/BulkImportModal";
import { useList } from "@/shared/hooks/useList";
import EmptyState from "@/shared/components/ui/EmptyState";
import { useConfirm } from "@/shared/components/ui/ConfirmDialog";
import PageShell from "@/shared/components/ui/PageShell";
import LoadingState from "@/shared/components/ui/LoadingState";
import { TeamMemberRow } from "./components/TeamMemberRow";
import { TeamFilterBar } from "./components/TeamFilterBar";

const EVENT_USER_IMPORT_COLUMNS: BulkColumnDef[] = [
  { key: "full_name", label: "Nama Lengkap", required: true, placeholder: "Nama lengkap" },
  { key: "email", label: "Email", required: true, type: "email", placeholder: "email@example.com" },
  { key: "phone", label: "No Telepon", placeholder: "08123456789" },
  { key: "organization", label: "Instansi/Organisasi", placeholder: "SMK Telkom Malang" },
  { key: "role", label: "Role di Event", type: "select", options: ["VISITOR", "COMMITTEE"] },
];

const EVENT_USER_SAMPLE_DATA = [
  {
    "Nama Lengkap": "Ahmad Fauzi",
    "Email": "ahmad.fauzi@example.com",
    "No Telepon": "081234567890",
    "Instansi/Organisasi": "SMK Telkom Malang",
    "Role di Event": "VISITOR",
  },
  {
    "Nama Lengkap": "Dewi Lestari",
    "Email": "dewi.lestari@example.com",
    "No Telepon": "089876543210",
    "Instansi/Organisasi": "Alumni",
    "Role di Event": "COMMITTEE",
  },
];

export default function TeamManager({ event }: { event: Event }) {
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const { confirm, dialogs } = useConfirm();

  const list = useList<EventUser>((q) => getEventUsers(event.uuid, { ...q, role: q.role || "OWNER,COMMITTEE" }), [event.uuid]);

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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              startIcon={<FileSpreadsheet className="h-4 w-4" />}
              onClick={() => setIsBulkImportOpen(true)}
            >
              Import Excel
            </Button>
            <Button
              size="xs"
              startIcon={<UserPlus className="h-4 w-4" />}
              onClick={() => setIsModalOpen(true)}
            >
              Tambah Panitia
            </Button>
          </div>
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

      <TeamFilterBar
        search={list.search}
        onSearch={list.applySearch}
        roleFilter={list.filters.role}
        statusFilter={list.filters.status}
        onFilter={list.applyFilter}
        sortBy={list.sortBy}
        sortDir={list.sortDir}
        onSort={list.applySort}
      />

      {list.loading ? (
        <LoadingState type="skeleton-list" count={4} className="py-4" />
      ) : list.items.length === 0 ? (
        <EmptyState title="Belum ada anggota terdaftar." className="py-8" />
      ) : (
        <>
          <div className="space-y-2">
            {list.items.map((m) => (
              <TeamMemberRow
                key={m.uuid}
                m={m}
                busy={busy}
                onChangeRole={changeRole}
                onDecide={decide}
                onRemove={remove}
              />
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

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        title="Import Massal Peserta & Panitia Event"
        description="Upload data peserta atau panitia event. Pengguna baru otomatis dibuatkan akun aktif dengan password default pass1234."
        templateFilename={`template_peserta_${event.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.xlsx`}
        columns={EVENT_USER_IMPORT_COLUMNS}
        sampleData={EVENT_USER_SAMPLE_DATA}
        onConfirm={async (rows) => {
          return await bulkImportEventUsers(
            event.uuid,
            rows as unknown as BulkEventUserItem[],
          );
        }}
        onSuccess={() => {
          list.refetch();
        }}
      />

      {dialogs}
    </PageShell>
  );
}