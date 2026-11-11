import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Receipt, ScanLine, Camera, X, CheckCircle2 } from "lucide-react";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import SortMenu from "@/shared/components/ui/SortMenu";
import { Modal } from "@/shared/components/ui/Modal";
import { TenantProduct } from "@/entities/event/tenant.entity";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { resolveQr } from "@/services/qr.service";
import { useQrScanner } from "@/shared/hooks/useQrScanner";
import { soundEffects } from "@/shared/utils/sound";
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
import SearchBar from "@/shared/components/form/SearchBar";

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

  const { scanning, startScan, stopScan } = useQrScanner("pos-visitor-scanner");

  const handleVisitorDecoded = async (code: string) => {
    const value = code.trim();
    if (!value) return;
    try {
      const res = await resolveQr(value);
      if (!res.status || !res.data) {
        soundEffects.playError();
        toast.error(res.message || "QR pengunjung tidak dikenali.");
        return;
      }
      soundEffects.playSuccess();
      setVisitorId(res.data.user_id);
      setVisitorName(res.data.user.full_name);
      setVisitorQr("");
      toast.success(`Pengunjung terpasang: ${res.data.user.full_name}`);
      void stopScan();
    } catch {
      soundEffects.playError();
      toast.error("Gagal memvalidasi QR pengunjung.");
    }
  };

  const handleVisitorScan = async (code?: string) => {
    const value = (code ?? visitorQr).trim();
    if (!value) {
      toast.error("Masukkan atau scan QR pengunjung.");
      return;
    }
    try {
      const res = await resolveQr(value);
      if (!res.status || !res.data) {
        soundEffects.playError();
        toast.error(res.message || "QR pengunjung tidak dikenali.");
        return;
      }
      soundEffects.playSuccess();
      setVisitorId(res.data.user_id);
      setVisitorName(res.data.user.full_name);
      setVisitorQr("");
      toast.success(`Pengunjung terpasang: ${res.data.user.full_name}`);
    } catch {
      soundEffects.playError();
      toast.error("Gagal memvalidasi QR pengunjung.");
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { confirm, dialogs } = useConfirm();

  const resetForm = () => {
    void stopScan();
    setLines([{ product_id: "", quantity: "1" }]);
    setPaymentMethod("CASH");
    setPaid(true);
    setVisitorId("");
    setVisitorName("");
    setVisitorQr("");
  };

  const closeModal = () => {
    void stopScan();
    setIsModalOpen(false);
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

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Input Transaksi" maxWidth="max-w-2xl">
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
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-gray-700 text-sm">
                Pengunjung (opsional — scan QR)
              </label>
              {!scanning && !visitorName && (
                <span className="text-xs text-gray-500">
                  Untuk klaim suvenir belanja
                </span>
              )}
            </div>

            {scanning ? (
              <div className="flex flex-col items-center justify-center p-3 bg-gray-900 rounded-xl space-y-3">
                <div
                  id="pos-visitor-scanner"
                  className="w-full max-w-xs aspect-square overflow-hidden rounded-lg border border-gray-700 bg-black"
                />
                <p className="text-xs text-gray-300 text-center">
                  Arahkan kamera ke QR badge pengunjung untuk auto-attach
                </p>
                <button
                  type="button"
                  onClick={() => void stopScan()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium border border-gray-700 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Tutup Kamera
                </button>
              </div>
            ) : visitorName ? (
              <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-lg">
                <div className="flex items-center gap-2 text-teal-800 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <div>
                    <span className="font-semibold">{visitorName}</span>
                    <span className="text-xs text-teal-600 block">Pengunjung terhubung dengan transaksi ini</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVisitorId("");
                    setVisitorName("");
                  }}
                  className="p-1 rounded-md hover:bg-teal-100 text-teal-700 hover:text-red-600 transition-colors"
                  title="Hapus pengunjung"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={visitorQr}
                  onChange={(e) => setVisitorQr(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleVisitorScan();
                    }
                  }}
                  placeholder="Tempel kode / email pengunjung"
                  className="h-11 flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-white text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 focus:outline-hidden transition-colors"
                />
                <button
                  type="button"
                  onClick={() => void handleVisitorScan()}
                  className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 px-3.5 border border-gray-200 rounded-lg font-medium text-gray-700 text-sm h-11 shrink-0"
                >
                  <ScanLine className="w-4 h-4 text-gray-500" />
                  <span>Cari</span>
                </button>
                <button
                  type="button"
                  onClick={() => void startScan(handleVisitorDecoded)}
                  className="inline-flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3.5 rounded-lg font-medium text-sm h-11 shrink-0 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>Scan Kamera</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gray-50 px-4 py-3 rounded-lg gap-4 mt-4">
            <span className="text-gray-600 text-sm">Total: <span className="font-bold text-gray-900 text-lg">Rp {total?.toLocaleString("id-ID")}</span></span>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={closeModal}
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
          <SearchBar search={list.search} setSearch={list.applySearch} placeholder="Cari transaksi..." className="h-9 !rounded-lg" />
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
