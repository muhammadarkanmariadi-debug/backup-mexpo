"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2,
  Landmark,
  Loader2,
  RefreshCw,
  Undo2,
  Wallet,
} from "lucide-react";

import { Event } from "@/entities/event/event.entity";
import {
  PaymentTransaction,
  SettlementSummary,
  TransactionStatus,
} from "@/entities/payment/payment.entity";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import {
  getEventTransactions,
  getSettlementSummary,
  refundTransaction,
  updateEventPayout,
} from "@/services/payment.service";
import { formatPrice } from "@/shared/utils/format";

const STATUS_LABEL: Record<TransactionStatus, string> = {
  PENDING: "Menunggu",
  PAID: "Lunas",
  EXPIRED: "Kedaluwarsa",
  FAILED: "Gagal",
  REFUNDED: "Refund",
};

const STATUS_CLS: Record<TransactionStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PAID: "bg-emerald-50 text-emerald-700",
  EXPIRED: "bg-gray-100 text-gray-600",
  FAILED: "bg-red-50 text-red-600",
  REFUNDED: "bg-gray-100 text-gray-500",
};

const inputCls =
  "w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none";
const inputErrCls =
  "w-full rounded-lg border border-error-500 px-2.5 py-1.5 text-sm text-gray-900 focus:border-error-500 focus:outline-none";

export function PaymentsFeature({
  event,
}: {
  event: Event;
}) {
  const queryClient = useQueryClient();
  const summaryKey = keys.payments.summary(event.uuid);
  const listKey = keys.payments.list(event.uuid, { quantity: "100" });
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const { data: summary, isLoading: loadingSummary } = useApiQuery<
    SettlementSummary | null
  >(summaryKey, () => getSettlementSummary(event.uuid), { retry: 0 });

  const { data: transactions, isLoading: loadingTx } =
    useApiQuery<PaymentTransaction[]>(listKey, () =>
      getEventTransactions(event.uuid, { quantity: "100" }),
    );

  // Superadmin settlement logic has been extracted to a separate page.

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: summaryKey });
    void queryClient.invalidateQueries({ queryKey: listKey });
  };


  const handleRefund = async (txId: string) => {
    const reason = window.prompt("Alasan refund:", "Event dibatalkan");
    if (!reason) return;
    setRefundingId(txId);
    try {
      const res = await refundTransaction(txId, reason);
      if (!res.status) throw new Error(res.message ?? "Gagal refund");
      toast.success("Transaksi di-refund");
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal refund");
    } finally {
      setRefundingId(null);
    }
  };

  if (loadingSummary) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-secondary" />
      </div>
    );
  }

  const net = summary?.net ?? 0;

  return (
    <div className="space-y-6">
      {/* ── Ringkasan dana ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">Dana terkumpul (PAID)</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {formatPrice(summary?.gross ?? 0)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {summary?.paid_transactions ?? 0} transaksi
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">Biaya platform</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {formatPrice(summary?.platform_fee ?? 0)}
          </p>
          <p className="mt-1 text-xs text-gray-400">dipotong sebelum payout</p>
        </div>
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
          <p className="text-xs font-medium text-brand-600">Dana bersih (net)</p>
          <p className="mt-1 text-xl font-bold text-brand-700">
            {formatPrice(net)}
          </p>
          <p className="mt-1 text-xs text-brand-500">untuk payout organizer</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">Status</p>
          <p className="mt-1 flex items-center gap-1.5 text-xl font-bold text-gray-900">
            {summary?.payout_status === "SETTLED" ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Settled
              </>
            ) : (
              <>
                <Wallet className="h-5 w-5 text-amber-500" /> Belum disetl
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {summary?.paid_transactions ? `${net.toLocaleString("id-ID")} IDR tersedia` : "Belum ada dana"}
          </p>
        </div>
      </div>

      {/* ── Rekening payout + settlement ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Payout account (OWNER/COMMITTEE) */}
        <PayoutForm
          key={`${summary?.payout_status ?? "no"}-${summary?.payout.account_number ?? "no"}-${summary?.settlement_requested ? "req" : "not"}`}
          eventUuid={event.uuid}
          initial={{
            bank_name: summary?.payout.bank_name ?? "",
            account_number: summary?.payout.account_number ?? "",
            account_holder: summary?.payout.account_holder ?? "",
          }}
          summary={summary}
          onSaved={invalidate}
        />

        {/* Settle History (Visible to Organizer) */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-800">Riwayat Settlement</h3>
          {(summary?.settlements ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-gray-400">Belum ada settlement.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {(summary?.settlements ?? []).map((s) => (
                <li key={s.uuid} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <span className="font-medium text-gray-700">{formatPrice(s.amount_transferred)}</span>
                  <span className="text-xs text-gray-400">{new Date(s.created_at).toLocaleString("id-ID")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── Daftar transaksi ── */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Transaksi Tiket</h3>
          <button
            type="button"
            onClick={() => invalidate()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Muat Ulang
          </button>
        </div>

        {loadingTx ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-secondary" />
          </div>
        ) : (transactions ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            Belum ada transaksi. Saat event PAID, transaksi berikut dibuat otomatis
            ketika peserta checkout.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                  <th className="pb-2 pr-3">Order</th>
                  <th className="pb-2 pr-3">Peserta</th>
                  <th className="pb-2 pr-3">Tiket</th>
                  <th className="pb-2 pr-3">Total</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2 pr-3">Metode</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {(transactions ?? []).map((tx) => (
                  <tr key={tx.uuid} className="border-b border-gray-50">
                    <td className="py-2.5 pr-3 font-mono text-xs text-gray-500">
                      {tx.midtrans_order_id}
                    </td>
                    <td className="py-2.5 pr-3 text-gray-800">
                      {tx.user?.full_name ?? "-"}
                    </td>
                    <td className="py-2.5 pr-3 text-gray-600">
                      {tx.ticket?.ticket_type?.name ?? "-"}
                    </td>
                    <td className="py-2.5 pr-3 text-gray-800">
                      {formatPrice(tx.amount)}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLS[tx.status]}`}>
                        {STATUS_LABEL[tx.status]}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-gray-600">
                      {tx.payment_method || "-"}
                    </td>
                    <td className="py-2.5 text-right">
                      {(tx.status === "PAID" || tx.status === "PENDING") && (
                        <button
                          type="button"
                          onClick={() => void handleRefund(tx.uuid)}
                          disabled={refundingId === tx.uuid}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {refundingId === tx.uuid ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Undo2 className="h-3.5 w-3.5" />
                          )}
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/** Organizer payout account form (OWNER/COMMITTEE). */
function PayoutForm({
  eventUuid,
  initial,
  summary,
  onSaved,
}: {
  eventUuid: string;
  initial: { bank_name: string; account_number: string; account_holder: string };
  summary?: SettlementSummary | null;
  onSaved: () => void;
}) {
  const [bank, setBank] = useState(initial.bank_name);
  const [accNum, setAccNum] = useState(initial.account_number);
  const [accHolder, setAccHolder] = useState(initial.account_holder);
  const [notes, setNotes] = useState(summary?.settlement_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [errors, setErrors] = useState<{ bank?: string; accNum?: string; accHolder?: string }>({});

  const isSettled = summary?.payout_status === "SETTLED";
  const isRequested = Boolean(summary?.settlement_requested);
  const netAmount = summary?.net ?? 0;

  const save = async (requestSettlement = false) => {
    const nextErrors: typeof errors = {};
    if (!bank.trim()) nextErrors.bank = "Nama bank wajib diisi.";
    if (!accNum.trim()) nextErrors.accNum = "Nomor rekening wajib diisi.";
    if (!accHolder.trim()) nextErrors.accHolder = "Atas nama rekening wajib diisi.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (requestSettlement) {
      if (netAmount <= 0) {
        toast.error("Belum ada dana bersih yang dapat dicairkan.");
        return;
      }
      if (
        !window.confirm(
          `Konfirmasi pengajuan pencairan dana sebesar ${formatPrice(netAmount)} ke rekening ${bank} - ${accNum} a.n ${accHolder}? Permohonan akan diteruskan ke antrean Superadmin.`
        )
      ) {
        return;
      }
      setRequesting(true);
    } else {
      setSaving(true);
    }

    try {
      const res = await updateEventPayout(eventUuid, {
        bank_name: bank.trim(),
        account_number: accNum.trim(),
        account_holder: accHolder.trim(),
        request_settlement: requestSettlement ? true : undefined,
        notes: notes.trim() || undefined,
      });
      if (!res.status) throw new Error(res.message ?? "Gagal menyimpan");

      toast.success(
        requestSettlement
          ? "Permohonan settlement berhasil dibuka & dikirimkan ke Superadmin!"
          : "Rekening payout berhasil disimpan"
      );
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan koneksi");
    } finally {
      setSaving(false);
      setRequesting(false);
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-secondary" />
          <h3 className="text-sm font-semibold text-gray-800">
            Formulir Rekening &amp; Permohonan Settlement
          </h3>
        </div>

        {isSettled ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Settled
          </span>
        ) : isRequested ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menunggu Transfer Superadmin
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-secondary">
            Belum Diajukan
          </span>
        )}
      </div>

      {/* Info status note */}
      {isSettled ? (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-800">
          Dana bersih sebesar <strong>{formatPrice(netAmount)}</strong> telah berhasil dicairkan dan ditransfer oleh Superadmin.
        </div>
      ) : isRequested ? (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          Permohonan pencairan dana telah <strong>dibuka oleh panitia</strong> dan sedang berada di antrean transfer Superadmin.
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-gray-600">
          Lengkapi rekening bank penyelenggara dan klik <strong>Buka &amp; Ajukan Settlement</strong> agar permohonan pencairan muncul pada antrean Superadmin.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Nama Bank *</label>
          <input
            value={bank}
            disabled={isSettled}
            onChange={(e) => {
              setBank(e.target.value);
              setErrors((p) => ({ ...p, bank: undefined }));
            }}
            aria-invalid={!!errors.bank}
            className={errors.bank ? inputErrCls : inputCls}
            placeholder="Contoh: BCA / Mandiri / BRI / BNI"
          />
          {errors.bank && <p role="alert" className="mt-1 text-xs font-medium text-error-500">{errors.bank}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Nomor Rekening *</label>
          <input
            value={accNum}
            disabled={isSettled}
            onChange={(e) => {
              setAccNum(e.target.value);
              setErrors((p) => ({ ...p, accNum: undefined }));
            }}
            aria-invalid={!!errors.accNum}
            className={errors.accNum ? inputErrCls : inputCls}
            placeholder="Contoh: 1234567890"
          />
          {errors.accNum && <p role="alert" className="mt-1 text-xs font-medium text-error-500">{errors.accNum}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Atas Nama Rekening *</label>
          <input
            value={accHolder}
            disabled={isSettled}
            onChange={(e) => {
              setAccHolder(e.target.value);
              setErrors((p) => ({ ...p, accHolder: undefined }));
            }}
            aria-invalid={!!errors.accHolder}
            className={errors.accHolder ? inputErrCls : inputCls}
            placeholder="Contoh: Panitia Tech Expo 2026"
          />
          {errors.accHolder && <p role="alert" className="mt-1 text-xs font-medium text-error-500">{errors.accHolder}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Catatan Pengajuan (Opsional)</label>
          <input
            value={notes}
            disabled={isSettled}
            onChange={(e) => setNotes(e.target.value)}
            className={inputCls}
            placeholder="Catatan tambahan untuk Superadmin..."
          />
        </div>

        {!isSettled && (
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={() => void save(false)}
              disabled={saving || requesting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Simpan Rekening
            </button>
            <button
              type="button"
              onClick={() => void save(true)}
              disabled={saving || requesting || netAmount <= 0}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-xs font-semibold text-white hover:bg-secondary/90 disabled:opacity-50 shadow-xs"
            >
              {requesting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Wallet className="h-3.5 w-3.5" />
              )}
              {isRequested ? "Perbarui Pengajuan Settlement" : "Buka & Ajukan Settlement"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}