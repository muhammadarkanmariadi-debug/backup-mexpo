"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Store,
  Package,
  Receipt,
  Users,
  UserPlus,
  Printer,
  BarChart3,
  Download,
  ScanLine,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import Input from "@/shared/components/form/Input";
import SearchBar from "@/shared/components/form/SearchBar";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import SortMenu from "@/shared/components/ui/SortMenu";
import { Event } from "@/entities/event/event.entity";
import { Tenant, TenantProduct } from "@/entities/event/tenant.entity";
import { getMyTenants } from "@/services/event-data.service";
import { getBoothReport, downloadTenantExport } from "@/services/report.service";
import { resolveQr } from "@/services/qr.service";
import { useList } from "@/features/dashboard/shared/useList";
import {
  getTenantDetail,
  updateTenant,
  getTenantMembers,
  inviteTenantMember,
  removeTenantMember,
  changeTenantMemberRole,
  TenantMember,
  TenantProfilePayload,
} from "@/services/tenant.service";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  ProductPayload,
} from "@/services/product.service";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  Transaction,
} from "@/services/transaction.service";
import BackLink from "@/features/dashboard/shared/BackLink";

type Tab = "profil" | "produk" | "transaksi" | "tim" | "laporan";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "profil", label: "Profil", icon: Store },
  { key: "produk", label: "Produk", icon: Package },
  { key: "transaksi", label: "Transaksi (POS)", icon: Receipt },
  { key: "tim", label: "Tim", icon: Users },
  { key: "laporan", label: "Laporan", icon: BarChart3 },
];

export default function TenantPortal({ event }: { event: Event }) {
  const [tenantId, setTenantId] = useState("");
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [tab, setTab] = useState<Tab>("profil");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMyTenants(event.uuid);
        if (!cancelled) setTenantId(res.data?.[0]?.uuid ?? "");
      } finally {
        if (!cancelled) setLoadingTenant(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [event.uuid]);

  if (loadingTenant) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="mx-auto px-4 py-16 max-w-2xl text-gray-500 text-sm text-center">
        Kamu belum terdaftar sebagai tenant yang disetujui di event ini.
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 py-8 max-w-7xl">
      <BackLink href="/dashboard" />
      <h1 className="mb-1 font-bold text-gray-900 text-2xl">Portal Tenant</h1>
      <p className="mb-6 text-gray-500 text-sm">{event.name}</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === key
                ? "bg-teal-600 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "profil" && <ProfileTab tenantId={tenantId} />}
      {tab === "produk" && <ProductsTab tenantId={tenantId} />}
      {tab === "transaksi" && <TransactionsTab tenantId={tenantId} />}
      {tab === "tim" && <TeamTab tenantId={tenantId} />}
      {tab === "laporan" && <TenantReportsTab eventId={event.uuid} tenantId={tenantId} />}
    </div>
  );
}

// ───────────────────────── Profil ─────────────────────────

function ProfileTab({ tenantId }: { tenantId: string }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [form, setForm] = useState<TenantProfilePayload>({
    name: "",
    description: "",
    phone: "",
    website: "",
    email: "",
    booth_number: "",
  });

  const load = async () => {
    const res = await getTenantDetail(tenantId);
    setTenant(res.data);
    if (res.data) {
      setForm({
        name: res.data.name,
        description: res.data.description,
        phone: res.data.phone,
        website: res.data.website,
        email: res.data.email,
        booth_number: res.data.booth_number,
      });
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getTenantDetail(tenantId);
        if (cancelled) return;
        setTenant(res.data);
        if (res.data) {
          setForm({
            name: res.data.name,
            description: res.data.description,
            phone: res.data.phone,
            website: res.data.website,
            email: res.data.email,
            booth_number: res.data.booth_number,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await updateTenant(tenantId, form, logo ?? undefined);
      if (!res.status) throw new Error();
      toast.success("Profil diperbarui.");
      await load();
    } catch {
      toast.error("Gagal menyimpan profil.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <form onSubmit={submit} className="space-y-4 bg-white p-5 border border-gray-100 rounded-xl max-w-2xl">
      {tenant?.logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={tenant.logo} alt="logo" className="rounded-lg w-16 h-16 object-cover" />
      )}
      <label className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 px-4 py-2 border border-gray-200 rounded-lg font-semibold text-gray-700 text-sm cursor-pointer">
        {logo ? `Logo: ${logo.name}` : "Upload logo"}
        <input type="file" accept="image/jpeg,image/png,image/gif" className="hidden" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} />
      </label>
      <Input label="Nama" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <Input label="Deskripsi" type="text-area" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <div className="gap-3 grid grid-cols-1 sm:grid-cols-2">
        <Input label="Telepon" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Nomor Booth" value={form.booth_number} onChange={(e) => setForm({ ...form, booth_number: e.target.value })} />
        <Input label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold text-white text-sm">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />} Simpan Profil
      </button>
    </form>
  );
}

// ───────────────────────── Produk ─────────────────────────

function ProductsTab({ tenantId }: { tenantId: string }) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "" });
  const [photo, setPhoto] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const list = useList<TenantProduct>((q) => getProducts(tenantId, q), [tenantId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload: ProductPayload = { name: form.name, description: form.description, price: Number(form.price) || 0 };
      const res = editingId
        ? await updateProduct(editingId, payload, photo ?? undefined)
        : await createProduct(tenantId, payload, photo ?? undefined);
      if (!res.status) throw new Error();
      toast.success(editingId ? "Produk diperbarui." : "Produk ditambahkan.");
      setForm({ name: "", description: "", price: "" });
      setPhoto(null);
      setEditingId(null);
      list.refetch();
    } catch {
      toast.error("Gagal menyimpan produk.");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (p: TenantProduct) => {
    setEditingId(p.uuid);
    setForm({ name: p.name, description: p.description, price: String(p.price) });
  };

  const remove = async (p: TenantProduct) => {
    if (!confirm(`Hapus produk "${p.name}"?`)) return;
    const res = await deleteProduct(p.uuid);
    if (!res.status) {
      toast.error("Gagal menghapus produk.");
      return;
    }
    toast.success("Produk dihapus.");
    list.refetch();
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-3 bg-white p-5 border border-gray-100 rounded-xl">
        <h3 className="font-semibold text-gray-900">{editingId ? "Edit Produk" : "Tambah Produk"}</h3>
        <label className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 px-4 py-2 border border-gray-200 rounded-lg font-semibold text-gray-700 text-sm cursor-pointer">
          {photo ? `Foto: ${photo.name}` : "Upload foto (opsional)"}
          <input type="file" accept="image/jpeg,image/png,image/gif" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
        </label>
        <Input label="Nama" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Input label="Harga (Rp)" type="number" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold text-white text-sm">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {editingId ? "Simpan" : "Tambah"}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm({ name: "", description: "", price: "" }); }} className="hover:bg-gray-100 px-3 py-2 text-gray-500 text-sm">
              Batal
            </button>
          )}
        </div>
      </form>

      <div className="mb-4 rounded-xl border border-gray-100 bg-white p-3">
        <SearchBar search={list.search} setSearch={list.applySearch} placeholder="Cari produk..." />
      </div>

      {list.loading ? (
        <Loader />
      ) : list.items.length === 0 ? (
        <p className="py-8 text-gray-500 text-sm text-center">Belum ada produk.</p>
      ) : (
        <>
          <div className="space-y-2">
            {list.items.map((p) => (
              <div key={p.uuid} className="flex items-center gap-3 bg-white px-4 py-3 border border-gray-100 rounded-xl">
                {p.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo} alt={p.name} className="rounded-lg w-11 h-11 object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                  <p className="text-gray-500 text-xs">Rp {p.price.toLocaleString("id-ID")}</p>
                </div>
                <button onClick={() => startEdit(p)} className="hover:bg-gray-100 p-2 rounded-lg text-gray-400 hover:text-gray-700" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(p)} className="hover:bg-red-50 p-2 rounded-lg text-gray-400 hover:text-red-600" title="Hapus">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3">
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

// ───────────────────────── Transaksi / POS ─────────────────────────

function TransactionsTab({ tenantId }: { tenantId: string }) {
  const [products, setProducts] = useState<TenantProduct[]>([]);
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState<{ product_id: string; quantity: string }[]>([
    { product_id: "", quantity: "1" },
  ]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paid, setPaid] = useState(true);
  const [printTx, setPrintTx] = useState<Transaction | null>(null);
  const [visitorId, setVisitorId] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorQr, setVisitorQr] = useState("");

  const list = useList<Transaction>((q) => getTransactions(tenantId, q), [tenantId]);

  // Products are only needed for the POS line-item selects — fetch all once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getProducts(tenantId);
        if (!cancelled) setProducts(res.data ?? []);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const handleVisitorScan = async (code?: string) => {
    const value = (code ?? visitorQr).trim();
    if (!value) {
      toast.error("Masukkan atau scan QR visitor.");
      return;
    }
    try {
      const res = await resolveQr(value);
      if (!res.status || !res.data) throw new Error();
      const d = res.data as { user_id: string; user: { full_name: string } };
      setVisitorId(d.user_id);
      setVisitorName(d.user.full_name);
      setVisitorQr("");
    } catch {
      toast.error("QR tidak dikenali.");
    }
  };

  const total = lines.reduce((sum, l) => {
    const p = products.find((x) => x.uuid === l.product_id);
    return sum + (p?.price ?? 0) * (Number(l.quantity) || 0);
  }, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const detail_transactions = lines
        .filter((l) => l.product_id && Number(l.quantity) > 0)
        .map((l) => ({ product_id: l.product_id, quantity: Number(l.quantity) }));
      if (detail_transactions.length === 0) throw new Error("Tambahkan minimal satu item.");
      const res = await createTransaction(
        tenantId,
        detail_transactions,
        paymentMethod,
        paid,
        undefined,
        visitorId || undefined,
      );
      if (!res.status) throw new Error(res.message || "Gagal membuat transaksi");
      toast.success("Transaksi tercatat.");
      setLines([{ product_id: "", quantity: "1" }]);
      setVisitorId("");
      setVisitorName("");
      list.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat transaksi.");
    } finally {
      setBusy(false);
    }
  };

  const removeTx = async (t: Transaction) => {
    if (!confirm("Hapus transaksi ini?")) return;
    const res = await deleteTransaction(t.uuid);
    if (!res.status) {
      toast.error("Gagal menghapus transaksi.");
      return;
    }
    toast.success("Transaksi dihapus.");
    list.refetch();
  };

  const togglePaid = async (t: Transaction) => {
    const res = await updateTransaction(t.uuid, { paid: !t.paid });
    if (!res.status) {
      toast.error("Gagal memperbarui status.");
      return;
    }
    list.refetch();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-3 bg-white p-5 border border-gray-100 rounded-xl">
        <h3 className="font-semibold text-gray-900">Input Transaksi</h3>
        {lines.map((l, idx) => (
          <div key={idx} className="gap-2 grid grid-cols-1 sm:grid-cols-[1fr_6rem_auto]">
            <select
              value={l.product_id}
              onChange={(e) => setLines(lines.map((x, i) => (i === idx ? { ...x, product_id: e.target.value } : x)))}
              className="bg-white px-3 border border-gray-300 rounded-lg w-full h-11 text-sm"
            >
              <option value="">Pilih produk...</option>
              {products.map((p) => (
                <option key={p.uuid} value={p.uuid}>
                  {p.name} — Rp {p.price.toLocaleString("id-ID")}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={l.quantity}
              onChange={(e) => setLines(lines.map((x, i) => (i === idx ? { ...x, quantity: e.target.value } : x)))}
              className="px-3 border border-gray-300 rounded-lg w-full h-11 text-sm"
            />
            <button
              type="button"
              onClick={() => setLines(lines.length > 1 ? lines.filter((_, i) => i !== idx) : lines)}
              className="inline-flex justify-center items-center hover:bg-gray-50 px-3 border border-gray-200 rounded-lg text-gray-500 text-sm"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setLines([...lines, { product_id: "", quantity: "1" }])} className="inline-flex items-center gap-1 font-medium text-teal-600 hover:text-teal-700 text-sm">
          <Plus className="w-4 h-4" /> Tambah item
        </button>

        <div className="gap-3 grid grid-cols-1 sm:grid-cols-2">
          <div>
            <label className="block mb-2 font-medium text-gray-700 text-sm">Metode Pembayaran</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="bg-white px-3 border border-gray-300 rounded-lg w-full h-11 text-sm">
              <option value="CASH">Cash</option>
              <option value="QRIS">QRIS</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-gray-700 text-sm">
            <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="w-4 h-4 accent-teal-600" />
            Sudah dibayar
          </label>
        </div>

        {/* A5 — optional visitor QR scan */}
        <div>
          <label className="mb-2 block font-medium text-gray-700 text-sm">
            Visitor (opsional — scan QR)
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={visitorQr}
              onChange={(e) => setVisitorQr(e.target.value)}
              placeholder="Tempel / scan QR visitor"
              className="bg-white px-3 border border-gray-300 rounded-lg w-full h-10 text-sm"
            />
            <button
              type="button"
              onClick={() => void handleVisitorScan()}
              className="inline-flex items-center justify-center gap-1 bg-white hover:bg-gray-50 px-3 border border-gray-200 rounded-lg font-medium text-gray-700 text-sm h-10"
            >
              <ScanLine className="w-4 h-4" /> Cari
            </button>
            {visitorName && (
              <span className="inline-flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-1.5 text-sm text-teal-700">
                {visitorName}
                <button type="button" onClick={() => { setVisitorId(""); setVisitorName(""); }} className="hover:text-red-600">
                  ×
                </button>
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg">
          <span className="text-gray-600 text-sm">Total</span>
          <span className="font-bold text-gray-900">Rp {total.toLocaleString("id-ID")}</span>
        </div>

        <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold text-white text-sm">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
          Simpan Transaksi
        </button>
      </form>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-gray-100 bg-white p-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Dari</label>
          <input type="date" value={list.filters.start_date?.slice(0, 10) ?? ""} onChange={(e) => list.applyFilter("start_date", e.target.value ? new Date(e.target.value).toISOString() : "")} className="bg-white px-3 border border-gray-300 rounded-lg h-9 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Sampai</label>
          <input type="date" value={list.filters.end_date?.slice(0, 10) ?? ""} onChange={(e) => list.applyFilter("end_date", e.target.value ? new Date(e.target.value).toISOString() : "")} className="bg-white px-3 border border-gray-300 rounded-lg h-9 text-sm" />
        </div>
        <div className="min-w-[140px] flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-500">Cari</label>
          <input type="text" value={list.search} onChange={(e) => list.applySearch(e.target.value)} placeholder="Cari transaksi..." className="bg-white px-3 border border-gray-300 rounded-lg w-full h-9 text-sm" />
        </div>
        <div className="flex items-end">
          <SortMenu
            options={[
              { key: "transaction_date", label: "Tanggal" },
              { key: "amount", label: "Total" },
            ]}
            sortBy={list.sortBy}
            sortDir={list.sortDir}
            onChange={list.applySort}
          />
        </div>
      </div>

      {list.loading ? (
        <Loader />
      ) : list.items.length === 0 ? (
        <p className="py-8 text-gray-500 text-sm text-center">Belum ada transaksi.</p>
      ) : (
        <>
          <div className="space-y-2">
            {list.items.map((t) => (
              <div key={t.uuid} className="bg-white px-4 py-3 border border-gray-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">Rp {t.amount.toLocaleString("id-ID")}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(t.transaction_date).toLocaleString("id-ID")} · {t.payment_method || "—"} ·{" "}
                      {t.paid ? "Lunas" : "Belum dibayar"}
                    </p>
                  </div>
                  <button onClick={() => setPrintTx(t)} className="inline-flex items-center gap-1 hover:bg-gray-50 px-2.5 py-1.5 border border-gray-200 rounded-lg font-medium text-gray-600 text-xs">
                    <Printer className="w-3.5 h-3.5" /> Nota
                  </button>
                  <button onClick={() => togglePaid(t)} className="hover:bg-gray-50 px-2.5 py-1.5 border border-gray-200 rounded-lg font-medium text-gray-600 text-xs">
                    {t.paid ? "Tandai belum" : "Tandai lunas"}
                  </button>
                  <button onClick={() => removeTx(t)} className="hover:bg-red-50 p-2 rounded-lg text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
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

      {printTx && <ReceiptModal tx={printTx} onClose={() => setPrintTx(null)} />}
    </div>
  );
}

function ReceiptModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/40 p-4">
      <div className="bg-white p-6 rounded-xl w-full max-w-sm">
        <div id="receipt-print" className="text-sm">
          <h2 className="mb-3 font-bold text-gray-900 text-center">Nota Transaksi</h2>
          <p className="mb-3 text-gray-500 text-xs text-center">
            {new Date(tx.transaction_date).toLocaleString("id-ID")}
          </p>
          <div className="space-y-1 mb-3 py-2 border-gray-200 border-t border-b border-dashed">
            {tx.tenantTransactionDetails?.map((d, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span>
                  {d.product?.name} x{d.quantity}
                </span>
                <span>Rp {(d.quantity * d.purchase_price).toLocaleString("id-ID")}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mb-3 font-semibold">
            <span>Total</span>
            <span>Rp {tx.amount.toLocaleString("id-ID")}</span>
          </div>
          <p className="text-gray-500 text-xs">
            Metode: {tx.payment_method || "—"} · Status: {tx.paid ? "Lunas" : "Belum dibayar"}
          </p>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => window.print()} className="flex-1 bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg font-semibold text-white text-sm">
            Cetak
          </button>
          <button onClick={onClose} className="hover:bg-gray-50 px-4 py-2 border border-gray-200 rounded-lg font-semibold text-gray-600 text-sm">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Tim (A13) ─────────────────────────

function TeamTab({ tenantId }: { tenantId: string }) {
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    const res = await getTenantMembers(tenantId);
    setMembers(res.data ?? []);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getTenantMembers(tenantId);
        if (!cancelled) setMembers(res.data ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await inviteTenantMember(tenantId, email.trim());
      if (!res.status) throw new Error();
      toast.success("Undangan dikirim.");
      setEmail("");
      await load();
    } catch {
      toast.error("Gagal mengundang anggota.");
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (m: TenantMember, role: "OWNER" | "STAFF") => {
    const res = await changeTenantMemberRole(m.uuid, role);
    if (!res.status) {
      toast.error("Gagal mengubah role.");
      return;
    }
    toast.success("Role diperbarui.");
    await load();
  };

  const remove = async (m: TenantMember) => {
    if (!confirm(`Hapus anggota "${m.user?.full_name}"?`)) return;
    const res = await removeTenantMember(m.uuid);
    if (!res.status) {
      toast.error("Gagal menghapus anggota.");
      return;
    }
    toast.success("Anggota dihapus.");
    await load();
  };

  const q = search.trim().toLowerCase();
  const filtered = members.filter(
    (m) =>
      !q ||
      (m.user?.full_name ?? "").toLowerCase().includes(q) ||
      (m.user?.email ?? "").toLowerCase().includes(q),
  );

  return (
    <div className="space-y-5">
      <form onSubmit={invite} className="flex sm:flex-row flex-col sm:items-end gap-3 bg-white p-5 border border-gray-100 rounded-xl">
        <div className="flex-1">
          <Input label="Email anggota" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@example.com" />
        </div>
        <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 px-4 py-2.5 rounded-lg font-semibold text-white text-sm">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Undang
        </button>
      </form>

      {members.length > 1 && (
        <div className="rounded-xl border border-gray-100 bg-white p-3">
          <SearchBar search={search} setSearch={setSearch} placeholder="Cari anggota..." />
        </div>
      )}

      {loading ? (
        <Loader />
      ) : members.length === 0 ? (
        <p className="py-8 text-gray-500 text-sm text-center">Belum ada anggota tim.</p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-gray-500 text-sm text-center">Tidak ada anggota yang cocok dengan pencarian.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <div key={m.uuid} className="flex items-center gap-3 bg-white px-4 py-3 border border-gray-100 rounded-xl">
              {m.user?.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.user.photo} alt={m.user.full_name} className="rounded-full w-10 h-10 object-cover" />
              ) : (
                <div className="flex justify-center items-center bg-teal-50 rounded-full w-10 h-10 text-teal-700">
                  <Users className="w-4 h-4" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{m.user?.full_name}</p>
                <p className="text-gray-500 text-xs">
                  {m.user?.email} · {m.status} · <span className="font-medium">{m.role}</span>
                </p>
              </div>
              <select
                value={m.role}
                onChange={(e) => changeRole(m, e.target.value as "OWNER" | "STAFF")}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-gray-600 text-xs"
              >
                <option value="STAFF">Staff</option>
                <option value="OWNER">Owner</option>
              </select>
              <button onClick={() => remove(m)} className="hover:bg-red-50 p-2 rounded-lg text-gray-400 hover:text-red-600" title="Hapus">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TenantReportsTab({ eventId, tenantId }: { eventId: string; tenantId: string }) {
  const [boothVisits, setBoothVisits] = useState(0);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bRes, tRes] = await Promise.all([
          getBoothReport(eventId),
          getTransactions(tenantId),
        ]);
        if (cancelled) return;
        const myRow = (bRes.data ?? []).find((r) => r.uuid === tenantId);
        setBoothVisits(myRow?.counts ?? 0);
        setTxns(tRes.data ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, tenantId]);

  const totalAmount = txns.reduce((s, t) => s + t.amount, 0);
  const chartData = [...txns]
    .slice(0, 8)
    .reverse()
    .map((t) => ({
      date: new Date(t.transaction_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
      amount: t.amount,
    }));

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadTenantExport(eventId, tenantId);
      toast.success("Laporan Excel diunduh.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh laporan.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <p className="text-xs text-gray-500">Booth Visitors</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{boothVisits}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <p className="text-xs text-gray-500">Transaksi</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{txns.length}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <p className="text-xs text-gray-500">Total (Rp)</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {totalAmount.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
        <button
          onClick={() => void handleExport()}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export Excel
        </button>
      </div>

      {chartData.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-gray-700">Transaksi Terbaru</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} />
              <Tooltip formatter={(v) => `Rp ${Number(v ?? 0).toLocaleString("id-ID")}`} />
              <Bar dataKey="amount" name="Amount" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {txns.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-500">Belum ada transaksi.</p>
      )}
    </div>
  );
}

function Loader() {
  return (
    <div className="flex justify-center py-10">
      <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
    </div>
  );
}
