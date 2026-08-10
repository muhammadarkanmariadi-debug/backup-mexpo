"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Loader2, Plus, Pencil, Trash2, UserPlus } from "lucide-react";

import Input from "@/shared/components/form/Input";
import SearchBar from "@/shared/components/form/SearchBar";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { Event } from "@/entities/event/event.entity";
import { Workshop } from "@/entities/event/workshop.entity";
import { EventSpeaker } from "@/entities/event/speaker.entity";
import {
  getWorkshops,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  attachWorkshopSpeaker,
  removeWorkshopSpeaker,
  WorkshopPayload,
} from "@/services/workshop.service";
import { getSpeakers } from "@/services/event-content.service";
import BackLink from "@/features/dashboard/shared/BackLink";
import { useList } from "@/features/dashboard/shared/useList";
import SortMenu from "@/shared/components/ui/SortMenu";

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
  const [speakers, setSpeakers] = useState<EventSpeaker[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<WorkshopPayload>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);

  const list = useList<Workshop>((q) => getWorkshops(event.uuid, q), [event.uuid]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getSpeakers(event.uuid);
        if (!cancelled) setSpeakers(res.data ?? []);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [event.uuid]);

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
      toast.success(editingId ? "Workshop diperbarui." : "Workshop ditambahkan.");
      setForm(EMPTY);
      setEditingId(null);
      list.refetch();
    } catch {
      toast.error("Gagal menyimpan workshop.");
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
  };

  const remove = async (w: Workshop) => {
    if (!confirm(`Hapus workshop "${w.title}"?`)) return;
    const res = await deleteWorkshop(w.uuid);
    if (!res.status) {
      toast.error("Gagal menghapus workshop.");
      return;
    }
    toast.success("Workshop dihapus.");
    list.refetch();
  };

  const attachSpeaker = async (workshopId: string) => {
    const speakerId = prompt("Tempel UUID speaker untuk workshop ini");
    if (!speakerId) return;
    const res = await attachWorkshopSpeaker(workshopId, speakerId.trim());
    if (!res.status) {
      toast.error("Gagal menambahkan speaker.");
      return;
    }
    toast.success("Speaker ditambahkan.");
    list.refetch();
  };

  const detachSpeaker = async (linkId: string) => {
    if (!confirm("Lepaskan speaker dari workshop ini?")) return;
    const res = await removeWorkshopSpeaker(linkId);
    if (!res.status) {
      toast.error("Gagal melepas speaker.");
      return;
    }
    toast.success("Speaker dilepas.");
    list.refetch();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <BackLink href={`/dashboard/${event.slug ?? event.uuid}`} />
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Kelola Workshop</h1>
      <p className="mb-6 text-sm text-gray-500">{event.name}</p>

      <form onSubmit={submit} className="mb-6 space-y-3 rounded-xl border border-gray-100 bg-white p-5">
        <h3 className="font-semibold text-gray-900">{editingId ? "Edit Workshop" : "Tambah Workshop"}</h3>
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
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary/80 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {editingId ? "Simpan" : "Tambah"}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY); }} className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100">
              Batal
            </button>
          )}
        </div>
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
        <div className="min-w-[200px] flex-1">
          <SearchBar search={list.search} setSearch={list.applySearch} placeholder="Cari workshop..." />
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

      {list.loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-secondary" />
        </div>
      ) : list.items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">Belum ada workshop.</p>
      ) : (
        <>
          <div className="space-y-3">
            {list.items.map((w) => (
              <div key={w.uuid} className="rounded-xl border border-gray-100 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-secondary">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{w.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(w.start_time).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      {" – "}
                      {new Date(w.end_time).toLocaleString("id-ID", { timeStyle: "short" })}
                      {" · "}
                      {w.location} · kuota {w.quota > 0 ? w.quota : "∞"}
                    </p>
                  </div>
                  <button onClick={() => attachSpeaker(w.uuid)} disabled={speakers.length === 0} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                    <UserPlus className="h-3.5 w-3.5" /> Speaker
                  </button>
                  <button onClick={() => startEdit(w)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(w)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600" title="Hapus">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {w.workshopSpeakers && w.workshopSpeakers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {w.workshopSpeakers.map((s) => (
                      <span key={s.uuid} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                        {s.event_speaker?.name ?? "Speaker"}
                        <button onClick={() => detachSpeaker(s.uuid)} className="hover:text-red-600" title="Lepas">×</button>
                      </span>
                    ))}
                  </div>
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
    </div>
  );
}