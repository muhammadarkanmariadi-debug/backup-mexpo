import { useState } from "react";
import { CheckCircle2, Loader2, Wallet } from "lucide-react";
import { SettlementSummary } from "@/entities/payment/payment.entity";
import { formatPrice } from "@/shared/utils/format";
import LoadingState from "@/shared/components/ui/LoadingState";

const inputCls =
  "w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none";

interface Props {
  summary: SettlementSummary | null;
  loading: boolean;
  onSettle: (amount: number, note: string, proof: File | null) => Promise<void>;
}

export function SettlementForm({ summary, loading, onSettle }: Props) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [settling, setSettling] = useState(false);

  if (loading) return <LoadingState type="skeleton-card" count={1} />;

  const net = summary?.net ?? 0;

  const handleSettle = async () => {
    setSettling(true);
    await onSettle(Number(amount), note, proof);
    setSettling(false);
    setAmount("");
    setNote("");
    setProof(null);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <Wallet className="h-5 w-5 text-gray-400" />
        <h3 className="font-semibold text-gray-800">Catat Pencairan Dana</h3>
      </div>
      {summary?.payout_status === "SETTLED" ? (
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 mt-4 border border-emerald-100">
          <div className="flex items-center gap-2 mb-2 font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            Event Sudah Disetl
          </div>
          Pada {summary.settled_at ? new Date(summary.settled_at).toLocaleString("id-ID") : "-"}.
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-600">
            Transfer manual ke rekening organizer sebesar{" "}
            <strong>{formatPrice(net)}</strong>, lalu unggah buktinya di bawah ini.
          </p>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Jumlah ditransfer (harus sama persis dengan net)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputCls}
                placeholder={String(net)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Catatan</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder="Contoh: transfer via Internet Banking" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Bukti transfer (opsional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProof(e.target.files?.[0] ?? null)}
                className="block w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-gray-700 cursor-pointer"
              />
            </div>
            <button
              type="button"
              onClick={() => void handleSettle()}
              disabled={settling || net <= 0}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {settling ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Selesaikan Payout
            </button>
          </div>
        </>
      )}
    </section>
  );
}
