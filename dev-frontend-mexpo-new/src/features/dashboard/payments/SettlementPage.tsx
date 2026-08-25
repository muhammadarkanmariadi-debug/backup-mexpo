"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  Wallet,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

import { Event } from "@/entities/event/event.entity";
import { SettlementSummary } from "@/entities/payment/payment.entity";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { getSettlementSummary, settleEvent } from "@/services/payment.service";
import { formatPrice } from "@/shared/utils/format";
import PageShell from "@/shared/components/ui/PageShell";
import { useAuthStore } from "@/stores/auth.store";

const inputCls =
  "w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none";

export default function SettlementPage({ event }: { event: Event }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "SUPERADMIN";

  const queryClient = useQueryClient();
  const summaryKey = keys.payments.summary(event.uuid);

  const { data: summary, isLoading: loadingSummary } = useApiQuery<
    SettlementSummary | null
  >(summaryKey, () => getSettlementSummary(event.uuid), { retry: 0 });

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [settling, setSettling] = useState(false);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: summaryKey });
  };

  const handleSettle = async () => {
    if (!summary) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value !== summary.net) {
      toast.error(`Jumlah harus sama persis dengan dana bersih (${formatPrice(summary.net)})`);
      return;
    }
    if (!window.confirm("Konfirmasi transfer manual ke rekening organizer?")) {
      return;
    }
    setSettling(true);
    try {
      const res = await settleEvent(
        event.uuid,
        { amount_transferred: value, note: note || undefined },
        proof,
      );
      if (!res.status) throw new Error(res.message ?? "Gagal mencatat settlement");
      toast.success("Settlement tercatat");
      setAmount("");
      setNote("");
      setProof(null);
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mencatat settlement");
    } finally {
      setSettling(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <PageShell className="py-10">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Wallet className="h-12 w-12 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Akses Ditolak</h2>
          <p className="text-gray-500 mt-2">Hanya Superadmin yang dapat mengakses halaman pencairan dana.</p>
          <Link href={`/dashboard/${event.slug ?? event.uuid}`} className="mt-6 inline-flex items-center gap-2 text-brand-600 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
          </Link>
        </div>
      </PageShell>
    );
  }

  if (loadingSummary) {
    return (
      <PageShell className="py-10">
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
        </div>
      </PageShell>
    );
  }

  const net = summary?.net ?? 0;

  return (
    <PageShell className="py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Settlement Pembayaran</h1>
          <p className="text-sm text-gray-500">Event: {event.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Ringkasan */}
        <section className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Informasi Rekening Organizer</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Bank</span>
                <span className="font-medium text-gray-900">{summary?.payout.bank_name || "-"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">No. Rekening</span>
                <span className="font-mono text-gray-900">{summary?.payout.account_number || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Atas Nama</span>
                <span className="font-medium text-gray-900">{summary?.payout.account_holder || "-"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-brand-100 bg-brand-50 p-5">
            <p className="text-sm font-medium text-brand-600">Total Dana Bersih (Net)</p>
            <p className="mt-1 text-3xl font-bold text-brand-700">
              {formatPrice(net)}
            </p>
            <p className="mt-1 text-xs text-brand-500">Dari {summary?.paid_transactions ?? 0} transaksi berhasil</p>
          </div>
        </section>

        {/* Settle Form */}
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
      </div>
    </PageShell>
  );
}
