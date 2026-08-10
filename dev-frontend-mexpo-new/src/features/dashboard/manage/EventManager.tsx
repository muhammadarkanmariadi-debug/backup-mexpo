"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CalendarClock,
  Handshake,
  Phone,
  Mic,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Save,
} from "lucide-react";

import Input from "@/shared/components/form/Input";
import SearchBar from "@/shared/components/form/SearchBar";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { Event } from "@/entities/event/event.entity";
import { EventRundown } from "@/entities/event/rundown.entity";
import { EventSponsor, SponsorLevel } from "@/entities/event/sponsor.entity";
import { EventContact } from "@/entities/event/contact.entity";
import { EventSpeaker } from "@/entities/event/speaker.entity";
import {
  getRundowns,
  createRundown,
  updateRundown,
  deleteRundown,
  getSponsors,
  createSponsor,
  updateSponsor,
  deleteSponsor,
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  getSpeakers,
  createSpeaker,
  updateSpeaker,
  deleteSpeaker,
} from "@/services/event-content.service";
import BackLink from "@/features/dashboard/shared/BackLink";
import { useList } from "@/features/dashboard/shared/useList";

const SPONSOR_LEVELS: SponsorLevel[] = ["PLATINUM", "GOLD", "SILVER", "BRONZE"];

type Tab = "rundown" | "sponsors" | "contacts" | "speakers";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "rundown", label: "Rundown", icon: CalendarClock },
  { key: "sponsors", label: "Sponsors", icon: Handshake },
  { key: "contacts", label: "Contacts", icon: Phone },
  { key: "speakers", label: "Speakers", icon: Mic },
];

export default function EventManager({ event }: { event: Event }) {
  const [tab, setTab] = useState<Tab>("rundown");

  return (
    <div className="mx-auto px-4 py-8 max-w-7xl">
      <BackLink href={`/dashboard/${event.slug ?? event.uuid}`} />
      <h1 className="mb-1 font-bold text-gray-900 text-2xl">Kelola Konten Event</h1>
      <p className="mb-6 text-gray-500 text-sm">{event.name}</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === key
                ? "bg-secondary text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "rundown" && <RundownSection eventId={event.uuid} />}
      {tab === "sponsors" && <SponsorsSection eventId={event.uuid} />}
      {tab === "contacts" && <ContactsSection eventId={event.uuid} />}
      {tab === "speakers" && <SpeakersSection eventId={event.uuid} />}
    </div>
  );
}

// ============================================================
// Shared small pieces
// ============================================================

function SectionTitle({ title, onAdd, adding }: { title: string; onAdd: () => void; adding: boolean }) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="font-bold text-gray-900 text-lg">{title}</h2>
      <button
        onClick={onAdd}
        disabled={adding}
        className="inline-flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 disabled:opacity-50 px-3 py-1.5 rounded-lg font-semibold text-white text-xs transition-colors"
      >
        {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        Tambah
      </button>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="bg-white p-8 border border-gray-100 rounded-xl text-gray-500 text-sm text-center">
      {text}
    </div>
  );
}

function RowActions({
  onEdit,
  onDelete,
  busy,
}: {
  onEdit: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        onClick={onEdit}
        disabled={busy}
        className="hover:bg-gray-100 disabled:opacity-50 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={onDelete}
        disabled={busy}
        className="hover:bg-red-50 disabled:opacity-50 p-1.5 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function FormButtons({ busy, onCancel }: { busy: boolean; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold text-white text-xs transition-colors"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Simpan
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 hover:bg-gray-100 px-3 py-2 rounded-lg font-semibold text-gray-500 text-xs transition-colors"
      >
        <X className="w-3.5 h-3.5" /> Batal
      </button>
    </div>
  );
}

// ============================================================
// Rundown
// ============================================================

function toLocalInputValue(dateString?: string): string {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function RundownSection({ eventId }: { eventId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventRundown | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", start_time: "", end_time: "" });

  const list = useList<EventRundown>((q) => getRundowns(eventId, q), [eventId]);

  const resetForm = () => {
    setForm({ title: "", description: "", start_time: "", end_time: "" });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
      };
      const res = editing
        ? await updateRundown(editing.uuid, payload)
        : await createRundown(eventId, payload);
      if (!res.status) throw new Error();
      toast.success(editing ? "Rundown diperbarui." : "Rundown ditambahkan.");
      resetForm();
      list.refetch();
    } catch {
      toast.error("Gagal menyimpan rundown.");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (item: EventRundown) => {
    setEditing(item);
    setShowForm(true);
    setForm({
      title: item.title,
      description: item.description,
      start_time: toLocalInputValue(item.start_time),
      end_time: toLocalInputValue(item.end_time),
    });
  };

  const handleDelete = async (item: EventRundown) => {
    if (!confirm(`Hapus rundown "${item.title}"?`)) return;
    setBusy(true);
    try {
      const res = await deleteRundown(item.uuid);
      if (!res.status) throw new Error();
      toast.success("Rundown dihapus.");
      list.refetch();
    } catch {
      toast.error("Gagal menghapus rundown.");
    } finally {
      setBusy(false);
    }
  };

  if (list.loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-secondary animate-spin" /></div>;

  return (
    <div>
      <SectionTitle title="Rundown / Agenda" onAdd={() => { setEditing(null); setShowForm(true); }} adding={busy} />

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white mb-6 p-5 border border-gray-100 rounded-xl">
          <Input label="Judul" type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Deskripsi" type="text-area" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="gap-4 grid grid-cols-1 sm:grid-cols-2">
            <Input label="Mulai" type="datetime-local" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            <Input label="Selesai" type="datetime-local" required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
          </div>
          <FormButtons busy={busy} onCancel={resetForm} />
        </form>
      )}

      <div className="mb-4 rounded-xl border border-gray-100 bg-white p-3">
        <SearchBar search={list.search} setSearch={list.applySearch} placeholder="Cari agenda..." />
      </div>

      {list.items.length === 0 ? (
        <EmptyBox text="Belum ada rundown." />
      ) : (
        <>
          <div className="space-y-2">
            {list.items.map((item) => (
              <div key={item.uuid} className="flex items-start gap-4 bg-white p-4 border border-gray-100 rounded-xl">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-0.5 text-gray-500 text-xs">
                    {toLocalInputValue(item.start_time).replace("T", " ") ?? ""} – {toLocalInputValue(item.end_time).replace("T", " ") ?? ""}
                  </p>
                  {item.description && (
                    <p className="mt-1 text-gray-600 text-sm line-clamp-2">{item.description}</p>
                  )}
                </div>
                <RowActions onEdit={() => startEdit(item)} onDelete={() => handleDelete(item)} busy={busy} />
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

// ============================================================
// Sponsors
// ============================================================

function SponsorsSection({ eventId }: { eventId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventSponsor | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{ name: string; level: SponsorLevel; file: File | null }>({
    name: "",
    level: "GOLD",
    file: null,
  });

  const list = useList<EventSponsor>((q) => getSponsors(eventId, q), [eventId]);

  const resetForm = () => {
    setForm({ name: "", level: "GOLD", file: null });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { name: form.name, level: form.level };
      const res = editing
        ? await updateSponsor(editing.uuid, payload, form.file)
        : await createSponsor(eventId, payload, form.file);
      if (!res.status) throw new Error();
      toast.success(editing ? "Sponsor diperbarui." : "Sponsor ditambahkan.");
      resetForm();
      list.refetch();
    } catch {
      toast.error("Gagal menyimpan sponsor.");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (item: EventSponsor) => {
    setEditing(item);
    setShowForm(true);
    setForm({ name: item.name, level: item.level || "GOLD", file: null });
  };

  const handleDelete = async (item: EventSponsor) => {
    if (!confirm(`Hapus sponsor "${item.name}"?`)) return;
    setBusy(true);
    try {
      const res = await deleteSponsor(item.uuid);
      if (!res.status) throw new Error();
      toast.success("Sponsor dihapus.");
      list.refetch();
    } catch {
      toast.error("Gagal menghapus sponsor.");
    } finally {
      setBusy(false);
    }
  };

  if (list.loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-secondary animate-spin" /></div>;

  return (
    <div>
      <SectionTitle title="Sponsor" onAdd={() => { setEditing(null); setShowForm(true); }} adding={busy} />

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white mb-6 p-5 border border-gray-100 rounded-xl">
          <Input label="Nama" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div>
            <label className="block mb-2 font-medium text-gray-700 text-sm">Level</label>
            <select
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value as SponsorLevel })}
              className="bg-white px-4 py-2.5 border border-gray-300 focus:border-brand-300 rounded-lg focus:outline-hidden focus:ring-brand-500/10 w-full h-11 text-gray-800 text-sm"
            >
              {SPONSOR_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2 font-medium text-gray-700 text-sm">Logo</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
              className="block file:bg-gray-100 file:hover:bg-gray-200 file:mr-3 file:px-4 file:py-2 file:border-0 file:rounded-lg w-full text-gray-600 file:text-gray-700 text-sm file:cursor-pointer"
            />
          </div>
          <FormButtons busy={busy} onCancel={resetForm} />
        </form>
      )}

      <div className="mb-4 rounded-xl border border-gray-100 bg-white p-3">
        <SearchBar search={list.search} setSearch={list.applySearch} placeholder="Cari sponsor..." />
      </div>

      {list.items.length === 0 ? (
        <EmptyBox text="Belum ada sponsor." />
      ) : (
        <>
          <div className="space-y-2">
            {list.items.map((item) => (
              <div key={item.uuid} className="flex items-center gap-4 bg-white p-4 border border-gray-100 rounded-xl">
                {item.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.logo} alt={item.name} className="bg-gray-50 rounded-lg w-12 h-12 object-cover" />
                ) : (
                  <div className="flex justify-center items-center bg-gray-50 rounded-lg w-12 h-12 text-gray-400 text-xs">-</div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                  <span className="inline-block bg-blue-50 mt-0.5 px-2 py-0.5 rounded-full font-medium text-[11px] text-blue-700">
                    {item.level || "Sponsor"}
                  </span>
                </div>
                <RowActions onEdit={() => startEdit(item)} onDelete={() => handleDelete(item)} busy={busy} />
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

// ============================================================
// Contacts
// ============================================================

function ContactsSection({ eventId }: { eventId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventContact | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone_number: "" });

  const list = useList<EventContact>((q) => getContacts(eventId, q), [eventId]);

  const resetForm = () => {
    setForm({ name: "", email: "", phone_number: "" });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = editing
        ? await updateContact(editing.uuid, form)
        : await createContact(eventId, form);
      if (!res.status) throw new Error();
      toast.success(editing ? "Kontak diperbarui." : "Kontak ditambahkan.");
      resetForm();
      list.refetch();
    } catch {
      toast.error("Gagal menyimpan kontak.");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (item: EventContact) => {
    setEditing(item);
    setShowForm(true);
    setForm({ name: item.name, email: item.email, phone_number: item.phone_number });
  };

  const handleDelete = async (item: EventContact) => {
    if (!confirm(`Hapus kontak "${item.name}"?`)) return;
    setBusy(true);
    try {
      const res = await deleteContact(item.uuid);
      if (!res.status) throw new Error();
      toast.success("Kontak dihapus.");
      list.refetch();
    } catch {
      toast.error("Gagal menghapus kontak.");
    } finally {
      setBusy(false);
    }
  };

  if (list.loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-secondary animate-spin" /></div>;

  return (
    <div>
      <SectionTitle title="Kontak" onAdd={() => { setEditing(null); setShowForm(true); }} adding={busy} />

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white mb-6 p-5 border border-gray-100 rounded-xl">
          <Input label="Nama" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="No. Telepon" type="text" required value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
          <FormButtons busy={busy} onCancel={resetForm} />
        </form>
      )}

      <div className="mb-4 rounded-xl border border-gray-100 bg-white p-3">
        <SearchBar search={list.search} setSearch={list.applySearch} placeholder="Cari kontak..." />
      </div>

      {list.items.length === 0 ? (
        <EmptyBox text="Belum ada kontak." />
      ) : (
        <>
          <div className="space-y-2">
            {list.items.map((item) => (
              <div key={item.uuid} className="flex items-start gap-4 bg-white p-4 border border-gray-100 rounded-xl">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="mt-0.5 text-gray-600 text-sm">{item.email}</p>
                  <p className="text-gray-500 text-sm">{item.phone_number}</p>
                </div>
                <RowActions onEdit={() => startEdit(item)} onDelete={() => handleDelete(item)} busy={busy} />
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

// ============================================================
// Speakers
// ============================================================

function SpeakersSection({ eventId }: { eventId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventSpeaker | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{ name: string; bio: string; file: File | null }>({
    name: "",
    bio: "",
    file: null,
  });

  const list = useList<EventSpeaker>((q) => getSpeakers(eventId, q), [eventId]);

  const resetForm = () => {
    setForm({ name: "", bio: "", file: null });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { name: form.name, bio: form.bio };
      const res = editing
        ? await updateSpeaker(editing.uuid, payload, form.file)
        : await createSpeaker(eventId, payload, form.file);
      if (!res.status) throw new Error();
      toast.success(editing ? "Pembicara diperbarui." : "Pembicara ditambahkan.");
      resetForm();
      list.refetch();
    } catch {
      toast.error("Gagal menyimpan pembicara.");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (item: EventSpeaker) => {
    setEditing(item);
    setShowForm(true);
    setForm({ name: item.name, bio: item.bio, file: null });
  };

  const handleDelete = async (item: EventSpeaker) => {
    if (!confirm(`Hapus pembicara "${item.name}"?`)) return;
    setBusy(true);
    try {
      const res = await deleteSpeaker(item.uuid);
      if (!res.status) throw new Error();
      toast.success("Pembicara dihapus.");
      list.refetch();
    } catch {
      toast.error("Gagal menghapus pembicara.");
    } finally {
      setBusy(false);
    }
  };

  if (list.loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-secondary animate-spin" /></div>;

  return (
    <div>
      <SectionTitle title="Pembicara" onAdd={() => { setEditing(null); setShowForm(true); }} adding={busy} />

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white mb-6 p-5 border border-gray-100 rounded-xl">
          <Input label="Nama" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Bio" type="text-area" required value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <div>
            <label className="block mb-2 font-medium text-gray-700 text-sm">Foto</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
              className="block file:bg-gray-100 file:hover:bg-gray-200 file:mr-3 file:px-4 file:py-2 file:border-0 file:rounded-lg w-full text-gray-600 file:text-gray-700 text-sm file:cursor-pointer"
            />
          </div>
          <FormButtons busy={busy} onCancel={resetForm} />
        </form>
      )}

      <div className="mb-4 rounded-xl border border-gray-100 bg-white p-3">
        <SearchBar search={list.search} setSearch={list.applySearch} placeholder="Cari pembicara..." />
      </div>

      {list.items.length === 0 ? (
        <EmptyBox text="Belum ada pembicara." />
      ) : (
        <>
          <div className="space-y-2">
            {list.items.map((item) => (
              <div key={item.uuid} className="flex items-start gap-4 bg-white p-4 border border-gray-100 rounded-xl">
                {item.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.photo} alt={item.name} className="bg-gray-50 rounded-full w-12 h-12 object-cover" />
                ) : (
                  <div className="flex justify-center items-center bg-gray-50 rounded-full w-12 h-12 text-gray-400 text-xs">-</div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="mt-0.5 text-gray-600 text-sm line-clamp-2">{item.bio}</p>
                </div>
                <RowActions onEdit={() => startEdit(item)} onDelete={() => handleDelete(item)} busy={busy} />
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
