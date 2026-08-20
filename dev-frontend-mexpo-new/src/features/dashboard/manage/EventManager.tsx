"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CalendarClock,
  Handshake,
  Phone,
  Mic,
  Plus,
  Loader2,
} from "lucide-react";

import Input from "@/shared/components/form/Input";
import SearchBar from "@/shared/components/form/SearchBar";
import Image from "next/image";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import PageHeader from "@/shared/components/ui/PageHeader";
import SegmentedTabs from "@/shared/components/ui/SegmentedTabs";
import PageShell from "@/shared/components/ui/PageShell";
import SectionTitle from "@/shared/components/ui/SectionTitle";
import EmptyState from "@/shared/components/ui/EmptyState";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";
import RowActions, { editAction, deleteAction } from "@/shared/components/ui/RowActions";
import FormActions from "@/shared/components/ui/FormActions";
import Badge from "@/shared/components/ui/Badge";
import { useConfirm } from "@/shared/components/ui/ConfirmDialog";
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
import { useList } from "@/shared/hooks/useList";
import { SPONSOR_LEVEL_LABELS, labelFor } from "@/shared/data/labels";

const SPONSOR_LEVELS: SponsorLevel[] = ["PLATINUM", "GOLD", "SILVER", "BRONZE"];

type Tab = "rundown" | "sponsors" | "contacts" | "speakers";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "rundown", label: "Susunan Acara", icon: CalendarClock },
  { key: "sponsors", label: "Sponsor", icon: Handshake },
  { key: "contacts", label: "Kontak", icon: Phone },
  { key: "speakers", label: "Pembicara", icon: Mic },
];

export default function EventManager({ event }: { event: Event }) {
  const [tab, setTab] = useState<Tab>("rundown");

  return (
    <PageShell className="py-8">
      <PageHeader title="Kelola Konten Event" subtitle={event.name} />

      <SegmentedTabs<Tab>
        items={TABS.map(({ key, label, icon }) => ({ id: key, label, icon }))}
        value={tab}
        onChange={setTab}
        className="mb-8"
      />

      {tab === "rundown" && <RundownSection eventId={event.uuid} />}
      {tab === "sponsors" && <SponsorsSection eventId={event.uuid} />}
      {tab === "contacts" && <ContactsSection eventId={event.uuid} />}
      {tab === "speakers" && <SpeakersSection eventId={event.uuid} />}
    </PageShell>
  );
}

// ============================================================
// Shared small pieces
// ============================================================

function AddAction({ onAdd, adding }: { onAdd: () => void; adding: boolean }) {
  return (
    <button
      onClick={onAdd}
      disabled={adding}
      className="inline-flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 disabled:opacity-50 px-3 py-1.5 rounded-lg font-semibold text-white text-xs transition-colors"
    >
      {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
      Tambah
    </button>
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

export function RundownSection({ eventId }: { eventId: string }) {
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

  const { confirm, dialogs } = useConfirm();

  const handleDelete = async (item: EventRundown) => {
    if (!(await confirm(`Hapus rundown "${item.title}"?`))) return;
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

  if (list.loading) return <LoadingSpinner className="py-16" />;

  return (
    <div>
      <SectionTitle title="Rundown / Agenda" action={<AddAction onAdd={() => { setEditing(null); setShowForm(true); }} adding={busy} />} />

      {dialogs}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white mb-6 p-5 border border-gray-100 rounded-xl">
          <Input label="Judul" type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Deskripsi" type="text-area" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="gap-4 grid grid-cols-1 sm:grid-cols-2">
            <Input label="Mulai" type="datetime-local" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            <Input label="Selesai" type="datetime-local" required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
          </div>
          <FormActions busy={busy} onCancel={resetForm} />
        </form>
      )}

      <div className="mb-4 rounded-xl border border-gray-100 bg-white p-3">
        <SearchBar search={list.search} setSearch={list.applySearch} placeholder="Cari agenda..." />
      </div>

      {list.items.length === 0 ? (
        <EmptyState title="Belum ada rundown." className="rounded-xl border border-gray-100 bg-white py-8" />
      ) : (
        <>
          <div className="space-y-2">
            {list.items.map((item) => (
              <div key={item.uuid} className="flex items-start gap-4 bg-white p-4 border border-gray-100 rounded-xl">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-0.5 text-gray-500 text-xs">
                    {toLocalInputValue(item.start_time).replace("T", " ") ?? ""} â€“ {toLocalInputValue(item.end_time).replace("T", " ") ?? ""}
                  </p>
                  {item.description && (
                    <p className="mt-1 text-gray-600 text-sm line-clamp-2">{item.description}</p>
                  )}
                </div>
                <RowActions actions={[editAction(() => startEdit(item)), deleteAction(() => handleDelete(item))]} busy={busy} />
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

export function SponsorsSection({ eventId }: { eventId: string }) {
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

  const { confirm, dialogs } = useConfirm();

  const handleDelete = async (item: EventSponsor) => {
    if (!(await confirm(`Hapus sponsor "${item.name}"?`))) return;
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

  if (list.loading) return <LoadingSpinner className="py-16" />;

  return (
    <div>
      <SectionTitle title="Sponsor" action={<AddAction onAdd={() => { setEditing(null); setShowForm(true); }} adding={busy} />} />

      {dialogs}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white mb-6 p-5 border border-gray-100 rounded-xl">
          <Input label="Nama" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div>
            <label className="block mb-2 font-medium text-gray-700 text-sm">Tingkatan</label>
            <select
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value as SponsorLevel })}
              className="bg-white px-4 py-2.5 border border-gray-300 focus:border-brand-300 rounded-lg focus:outline-hidden focus:ring-brand-500/10 w-full h-11 text-gray-800 text-sm"
            >
              {SPONSOR_LEVELS.map((l) => (
                <option key={l} value={l}>{labelFor(SPONSOR_LEVEL_LABELS, l, l)}</option>
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
          <FormActions busy={busy} onCancel={resetForm} />
        </form>
      )}

      <div className="mb-4 rounded-xl border border-gray-100 bg-white p-3">
        <SearchBar search={list.search} setSearch={list.applySearch} placeholder="Cari sponsor..." />
      </div>

      {list.items.length === 0 ? (
        <EmptyState title="Belum ada sponsor." className="rounded-xl border border-gray-100 bg-white py-8" />
      ) : (
        <>
          <div className="space-y-2">
            {list.items.map((item) => (
              <div key={item.uuid} className="flex items-center gap-4 bg-white p-4 border border-gray-100 rounded-xl">
                {item.logo ? (
                   
                  <Image src={item.logo} alt={item.name} width={48} height={48} className="bg-gray-50 rounded-lg w-12 h-12 object-cover" />
                ) : (
                  <div className="flex justify-center items-center bg-gray-50 rounded-lg w-12 h-12 text-gray-400 text-xs">-</div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                  <Badge tone="info" className="mt-0.5">
                    {labelFor(SPONSOR_LEVEL_LABELS, item.level, "Sponsor")}
                  </Badge>
                </div>
                <RowActions actions={[editAction(() => startEdit(item)), deleteAction(() => handleDelete(item))]} busy={busy} />
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

export function ContactsSection({ eventId }: { eventId: string }) {
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

  const { confirm, dialogs } = useConfirm();

  const handleDelete = async (item: EventContact) => {
    if (!(await confirm(`Hapus kontak "${item.name}"?`))) return;
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

  if (list.loading) return <LoadingSpinner className="py-16" />;

  return (
    <div>
      <SectionTitle title="Kontak" action={<AddAction onAdd={() => { setEditing(null); setShowForm(true); }} adding={busy} />} />

      {dialogs}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white mb-6 p-5 border border-gray-100 rounded-xl">
          <Input label="Nama" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="No. Telepon" type="text" required value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
          <FormActions busy={busy} onCancel={resetForm} />
        </form>
      )}

      <div className="mb-4 rounded-xl border border-gray-100 bg-white p-3">
        <SearchBar search={list.search} setSearch={list.applySearch} placeholder="Cari kontak..." />
      </div>

      {list.items.length === 0 ? (
        <EmptyState title="Belum ada kontak." className="rounded-xl border border-gray-100 bg-white py-8" />
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
                <RowActions actions={[editAction(() => startEdit(item)), deleteAction(() => handleDelete(item))]} busy={busy} />
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

export function SpeakersSection({ eventId }: { eventId: string }) {
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

  const { confirm, dialogs } = useConfirm();

  const handleDelete = async (item: EventSpeaker) => {
    if (!(await confirm(`Hapus pembicara "${item.name}"?`))) return;
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

  if (list.loading) return <LoadingSpinner className="py-16" />;

  return (
    <div>
      <SectionTitle title="Pembicara" action={<AddAction onAdd={() => { setEditing(null); setShowForm(true); }} adding={busy} />} />

      {dialogs}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white mb-6 p-5 border border-gray-100 rounded-xl">
          <Input label="Nama" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Biografi" type="text-area" required value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <div>
            <label className="block mb-2 font-medium text-gray-700 text-sm">Foto</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
              className="block file:bg-gray-100 file:hover:bg-gray-200 file:mr-3 file:px-4 file:py-2 file:border-0 file:rounded-lg w-full text-gray-600 file:text-gray-700 text-sm file:cursor-pointer"
            />
          </div>
          <FormActions busy={busy} onCancel={resetForm} />
        </form>
      )}

      <div className="mb-4 rounded-xl border border-gray-100 bg-white p-3">
        <SearchBar search={list.search} setSearch={list.applySearch} placeholder="Cari pembicara..." />
      </div>

      {list.items.length === 0 ? (
        <EmptyState title="Belum ada pembicara." className="rounded-xl border border-gray-100 bg-white py-8" />
      ) : (
        <>
          <div className="space-y-2">
            {list.items.map((item) => (
              <div key={item.uuid} className="flex items-start gap-4 bg-white p-4 border border-gray-100 rounded-xl">
                {item.photo ? (
                   
                  <Image src={item.photo} alt={item.name} width={48} height={48} className="bg-gray-50 rounded-full w-12 h-12 object-cover" />
                ) : (
                  <div className="flex justify-center items-center bg-gray-50 rounded-full w-12 h-12 text-gray-400 text-xs">-</div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="mt-0.5 text-gray-600 text-sm line-clamp-2">{item.bio}</p>
                </div>
                <RowActions actions={[editAction(() => startEdit(item)), deleteAction(() => handleDelete(item))]} busy={busy} />
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
