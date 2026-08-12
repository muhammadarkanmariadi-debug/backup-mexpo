"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

import Input from "@/shared/components/form/Input";
import SearchBar from "@/shared/components/form/SearchBar";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { useApiMutation, useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { Event, RegistrationField, RegistrationFieldType, TicketType } from "@/entities/event/event.entity";
import {
  getEventTicketTypes,
  createTicketType,
  updateTicketType,
  deleteTicketType,
} from "@/services/ticket.service";
import {
  getEventRegistrationFields,
  createRegistrationField,
  updateRegistrationField,
  deleteRegistrationField,
} from "@/services/registration-field.service";
import BackLink from "@/features/dashboard/shared/BackLink";

const FIELD_TYPES: { value: RegistrationFieldType; label: string }[] = [
  { value: "TEXT", label: "Teks" },
  { value: "TEXTAREA", label: "Textarea" },
  { value: "NUMBER", label: "Angka" },
  { value: "EMAIL", label: "Email" },
  { value: "SELECT", label: "Pilihan" },
  { value: "DATE", label: "Tanggal" },
  { value: "BOOLEAN", label: "Ya/Tidak" },
];

type Tab = "types" | "fields";

export default function RegistrationManager({ event }: { event: Event }) {
  const [tab, setTab] = useState<Tab>(event.ticket_mode === "PAID" ? "types" : "fields");

  return (
    <div className="mx-auto px-4 py-8 max-w-7xl">
      <BackLink href={`/dashboard/${event.slug ?? event.uuid}`} />
      <h1 className="mb-1 font-bold text-gray-900 text-2xl">Atur Registrasi</h1>
      <p className="mb-6 text-gray-500 text-sm">{event.name}</p>

      <div className="flex gap-2 mb-6">
        {event.ticket_mode === "PAID" && (
          <button
            onClick={() => setTab("types")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === "types" ? "bg-secondary text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
          >
            Tiket
          </button>
        )}
        <button
          onClick={() => setTab("fields")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === "fields" ? "bg-secondary text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
        >
          Form Pendaftaran
        </button>
      </div>

      {tab === "types" && event.ticket_mode === "PAID" && (
        <TicketTypesPanel eventId={event.uuid} />
      )}
      {tab === "fields" && <FieldsPanel eventId={event.uuid} />}
    </div>
  );
}

// â”€â”€ Ticket types â”€â”€

function TicketTypesPanel({ eventId }: { eventId: string }) {
  const [form, setForm] = useState({ name: "", price: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { data: items, isLoading: loading } = useApiQuery<TicketType[]>(
    keys.tickets.list(eventId),
    () => getEventTicketTypes(eventId),
  );

  const save = useApiMutation(
    () => {
      const payload = { name: form.name, price: Number(form.price) || 0 };
      return editingId
        ? updateTicketType(editingId, payload)
        : createTicketType(eventId, payload);
    },
    {
      invalidate: [keys.tickets.all(eventId)],
      successMessage: editingId ? "Tiket diperbarui." : "Tiket ditambahkan.",
      errorMessage: "Gagal menyimpan tiket.",
      notify: toast,
      onSuccess: () => {
        setForm({ name: "", price: "" });
        setEditingId(null);
        setPage(1);
      },
    },
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  const startEdit = (t: TicketType) => {
    setEditingId(t.uuid);
    setForm({ name: t.name, price: String(t.price) });
  };

  const remove = useApiMutation((t: TicketType) => deleteTicketType(t.uuid), {
    invalidate: [keys.tickets.all(eventId)],
    successMessage: "Tiket dihapus.",
    errorMessage: "Gagal menghapus tiket.",
    notify: toast,
    onSuccess: () => setPage(1),
  });

  const removeClick = (t: TicketType) => {
    if (!confirm(`Hapus tiket "${t.name}"?`)) return;
    remove.mutate(t);
  };

  const q = search.trim().toLowerCase();
  const filtered = (items ?? []).filter((t) => !q || t.name.toLowerCase().includes(q));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-3 bg-white p-4 border border-gray-100 rounded-xl">
        <h3 className="font-semibold text-gray-900">
          {editingId ? "Edit Tiket" : "Tambah Tiket"}
        </h3>
        <div className="gap-3 grid grid-cols-1 sm:grid-cols-2">
          <Input
            label="Nama"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Contoh: Early Bird"
          />
          <Input
            label="Harga (Rp)"
            type="number"
            min="0"
            required
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="100000"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={save.isPending}
            className="inline-flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold text-white text-sm"
          >
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {editingId ? "Simpan" : "Tambah"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ name: "", price: "" });
              }}
              className="hover:bg-gray-100 px-3 py-2 rounded-lg text-gray-500 text-sm"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      <div className="rounded-xl border border-gray-100 bg-white p-3">
        <SearchBar search={search} setSearch={(v) => { setSearch(v); setPage(1); }} placeholder="Cari tiket..." />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-5 h-5 text-secondary animate-spin" />
        </div>
      ) : (items ?? []).length === 0 ? (
        <p className="py-8 text-gray-500 text-sm text-center">Belum ada tiket.</p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-gray-500 text-sm text-center">Tidak ada tiket yang cocok dengan pencarian.</p>
      ) : (
        <>
          <div className="space-y-2">
            {paged.map((t) => (
              <div key={t.uuid} className="flex items-center gap-3 bg-white px-4 py-3 border border-gray-100 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">Rp {t.price.toLocaleString("id-ID")}</p>
                </div>
                <button onClick={() => startEdit(t)} className="hover:bg-gray-100 p-2 rounded-lg text-gray-400 hover:text-gray-700" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => removeClick(t)} className="hover:bg-red-50 p-2 rounded-lg text-gray-400 hover:text-red-600" title="Hapus">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <DataPagination
              currentPage={page}
              totalPages={totalPages}
              itemsPerPage={PAGE_SIZE}
              totalItems={filtered.length}
              onPageChange={setPage}
              onItemsPerPageChange={() => {}}
              pageSizeOptions={[PAGE_SIZE]}
            />
          </div>
        </>
      )}
    </div>
  );
}

// â”€â”€ Registration fields â”€â”€

const EMPTY_FIELD = {
  field_key: "",
  label: "",
  type: "TEXT" as RegistrationFieldType,
  required: false,
  options: "",
  position: 0,
};

function FieldsPanel({ eventId }: { eventId: string }) {
  const [form, setForm] = useState({ ...EMPTY_FIELD });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [condition, setCondition] = useState({
    enabled: false,
    field_key: "",
    value: "",
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { data: items, isLoading: loading } = useApiQuery<RegistrationField[]>(
    keys.regFields.list(eventId),
    () => getEventRegistrationFields(eventId),
  );

  const save = useApiMutation(
    () => {
      const payload = {
        field_key: form.field_key,
        label: form.label,
        type: form.type,
        required: form.required,
        options: form.type === "SELECT" && form.options ? form.options.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        position: form.position,
        condition: condition.enabled && condition.field_key && condition.value
          ? { field_key: condition.field_key, value: condition.value }
          : undefined,
      };
      return editingId
        ? updateRegistrationField(editingId, payload)
        : createRegistrationField(eventId, payload);
    },
    {
      invalidate: [keys.regFields.all(eventId)],
      successMessage: editingId ? "Field diperbarui." : "Field ditambahkan.",
      errorMessage: "Gagal menyimpan field.",
      notify: toast,
      onSuccess: () => {
        setForm({ ...EMPTY_FIELD });
        setCondition({ enabled: false, field_key: "", value: "" });
        setEditingId(null);
        setPage(1);
      },
    },
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  const startEdit = (f: RegistrationField) => {
    setEditingId(f.uuid);
    setForm({
      field_key: f.field_key,
      label: f.label,
      type: f.type,
      required: f.required,
      options: (f.options ?? []).join(", "),
      position: f.position,
    });
    setCondition({
      enabled: !!f.condition,
      field_key: f.condition?.field_key ?? "",
      value: f.condition?.value ?? "",
    });
  };

  const remove = useApiMutation((f: RegistrationField) => deleteRegistrationField(f.uuid), {
    invalidate: [keys.regFields.all(eventId)],
    successMessage: "Field dihapus.",
    errorMessage: "Gagal menghapus field.",
    notify: toast,
    onSuccess: () => setPage(1),
  });

  const removeClick = (f: RegistrationField) => {
    if (!confirm(`Hapus field "${f.label}"?`)) return;
    remove.mutate(f);
  };

  const q = search.trim().toLowerCase();
  const filtered = (items ?? []).filter(
    (f) =>
      !q ||
      f.label.toLowerCase().includes(q) ||
      f.field_key.toLowerCase().includes(q),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-3 bg-white p-4 border border-gray-100 rounded-xl">
        <h3 className="font-semibold text-gray-900">
          {editingId ? "Edit Field" : "Tambah Field"}
        </h3>
        <div className="gap-3 grid grid-cols-1 sm:grid-cols-2">
          <Input
            label="Field Key"
            required
            value={form.field_key}
            onChange={(e) => setForm({ ...form, field_key: e.target.value })}
            placeholder="contoh: instagram"
          />
          <Input
            label="Label"
            required
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Nama yang tampil"
          />
          <div>
            <label className="block mb-2 font-medium text-gray-700 text-sm">Tipe</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as RegistrationFieldType })}
              className="bg-white px-4 py-2.5 border border-gray-300 rounded-lg w-full h-11 text-gray-800 text-sm"
            >
              {FIELD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2 font-medium text-gray-700 text-sm">Urutan</label>
            <input
              type="number"
              value={form.position}
              onChange={(e) => setForm({ ...form, position: Number(e.target.value) || 0 })}
              className="bg-white px-4 py-2.5 border border-gray-300 rounded-lg w-full h-11 text-gray-800 text-sm"
            />
          </div>
          {form.type === "SELECT" && (
            <div className="sm:col-span-2">
              <Input
                label="Opsi (pisahkan dengan koma)"
                value={form.options}
                onChange={(e) => setForm({ ...form, options: e.target.value })}
                placeholder="Opsi A, Opsi B, Opsi C"
              />
            </div>
          )}
        </div>
        {/* A8 â€” conditional field */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <label className="flex items-center gap-2 text-gray-700 text-sm">
            <input
              type="checkbox"
              checked={condition.enabled}
              onChange={(e) => setCondition({ ...condition, enabled: e.target.checked })}
              className="w-4 h-4 accent-brand-500"
            />
            Hanya tampil jika field lain bernilai tertentu
          </label>
          {condition.enabled && (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="text"
                value={condition.field_key}
                onChange={(e) => setCondition({ ...condition, field_key: e.target.value })}
                placeholder="Field key pemicu (mis. tipe_visitor)"
                className="bg-white px-3 border border-gray-300 rounded-lg w-full h-10 text-sm"
              />
              <input
                type="text"
                value={condition.value}
                onChange={(e) => setCondition({ ...condition, value: e.target.value })}
                placeholder="Nilai pemicu (mis. PELAJAR)"
                className="bg-white px-3 border border-gray-300 rounded-lg w-full h-10 text-sm"
              />
            </div>
          )}
        </div>
        <label className="flex items-center gap-2 text-gray-700 text-sm">
          <input
            type="checkbox"
            checked={form.required}
            onChange={(e) => setForm({ ...form, required: e.target.checked })}
            className="w-4 h-4 accent-brand-500"
          />
          Wajib diisi
        </label>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={save.isPending}
            className="inline-flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold text-white text-sm"
          >
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {editingId ? "Simpan" : "Tambah"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ ...EMPTY_FIELD });
                setCondition({ enabled: false, field_key: "", value: "" });
              }}
              className="hover:bg-gray-100 px-3 py-2 rounded-lg text-gray-500 text-sm"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      <div className="rounded-xl border border-gray-100 bg-white p-3">
        <SearchBar search={search} setSearch={(v) => { setSearch(v); setPage(1); }} placeholder="Cari field..." />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-5 h-5 text-secondary animate-spin" />
        </div>
      ) : (items ?? []).length === 0 ? (
        <p className="py-8 text-gray-500 text-sm text-center">
          Belum ada field. Tambahkan untuk mengumpulkan data tambahan saat registrasi.
        </p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-gray-500 text-sm text-center">
          Tidak ada field yang cocok dengan pencarian.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {paged.map((f) => (
              <div key={f.uuid} className="flex items-center gap-3 bg-white px-4 py-3 border border-gray-100 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">
                    {f.label}
                    {f.required && <span className="ml-1 text-red-500">*</span>}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {f.field_key} Â· {f.type}
                    {f.type === "SELECT" && f.options && ` Â· ${f.options.join(", ")}`}
                  </p>
                </div>
                <button onClick={() => startEdit(f)} className="hover:bg-gray-100 p-2 rounded-lg text-gray-400 hover:text-gray-700" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => removeClick(f)} className="hover:bg-red-50 p-2 rounded-lg text-gray-400 hover:text-red-600" title="Hapus">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <DataPagination
              currentPage={page}
              totalPages={totalPages}
              itemsPerPage={PAGE_SIZE}
              totalItems={filtered.length}
              onPageChange={setPage}
              onItemsPerPageChange={() => {}}
              pageSizeOptions={[PAGE_SIZE]}
            />
          </div>
        </>
      )}
    </div>
  );
}



