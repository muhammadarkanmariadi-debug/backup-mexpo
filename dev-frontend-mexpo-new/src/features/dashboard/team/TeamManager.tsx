"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

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
  EventUser,
} from "@/services/event-users.service";
import { useList } from "@/shared/hooks/useList";
import EmptyState from "@/shared/components/ui/EmptyState";
import { useConfirm } from "@/shared/components/ui/ConfirmDialog";
import PageShell from "@/shared/components/ui/PageShell";
import LoadingState from "@/shared/components/ui/LoadingState";
import { TeamMemberRow } from "./components/TeamMemberRow";
import { TeamFilterBar } from "./components/TeamFilterBar";

export default function TeamManager({ event }: { event: Event }) {
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      {dialogs}
    </PageShell>
  );
}