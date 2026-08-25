"use client";

import { useMemo, useState } from "react";

import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

import Input from "@/shared/components/form/Input";
import SearchBar from "@/shared/components/form/SearchBar";
import Button from "@/shared/components/button/Button";
import PageHeader from "@/shared/components/ui/PageHeader";
import PageShell from "@/shared/components/ui/PageShell";

import LoadingState from "@/shared/components/ui/LoadingState";
import Image from "next/image";
import EmptyState from "@/shared/components/ui/EmptyState";
import { Modal } from "@/shared/components/ui/Modal";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { useConfirm } from "@/shared/components/ui/ConfirmDialog";
import { Event } from "@/entities/event/event.entity";
import { Workshop } from "@/entities/event/workshop.entity";
import { EventSpeaker } from "@/entities/event/speaker.entity";
import {
  getWorkshops,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  attachWorkshopSpeaker,
  WorkshopPayload,
} from "@/services/workshop.service";
import { getSpeakers } from "@/services/event-content.service";
import { useList } from "@/shared/hooks/useList";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import SortMenu from "@/shared/components/ui/SortMenu";
import SearchableSelect from "@/shared/components/form/SearchableSelect";
import { WorkshopCard } from "./components/WorkshopCard";

function toLocalInputValue(dateString?: string): string {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const EMPTY: WorkshopPayload = {
  title: "",
  description: "",
  location: "",
  start_time: "",
  end_time: "",
  quota: 0,
  is_public: true,
};

export default function WorkshopsManager({ event }: { event: Event }) {
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkshopPayload>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [speakerModalOpen, setSpeakerModalOpen] = useState(false);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState("");
  const [viewSpeakersWorkshop, setViewSpeakersWorkshop] = useState<Workshop | null>(null);

  const { confirm, dialogs } = useConfirm();

  const list = useList<Workshop>((q) => getWorkshops(event.uuid, q), [event.uuid]);

  // Exclude speakers already attached to the selected workshop so the picker
  // can't trigger a duplicate --/Conflict-- "Speaker already set" error.
  const attachedSpeakerIds = useMemo(() => {
    const w = list.items.find((i) => i.uuid === selectedWorkshopId);
    return new Set((w?.workshopSpeakers ?? []).map((s) => s.speaker_id));
  }, [list.items, selectedWorkshopId]);

  const { data: speakers } = useApiQuery<EventSpeaker[]>(
    keys.content.speakers(event.uuid),
    () => getSpeakers(event.uuid),
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload: WorkshopPayload = {
        title: form.title,
        description: form.description,
        location: form.location,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        quota: Number(form.quota) || 0,
        is_public: form.is_public,
      };
      const res = editingId
        ? await updateWorkshop(editingId, payload)
        : await createWorkshop(event.uuid, payload);
      if (!res.status) throw new Error();
      toast.success(editingId ? "Lokakarya diperbarui." : "Lokakarya ditambahkan.");
      setForm(EMPTY);
      setEditingId(null);
      setIsModalOpen(false);
      list.refetch();
    } catch {
      toast.error("Gagal menyimpan lokakarya.");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (w: Workshop) => {
    setEditingId(w.uuid);
    setForm({
      title: w.title,
      description: w.description,
      location: w.location,
      start_time: toLocalInputValue(w.start_time),
      end_time: toLocalInputValue(w.end_time),
      quota: w.quota,
      is_public: w.is_public,
    });
    setIsModalOpen(true);
  };

  const remove = async (w: Workshop) => {
    if (deletingId) return; // prevent double-delete while a delete is in flight
    if (!(await confirm(`Hapus lokakarya "${w.title}"?`))) return;
    setDeletingId(w.uuid);
    try {
      const res = await deleteWorkshop(w.uuid);
      if (!res.status) {
        toast.error("Gagal menghapus lokakarya.");
        return;
      }
      toast.success("Lokakarya dihapus.");
      list.refetch();
    } finally {
      setDeletingId(null);
    }
  };

  const attachSpeaker = (workshopId: string) => {
    setSelectedWorkshopId(workshopId);
    setSelectedSpeakerId("");
    setSpeakerModalOpen(true);
  };

  const submitSpeaker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkshopId || !selectedSpeakerId) return;
    setBusy(true);
    const res = await attachWorkshopSpeaker(selectedWorkshopId, selectedSpeakerId);
    setBusy(false);
    if (!res.status) {
      console.log(res)
      toast.error(res.message);
      return; 
    }
    toast.success("Pembicara ditambahkan.");
    setSpeakerModalOpen(false);
    list.refetch();
  };

  return (
    <PageShell className="py-8">
      <PageHeader
        title="Kelola Lokakarya"
        subtitle={event.name}
        action={
          <Button size="xs" startIcon={<Plus className="h-4 w-4" />} onClick={() => setIsModalOpen(true)}>
            Tambah Lokakarya
          </Button>
        }
      />

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY); }} title={editingId ? "Edit Lokakarya" : "Tambah Lokakarya"} maxWidth="max-w-2xl">
        <form onSubmit={submit} className="space-y-4">
          <Input label="Judul" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Deskripsi" type="text-area" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Lokasi" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Mulai" type="datetime-local" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            <Input label="Selesai" type="datetime-local" required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            <Input label="Kuota (0 = tak terbatas)" type="number" min="0" value={String(form.quota ?? 0)} onChange={(e) => setForm({ ...form, quota: Number(e.target.value) || 0 })} />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} className="h-4 w-4 accent-brand-500" />
              Publik
            </label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              size="xs"
              disabled={busy}
              startIcon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            >
              {editingId ? "Simpan" : "Tambah"}
            </Button>
            <Button type="button" size="xs" variant="outline" onClick={() => { setIsModalOpen(false); setEditingId(null); setForm(EMPTY); }}>
              Batal
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={speakerModalOpen} onClose={() => setSpeakerModalOpen(false)} title="Pilih Pembicara" maxWidth="max-w-md">
        <form onSubmit={submitSpeaker} className="space-y-4">
          <div>
       

            <SearchableSelect
              label="Pilih Pembicara"
            
              value={selectedSpeakerId}
              onChange={(value) => setSelectedSpeakerId(value)}
              options={(speakers ?? [])
                .filter((s) => !attachedSpeakerIds.has(s.uuid))
                .map((s) => ({
                  label: s.name,
                  value: s.uuid,
                }))}
              emptyText={
                attachedSpeakerIds.size > 0
                  ? "Semua pembicara sudah ditambahkan ke lokakarya ini."
                  : "Tidak ada pembicara tersedia."
              }
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              size="xs"
              disabled={busy || !selectedSpeakerId}
              startIcon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            >
              Tambahkan
            </Button>
            <Button type="button" size="xs" variant="outline" onClick={() => setSpeakerModalOpen(false)}>
              Batal
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!viewSpeakersWorkshop} onClose={() => setViewSpeakersWorkshop(null)} title="Pembicara Lokakarya" maxWidth="max-w-lg">
        {viewSpeakersWorkshop ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900">{viewSpeakersWorkshop.title}</p>
            {viewSpeakersWorkshop.workshopSpeakers?.length > 0 ? (
              <div className="space-y-3">
                {viewSpeakersWorkshop.workshopSpeakers.map((link) => {
                  const sp = link.event_speaker;
                  return (
                    <div key={link.uuid} className="flex items-start gap-3 rounded-xl border border-gray-100 p-3">
                      {sp?.photo ? (
                         
                        <Image src={sp.photo} alt={sp.name} width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-500">
                          {(sp?.name ?? "P")[0]}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{sp?.name ?? "Pembicara"}</p>
                        {sp?.bio && (
                          <p className="mt-0.5 text-gray-500 text-xs leading-relaxed line-clamp-3">{sp.bio}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-gray-500">Belum ada pembicara untuk lokakarya ini.</p>
            )}
          </div>
        ) : null}
      </Modal>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
        <div className="min-w-[200px] flex-1">
          <SearchBar search={list.search} setSearch={list.applySearch} placeholder="Cari lokakarya..." />
        </div>
        <SortMenu
          options={[
            { key: "title", label: "Judul" },
            { key: "start_time", label: "Waktu" },
            { key: "created_at", label: "Dibuat" },
          ]}
          sortBy={list.sortBy}
          sortDir={list.sortDir}
          onChange={list.applySort}
        />
      </div>

      <div className="relative">
        {list.loading ? (
          <LoadingState type="skeleton-list" count={4} className="py-4" />
        ) : list.items.length === 0 ? (
          <EmptyState title="Belum ada lokakarya." className="py-8" />
        ) : (
          <>
            <div className="space-y-3">
              {list.items.map((w) => (
                <WorkshopCard
                  key={w.uuid}
                  w={w}
                  speakers={speakers ?? []}
                  deletingId={deletingId}
                  busy={busy}
                  onAttachSpeaker={attachSpeaker}
                  onViewSpeakers={setViewSpeakersWorkshop}
                  onEdit={startEdit}
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

        {/* Refetch overlay: shown while searching / changing pages / refreshing
            after a mutation, without hiding the existing list. */}
        {list.fetching && list.items.length > 0 && (
          <div className="absolute inset-0 z-10 flex items-start justify-center rounded-xl bg-white/50 pt-8">
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-secondary" />
              Memuat ulang&hellip;
            </div>
          </div>
        )}
      </div>

      {dialogs}
    </PageShell>
  );
}
