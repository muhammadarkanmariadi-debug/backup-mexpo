"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

import Input from "@/shared/components/form/Input";
import SearchBar from "@/shared/components/form/SearchBar";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { useApiMutation, useApiQuery } from "@/lib/hooks/useApi";
import { Modal } from "@/shared/components/ui/Modal";
import PageHeader from "@/shared/components/ui/PageHeader";
import SegmentedTabs from "@/shared/components/ui/SegmentedTabs";
import SectionTitle from "@/shared/components/ui/SectionTitle";
import EmptyState from "@/shared/components/ui/EmptyState";
import { useConfirm } from "@/shared/components/ui/ConfirmDialog";
import PageShell from "@/shared/components/ui/PageShell";
import { keys } from "@/lib/query-keys";
import { useClientList } from "@/shared/hooks/useClientList";
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
import { labelFor, REGISTRATION_FIELD_TYPE_LABELS } from "@/shared/data/labels";

const FIELD_TYPES: { value: RegistrationFieldType; label: string }[] = [
  { value: "TEXT", label: "Teks" },
  { value: "TEXTAREA", label: "Teks Panjang" },
  { value: "NUMBER", label: "Angka" },
  { value: "EMAIL", label: "Surel" },
  { value: "SELECT", label: "Pilihan" },
  { value: "DATE", label: "Tanggal" },
  { value: "BOOLEAN", label: "Ya/Tidak" },
];

type Tab = "types" | "fields";

export default function RegistrationManager({ event }: { event: Event }) {
  const isPaid =
    event.ticket_mode === "PAID" || event.features?.paidTicket === true;
  const [tab, setTab] = useState<Tab>(isPaid ? "types" : "fields");

  return (
    <PageShell className="py-8">
      <PageHeader title="Atur Registrasi" subtitle={event.name} />

      <SegmentedTabs<Tab>
        items={[
          ...(isPaid ? [{ id: "types" as Tab, label: "Tiket" }] : []),
          { id: "fields" as Tab, label: "Form Pendaftaran" },
        ]}
        value={tab}
        onChange={setTab}
        className="mb-6"
      />

      {tab === "types" && isPaid && (
        <TicketTypesPanel eventId={event.uuid} />
      )}
      {tab === "fields" && <FieldsPanel eventId={event.uuid} />}
    </PageShell>
  );
}

// â”€â”€ Ticket types â”€â”€

function TicketTypesPanel({ eventId }: { eventId: string }) {
  const [form, setForm] = useState({ name: "", price: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const PAGE_SIZE = 10;

  const { data: items, isLoading: loading } = useApiQuery<TicketType[]>(
    keys.tickets.list(eventId),
    () => getEventTicketTypes(eventId),
  );

  const list = useClientList<TicketType>({
    items: items ?? [],
    pageSize: PAGE_SIZE,
    getSearch: (t) => t.name,
  });

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
        list.setPage(1);
        setIsModalOpen(false);
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
    setIsModalOpen(true);
  };

  const remove = useApiMutation((t: TicketType) => deleteTicketType(t.uuid), {
    invalidate: [keys.tickets.all(eventId)],
    successMessage: "Tiket dihapus.",
    errorMessage: "Gagal menghapus tiket.",
    notify: toast,
    onSuccess: () => list.setPage(1),
  });

  const { confirm, dialogs } = useConfirm();

  const removeClick = async (t: TicketType) => {
    if (!(await confirm(`Hapus tiket "${t.name}"?`))) return;
    remove.mutate(t);
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Atur Tiket"
        action={
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg font-semibold text-white text-sm">
            <Plus className="w-4 h-4" /> Tambah Tiket
          </button>
        }
      />

      {dialogs}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingId(null); setForm({ name: "", price: "" }); }} title={editingId ? "Edit Tiket" : "Tambah Tiket"} maxWidth="max-w-md">
        <form onSubmit={submit} className="space-y-4">
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
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold text-white text-sm"
            >
              {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {editingId ? "Simpan" : "Tambah"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingId(null);
                setForm({ name: "", price: "" });
              }}
              className="hover:bg-gray-100 px-3 py-2 rounded-lg text-gray-500 text-sm"
            >
              Batal
            </button>
          </div>
        </form>
      </Modal>

      <div className="rounded-xl border border-gray-100 bg-white p-3">
        <SearchBar search={list.search} setSearch={list.applySearch} placeholder="Cari tiket..." />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-5 h-5 text-secondary animate-spin" />
        </div>
      ) : (items ?? []).length === 0 ? (
        <EmptyState title="Belum ada tiket." />
      ) : list.filtered.length === 0 ? (
        <EmptyState title="Tidak ada tiket yang cocok dengan pencarian." />
      ) : (
        <>
          <div className="space-y-2">
            {list.paged.map((t) => (
              <div key={t.uuid} className="flex items-center gap-3 bg-white px-4 py-3 border border-gray-100 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">Rp {t.price.toLocaleString("id-ID")}</p>
                </div>
                <button onClick={() => startEdit(t)} className="hover:bg-gray-100 p-2 rounded-lg text-gray-400 hover:text-gray-700" title="Ubah">
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
              currentPage={list.page}
              totalPages={list.totalPages}
              itemsPerPage={list.itemsPerPage}
              totalItems={list.total}
              onPageChange={list.setPage}
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const PAGE_SIZE = 10;

  const { data: items, isLoading: loading } = useApiQuery<RegistrationField[]>(
    keys.regFields.list(eventId),
    () => getEventRegistrationFields(eventId),
  );

  const list = useClientList<RegistrationField>({
    items: items ?? [],
    pageSize: PAGE_SIZE,
    getSearch: (f) => `${f.label} ${f.field_key}`,
  });

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
      successMessage: editingId ? "Kolom diperbarui." : "Kolom ditambahkan.",
      errorMessage: "Gagal menyimpan kolom.",
      notify: toast,
      onSuccess: () => {
        setForm({ ...EMPTY_FIELD });
        setCondition({ enabled: false, field_key: "", value: "" });
        setEditingId(null);
        list.setPage(1);
        setIsModalOpen(false);
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
    setIsModalOpen(true);
  };

  const remove = useApiMutation((f: RegistrationField) => deleteRegistrationField(f.uuid), {
    invalidate: [keys.regFields.all(eventId)],
    successMessage: "Kolom dihapus.",
    errorMessage: "Gagal menghapus kolom.",
    notify: toast,
    onSuccess: () => list.setPage(1),
  });

  const { confirm, dialogs } = useConfirm();

  const removeClick = async (f: RegistrationField) => {
    if (!(await confirm(`Hapus kolom "${f.label}"?`))) return;
    remove.mutate(f);
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Atur Kolom Registrasi"
        action={
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg font-semibold text-white text-sm">
            <Plus className="w-4 h-4" /> Tambah Kolom
          </button>
        }
      />

      {dialogs}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingId(null); setForm({ ...EMPTY_FIELD }); setCondition({ enabled: false, field_key: "", value: "" }); }} title={editingId ? "Edit Kolom" : "Tambah Kolom"} maxWidth="max-w-xl">
        <form onSubmit={submit} className="space-y-4">
          <div className="gap-3 grid grid-cols-1 sm:grid-cols-2">
            <Input
              label="Kunci Kolom"
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
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <label className="flex items-center gap-2 text-gray-700 text-sm">
              <input
                type="checkbox"
                checked={condition.enabled}
                onChange={(e) => setCondition({ ...condition, enabled: e.target.checked })}
                className="w-4 h-4 accent-brand-500"
              />
              Hanya tampil jika kolom lain bernilai tertentu
            </label>
            {condition.enabled && (
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  value={condition.field_key}
                  onChange={(e) => setCondition({ ...condition, field_key: e.target.value })}
                  placeholder="Kunci kolom pemicu (mis. tipe_visitor)"
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
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={save.isPending}
              className="inline-flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold text-white text-sm"
            >
              {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {editingId ? "Simpan" : "Tambah"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingId(null);
                setForm({ ...EMPTY_FIELD });
                setCondition({ enabled: false, field_key: "", value: "" });
              }}
              className="hover:bg-gray-100 px-3 py-2 rounded-lg text-gray-500 text-sm"
            >
              Batal
            </button>
          </div>
        </form>
      </Modal>

      <div className="rounded-xl border border-gray-100 bg-white p-3">
        <SearchBar search={list.search} setSearch={list.applySearch} placeholder="Cari kolom..." />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-5 h-5 text-secondary animate-spin" />
        </div>
      ) : (items ?? []).length === 0 ? (
        <EmptyState title="Belum ada kolom." subtitle="Tambahkan untuk mengumpulkan data tambahan saat registrasi." />
      ) : list.filtered.length === 0 ? (
        <EmptyState title="Tidak ada kolom yang cocok dengan pencarian." />
      ) : (
        <>
          <div className="space-y-2">
            {list.paged.map((f) => (
              <div key={f.uuid} className="flex items-center gap-3 bg-white px-4 py-3 border border-gray-100 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">
                    {f.label}
                    {f.required && <span className="ml-1 text-red-500">*</span>}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {f.field_key} · {labelFor(REGISTRATION_FIELD_TYPE_LABELS, f.type, f.type)}
                    {f.type === "SELECT" && f.options && ` · ${f.options.join(", ")}`}
                  </p>
                </div>
                <button onClick={() => startEdit(f)} className="hover:bg-gray-100 p-2 rounded-lg text-gray-400 hover:text-gray-700" title="Ubah">
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
              currentPage={list.page}
              totalPages={list.totalPages}
              itemsPerPage={list.itemsPerPage}
              totalItems={list.total}
              onPageChange={list.setPage}
              onItemsPerPageChange={() => {}}
              pageSizeOptions={[PAGE_SIZE]}
            />
          </div>
        </>
      )}
    </div>
  );
}



