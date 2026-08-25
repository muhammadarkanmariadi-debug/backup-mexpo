import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Receipt, ScanLine } from "lucide-react";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import SortMenu from "@/shared/components/ui/SortMenu";
import { Modal } from "@/shared/components/ui/Modal";
import { TenantProduct } from "@/entities/event/tenant.entity";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { useResolveQr } from "@/lib/hooks/useResolveQr";
import { useList } from "@/shared/hooks/useList";
import { getProducts } from "@/services/product.service";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  Transaction,
} from "@/services/transaction.service";
import LoadingState from "@/shared/components/ui/LoadingState";
import { useConfirm } from "@/shared/components/ui/ConfirmDialog";
import EmptyState from "@/shared/components/ui/EmptyState";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Tunai",
  QRIS: "QRIS",
  TRANSFER: "Transfer",
};

function ReceiptModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/40 p-4">
      <div className="bg-white p-6 rounded-xl w-full max-w-sm">
        <div id="receipt-print" className="text-sm">
          <h2 className="mb-3 font-bold text-gray-900 text-center">Nota Transaksi</h2>
          <p className="mb-3 text-gray-500 text-xs text-center">
            {new Date(tx.transaction_date)?.toLocaleString("id-ID")}
          </p>
          <div className="space-y-1 mb-3 py-2 border-gray-200 border-t border-b border-dashed">
            {tx.tenantTransactionDetails?.map((d, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span>
                  {d.product?.name} x{d.quantity}
                </span>
                <span>Rp {(d.quantity * d.purchase_price)?.toLocaleString("id-ID")}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mb-3 font-semibold">
            <span>Total</span>
            <span>Rp {tx.amount?.toLocaleString("id-ID")}</span>
          </div>
          <p className="text-gray-500 text-xs">
            Metode: {PAYMENT_METHOD_LABELS[tx.payment_method || ""] ?? (tx.payment_method || "—")} · Status: {tx.paid ? "Lunas" : "Belum dibayar"}
          </p>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => window.print()} className="flex-1 bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg font-semibold text-white text-sm">
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

export function TransactionsTab({ tenantId }: { tenantId: string }) {
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
  const { data: products } = useApiQuery<TenantProduct[]>(
    keys.products.all(tenantId),
    () => getProducts(tenantId),
  );

  const resolve = useResolveQr({
    onSuccess: (data) => {
      setVisitorId(data.user_id);
      setVisitorName(data.user.full_name);
      setVisitorQr("");
    },
    onError: () => toast.error("QR tidak dikenali."),
  });

  const handleVisitorScan = (code?: string) => {
    const value = (code ?? visitorQr).trim();
    if (!value) {
      toast.error("Masukkan atau scan QR pengunjung.");
      return;
    }
    resolve.mutate(value);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { confirm, dialogs } = useConfirm();

  const resetForm = () => {
    setLines([{ product_id: "", quantity: "1" }]);
    setPaymentMethod("CASH");
    setPaid(true);
    setVisitorId("");
    setVisitorName("");
    setVisitorQr("");
  };

  const total = lines.reduce((sum, l) => {
    const p = (products ?? []).find((x) => x.uuid === l.product_id);
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
      resetForm();
      setIsModalOpen(false);
      list.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat transaksi.");
    } finally {
      setBusy(false);
    }
  };

  const removeTx = async (t: Transaction) => {
    if (!(await confirm("Hapus transaksi ini?"))) return;
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h2 className="font-semibold text-gray-900">Riwayat Transaksi</h2>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg font-semibold text-white transition-colors h-10 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Transaksi</span>
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Input Transaksi" maxWidth="max-w-2xl">
        <form onSubmit={submit} className="space-y-4">
          {lines.map((l, idx) => (
            <div key={idx} className="gap-2 grid grid-cols-1 sm:grid-cols-[1fr_6rem_auto]">
              <select
                value={l.product_id}
                onChange={(e) => setLines(lines.map((x, i) => (i === idx ? { ...x, product_id: e.target.value } : x)))}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-white text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 focus:outline-hidden transition-colors"
              >
                <option value="">Pilih produk...</option>
                {(products ?? []).map((p) => (
                  <option key={p.uuid} value={p.uuid}>
                    {p.name} — Rp {p.price?.toLocaleString("id-ID")}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={l.quantity}
                onChange={(e) => setLines(lines.map((x, i) => (i === idx ? { ...x, quantity: String(e.target.value) } : x)))}
                className="h-11 w-24 rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-white text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 focus:outline-hidden transition-colors"
                placeholder="Jml"
              />
              <button
                type="button"
                onClick={() => setLines(lines.length > 1 ? lines.filter((_, i) => i !== idx) : lines)}
                className="inline-flex justify-center items-center hover:bg-gray-50 px-3 border border-gray-200 rounded-lg text-gray-500 text-sm h-11"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setLines([...lines, { product_id: "", quantity: "1" }])} className="inline-flex items-center gap-1 font-medium text-teal-600 hover:text-teal-700 text-sm">
            <Plus className="w-4 h-4" /> Tambah item
          </button>

          <div className="gap-3 grid grid-cols-1 sm:grid-cols-2 pt-2 border-t border-gray-100">
            <div>
              <label className="block mb-2 font-medium text-gray-700 text-sm">Metode Pembayaran</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-11 w-full sm:w-auto rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-white text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 focus:outline-hidden transition-colors"
              >
                <option value="CASH">Tunai</option>
                <option value="QRIS">QRIS</option>
                <option value="TRANSFER">Transfer</option>
              </select>
            </div>
            <div className="flex items-center sm:pt-7">
              <label className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="w-4 h-4 accent-teal-600" />
                Sudah dibayar
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <label className="mb-2 block font-medium text-gray-700 text-sm">
              Pengunjung (opsional — scan QR)
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={visitorQr}
                onChange={(e) => setVisitorQr(e.target.value)}
                placeholder="Tempel / scan QR pengunjung"
                className="h-11 w-full sm:w-64 rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-white text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 focus:outline-hidden transition-colors"
              />
              <button
                type="button"
                onClick={() => void handleVisitorScan()}
                className="inline-flex items-center justify-center gap-1 bg-white hover:bg-gray-50 px-3 border border-gray-200 rounded-lg font-medium text-gray-700 text-sm h-11"
              >
                <ScanLine className="w-4 h-4" /> Cari
              </button>
              {visitorName && (
                <span className="inline-flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-1.5 text-sm text-teal-700 h-11">
                  {visitorName}
                  <button type="button" onClick={() => { setVisitorId(""); setVisitorName(""); }} className="hover:text-red-600 font-bold">
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gray-50 px-4 py-3 rounded-lg gap-4 mt-4">
            <span className="text-gray-600 text-sm">Total: <span className="font-bold text-gray-900 text-lg">Rp {total?.toLocaleString("id-ID")}</span></span>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="hover:bg-gray-200 bg-gray-100 px-4 py-2 text-gray-600 text-sm font-semibold rounded-lg w-full sm:w-auto h-11"
              >
                Batal
              </button>
              <button type="submit" disabled={busy || lines.length === 0} className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 disabled:opacity-50 px-5 py-2.5 rounded-lg font-semibold text-white transition-colors w-full sm:w-auto h-11">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Buat
              </button>
            </div>
          </div>
        </form>
      </Modal>

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
        <LoadingState type="skeleton-list" count={4} className="py-4" />
      ) : list.items.length === 0 ? (
        <EmptyState title="Belum ada transaksi." className="py-8" />
      ) : (
        <>
          <div className="space-y-2">
            {list.items.map((t) => (
              <div key={t.uuid} className="bg-white px-4 py-3 border border-gray-100 rounded-xl flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">Rp {t.amount?.toLocaleString("id-ID")}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(t.transaction_date)?.toLocaleString("id-ID")} · {PAYMENT_METHOD_LABELS[t.payment_method || ""] ?? (t.payment_method || "—")}
                  </p>
                  <span onClick={() => togglePaid(t)} className={`cursor-pointer inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${t.paid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {t.paid ? "Lunas" : "Belum Lunas"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPrintTx(t)} className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 p-2 rounded-lg text-gray-600 transition-colors" title="Lihat Struk">
                    <Receipt className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeTx(t)} className="flex items-center justify-center bg-red-50 hover:bg-red-100 p-2 rounded-lg text-red-600 transition-colors" title="Hapus">
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

      {dialogs}
    </div>
  );
}
