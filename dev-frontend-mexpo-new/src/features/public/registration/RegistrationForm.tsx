"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Ticket as TicketIcon } from "lucide-react";

import Input from "@/shared/components/form/Input";
import { Event, RegistrationField, TicketType } from "@/entities/event/event.entity";
import { PaymentIntent, TransactionStatus } from "@/entities/payment/payment.entity";
import {
  registerVisitor,
  RegisterVisitorPayload,
} from "@/services/registration.service";
import { getEventByUuidByMe } from "@/services/event.service";
import { checkout, getTransaction } from "@/services/payment.service";
import { loadSnapScript, payWithSnap } from "@/shared/utils/snap";
import { useAuthStore } from "@/stores/auth.store";

import { applyCommittee } from "@/services/event-users.service";
import TenantApplyForm from "@/features/dashboard/visitor/TenantApplyForm";

interface Props {
  event: Event;
  fields: RegistrationField[];
  ticketTypes: TicketType[];
}

const INPUT_CLS =
  "h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-white text-gray-800 focus:border-brand-300 focus:outline-hidden";
const LABEL_CLS = "block mb-2 font-medium text-gray-700 text-sm";

export default function RegistrationForm({ event, fields, ticketTypes }: Props) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [registrationType, setRegistrationType] = useState<"VISITOR" | "TENANT" | "COMMITTEE">("VISITOR");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ticketTypeId, setTicketTypeId] = useState(ticketTypes[0]?.uuid ?? "");
  const [showManualPayment, setShowManualPayment] = useState(false);
  const [payment, setPayment] = useState({ payment_reference: "", payment_method: "CASH" });
  // Midtrans Snap intent returned by the public registration for PAID events.
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<TransactionStatus | "UNKNOWN">("UNKNOWN");
  const [paymentBusy, setPaymentBusy] = useState(false);
  // True until we've verified the caller isn't already registered in this event.
  const [checkingRegistration, setCheckingRegistration] = useState(
    isAuthenticated && !!user,
  );

  const isPaid =
    event.ticket_mode === "PAID" || event.features?.paidTicket === true;

  // Pre-load Snap script so the checkout modal opens with zero delay
  useEffect(() => {
    if (isPaid) {
      void loadSnapScript();
    }
  }, [isPaid]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      const current = `${window.location.pathname}${window.location.search}`;
      toast.error("Silakan masuk terlebih dahulu untuk mendaftar.");
      router.push(`/auth?next=${encodeURIComponent(current)}`);
    }
  }, [isAuthenticated, user, router]);

  // If the caller is already an approved participant of this event (OWNER / COMMITTEE /
  // TENANT / VISITOR), block re-registration and send them to the dashboard.
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getEventByUuidByMe(event.uuid);
        const roles = (res.data as Event | null)?.userEventRoles;
        if (cancelled) return;
        const approvedRole = roles?.find((r) => r.status === "APPROVED");
        if (res.status && approvedRole) {
          toast.info("Kamu sudah terdaftar di event ini.");
          router.push(`/dashboard/${event.slug ?? event.uuid}`);
          return;
        }
      } catch {
        // Network/server error — fall through; the backend still guards
        // duplicates on submit.
      } finally {
        if (!cancelled) setCheckingRegistration(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user, event.uuid, event.slug, router]);

  const setAnswer = (key: string, value: string) =>
    setAnswers((a) => ({ ...a, [key]: value }));

  // A8 — only render fields whose condition (if any) is satisfied.
  const visibleFields = fields.filter((f) => {
    if (!f.condition) return true;
    return (answers[f.condition.field_key] ?? "") === f.condition.value;
  });

  // A1b — poll the transaction so the submitted screen reflects the real
  // status after the user pays (or abandons) the Snap popup.
  const pollTransaction = async (txUuid: string, attempts = 10) => {
    for (let i = 0; i < attempts; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await getTransaction(txUuid);
        if (!res.status || !res.data) continue;
        setPaymentStatus(res.data.status);
        if (["PAID", "EXPIRED", "FAILED", "REFUNDED"].includes(res.data.status)) {
          return;
        }
      } catch {
        // transient — keep polling
      }
    }
  };

  const triggerSnap = async (intent: PaymentIntent) => {
    if (!intent?.snap_token) return;
    setPaymentBusy(true);
    try {
      const ready = await loadSnapScript();
      if (!ready || typeof window === "undefined" || !window.snap) {
        toast.error("Gagal memuat Midtrans Snap. Coba klik 'Lanjut ke Pembayaran' lagi.");
        return;
      }
      localStorage.setItem("mexpo_payment_redirect", `/dashboard/${event.slug ?? event.uuid}`);
      payWithSnap(intent.snap_token, {
        onSuccess: () => {
          setPaymentStatus("PAID");
          toast.success("Pembayaran berhasil!");
          void pollTransaction(intent.transaction_uuid, 5);
        },
        onPending: () => {
          setPaymentStatus("PENDING");
          void pollTransaction(intent.transaction_uuid, 20);
        },
        onClose: () => {
          void pollTransaction(intent.transaction_uuid, 10);
        },
        onError: () => {
          toast.error("Pembayaran gagal. Silakan coba lagi.");
        },
      });
    } catch {
      toast.error("Gagal membuka pembayaran.");
    } finally {
      setPaymentBusy(false);
    }
  };

  const openSnap = async () => {
    setPaymentBusy(true);
    try {
      let intent = paymentIntent;
      if (!intent?.snap_token) {
        const checkoutRes = await checkout(event.uuid, {
          ticket_type_id: ticketTypeId || undefined,
        });
        if (checkoutRes.status && checkoutRes.data) {
          intent = checkoutRes.data as unknown as PaymentIntent;
          setPaymentIntent(intent);
          setPaymentStatus("PENDING");
        } else {
          toast.error(checkoutRes.message || "Gagal membuat transaksi pembayaran Midtrans.");
          return;
        }
      }
      if (intent?.snap_token) {
        await triggerSnap(intent);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuka pembayaran.");
    } finally {
      setPaymentBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const payload: RegisterVisitorPayload = {
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        organization: user.organization || undefined,
        answers: visibleFields.map((f) => ({
          field_key: f.field_key,
          value: answers[f.field_key] ?? "",
        })),
      };
      if (isPaid) {
        payload.ticket_type_id = ticketTypeId || undefined;
        if (showManualPayment && payment.payment_reference.trim()) {
          payload.payment_reference = payment.payment_reference.trim();
          payload.payment_method = payment.payment_method;
        }
      }
      const res = await registerVisitor(event.uuid, payload);
      if (!res.status) throw new Error(res.message || "Gagal mendaftar");
      setSubmitted(true);

      // A1b — public registration returns the Midtrans Snap intent for paid
      // events, so the fresh visitor can pay right away (no login needed).
      if (isPaid && !showManualPayment) {
        const paymentData = (res.data as { payment?: unknown } | null)?.payment;
        let intent = paymentData as unknown as PaymentIntent | undefined;

        if (!intent?.snap_token && isAuthenticated) {
          try {
            const checkoutRes = await checkout(event.uuid, {
              ticket_type_id: ticketTypeId || undefined,
            });
            if (checkoutRes.status && checkoutRes.data) {
              intent = checkoutRes.data as unknown as PaymentIntent;
            } else {
              console.error("Checkout fallback failed:", checkoutRes.message);
            }
          } catch (err) {
            console.error("Checkout fallback threw error:", err);
            // fallback handled by openSnap button
          }
        }

        if (intent?.snap_token) {
          setPaymentIntent(intent);
          setPaymentStatus("PENDING");
          void triggerSnap(intent);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan server");
    } finally {
      setSubmitting(false);
    }
  };

  const statusLabel: Record<string, { text: string; cls: string }> = {
    PAID: { text: "Pembayaran berhasil", cls: "text-emerald-600" },
    PENDING: { text: "Menunggu pembayaran", cls: "text-amber-600" },
    EXPIRED: { text: "Waktu pembayaran habis", cls: "text-red-600" },
    FAILED: { text: "Pembayaran gagal", cls: "text-red-600" },
    REFUNDED: { text: "Dana telah dikembalikan", cls: "text-gray-500" },
  };

  if (!user) return null;

  const handleCommitteeApply = async () => {
    setSubmitting(true);
    try {
      const res = await applyCommittee(event.uuid);
      if (!res.status) throw new Error(res.message || "Gagal mengajukan panitia");
      toast.success("Pengajuan panitia berhasil dikirim.");
      router.push(`/dashboard/${event.slug ?? event.uuid}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengajukan panitia.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingRegistration) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mb-4 flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Pendaftaran Berhasil!</h1>
        <p className="mb-6 text-sm text-gray-500">
          Kamu berhasil mendaftar ke {event.name}.
          {isPaid ? " Lanjutkan ke pembayaran tiket untuk mengaktifkan tiketmu." : " Sampai jumpa di event!"}
        </p>

        {isPaid && (paymentIntent || true) && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 text-left">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-sm font-medium text-gray-600">
                Tagihan Tiket
              </span>
              <span className="text-lg font-bold text-gray-900">
                {paymentIntent ? `Rp ${paymentIntent.amount.toLocaleString("id-ID")}` : "-"}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center justify-between text-gray-500">
                <span>Biaya tiket</span>
                <span>{paymentIntent ? `Rp ${paymentIntent.amount.toLocaleString("id-ID")}` : "-"}</span>
              </div>
              {paymentIntent && paymentIntent.platform_fee > 0 && (
                <div className="flex items-center justify-between text-gray-500">
                  <span>Biaya platform</span>
                  <span>Rp {paymentIntent.platform_fee.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex items-center justify-between font-semibold text-gray-800">
                <span>Total dibayar</span>
                <span>{paymentIntent ? `Rp ${paymentIntent.amount.toLocaleString("id-ID")}` : "-"}</span>
              </div>
            </div>

            {paymentStatus && statusLabel[paymentStatus] && (
              <p className={`mt-3 text-xs font-semibold ${statusLabel[paymentStatus].cls}`}>
                {statusLabel[paymentStatus].text}
              </p>
            )}

            {paymentStatus !== "PAID" && (
              <button
                type="button"
                onClick={() => void openSnap()}
                disabled={paymentBusy}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-3 text-sm font-semibold text-white hover:bg-secondary/80 disabled:opacity-50"
              >
                {paymentBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TicketIcon className="h-4 w-4" />
                )}
                {paymentStatus === "EXPIRED" || paymentStatus === "FAILED"
                  ? "Coba Bayar Lagi"
                  : "Lanjut ke Pembayaran"}
              </button>
            )}
            {paymentStatus === "PAID" && (
              <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-700">
                Tiket sudah aktif — QR check-in kamu tersedia di dashboard.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-center gap-3">
          <Link
            href={`/event/${event.slug ?? event.uuid}`}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary/80"
          >
            Lihat Event
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href={`/event/${event.slug ?? event.uuid}`}
        className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-800"
      >
        ← Kembali ke Event
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Formulir Pendaftaran</h2>
        <p className="text-gray-500">Pilih jenis pendaftaran yang sesuai dengan peran Anda di event ini.</p>
        
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setRegistrationType("VISITOR")}
            className={`px-6 py-2.5 rounded-full font-medium transition-colors border ${
              registrationType === "VISITOR"
                ? "bg-brand-50 border-brand-200 text-brand-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Pengunjung
          </button>
          <button
            type="button"
            onClick={() => setRegistrationType("TENANT")}
            className={`px-6 py-2.5 rounded-full font-medium transition-colors border ${
              registrationType === "TENANT"
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Penyewa (Tenant)
          </button>
          <button
            type="button"
            onClick={() => setRegistrationType("COMMITTEE")}
            className={`px-6 py-2.5 rounded-full font-medium transition-colors border ${
              registrationType === "COMMITTEE"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Panitia (Committee)
          </button>
        </div>
      </div>

      {registrationType === "TENANT" && (
        <TenantApplyForm event={event} />
      )}

      {registrationType === "COMMITTEE" && (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Daftar Sebagai Panitia</h3>
          <p className="text-gray-600 mb-8">
            Bergabunglah menjadi bagian dari penyelenggara event <strong>{event.name}</strong>. Permintaan Anda akan ditinjau oleh manajer event.
          </p>
          <button
            type="button"
            onClick={handleCommitteeApply}
            disabled={submitting}
            className="w-full h-12 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center transition-colors"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Kirim Pengajuan"}
          </button>
        </div>
      )}

      {registrationType === "VISITOR" && (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8 space-y-6">
        <div className="rounded-lg bg-blue-50/60 p-4 text-sm text-gray-700">
          {isPaid ? (
            <span>
              Tiket berbayar — pembayaran online instan via Midtrans Snap (QRIS, E-Wallet, VA Bank).
            </span>
          ) : (
            <span>Event gratis — tiket otomatis diterbitkan setelah pendaftaran.</span>
          )}
        </div>

        {isPaid && ticketTypes.length > 0 && (
          <div>
            <label className={LABEL_CLS}>Pilih Tiket</label>
            <select
              value={ticketTypeId}
              onChange={(e) => setTicketTypeId(e.target.value)}
              className={INPUT_CLS}
            >
              {ticketTypes.map((t) => (
                <option key={t.uuid} value={t.uuid}>
                  {t.name} — Rp {t.price?.toLocaleString("id-ID")}
                </option>
              ))}
            </select>
          </div>
        )}

        {isPaid && (
          <div className="border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => setShowManualPayment(!showManualPayment)}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              {showManualPayment
                ? "← Kembali ke Pembayaran Online (Midtrans)"
                : "+ Punya bukti transfer / Bayar via kasir panitia (Manual)?"}
            </button>

            {showManualPayment && (
              <div className="mt-3 space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                <Input
                  label="Referensi Pembayaran"
                  value={payment.payment_reference}
                  onChange={(e) =>
                    setPayment({ ...payment, payment_reference: e.target.value })
                  }
                  placeholder="No. invoice / bukti transfer"
                />
                <div>
                  <label className={LABEL_CLS}>Metode Pembayaran</label>
                  <select
                    value={payment.payment_method}
                    onChange={(e) =>
                      setPayment({ ...payment, payment_method: e.target.value })
                    }
                    className={INPUT_CLS}
                  >
                    <option value="CASH">Cash</option>
                    <option value="QRIS">QRIS</option>
                    <option value="TRANSFER">Transfer</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {visibleFields.map((f) => (
          <div key={f.field_key}>
            <label className={LABEL_CLS}>
              {f.label} {f.required && <span className="text-red-500">*</span>}
            </label>
            {f.type === "TEXTAREA" ? (
              <textarea
                required={f.required}
                value={answers[f.field_key] ?? ""}
                onChange={(e) => setAnswer(f.field_key, e.target.value)}
                className="h-28 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-white text-gray-800"
              />
            ) : f.type === "SELECT" ? (
              <select
                required={f.required}
                value={answers[f.field_key] ?? ""}
                onChange={(e) => setAnswer(f.field_key, e.target.value)}
                className={INPUT_CLS}
              >
                <option value="">Pilih...</option>
                {(f.options ?? []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : f.type === "BOOLEAN" ? (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={answers[f.field_key] === "true"}
                  onChange={(e) =>
                    setAnswer(f.field_key, e.target.checked ? "true" : "false")
                  }
                  className="h-4 w-4 accent-brand-500"
                />
                Ya
              </label>
            ) : f.type === "NUMBER" ? (
              <input
                type="number"
                required={f.required}
                value={answers[f.field_key] ?? ""}
                onChange={(e) => setAnswer(f.field_key, e.target.value)}
                className={INPUT_CLS}
              />
            ) : f.type === "DATE" ? (
              <input
                type="date"
                required={f.required}
                value={answers[f.field_key] ?? ""}
                onChange={(e) => setAnswer(f.field_key, e.target.value)}
                className={INPUT_CLS}
              />
            ) : (
              <input
                type={f.type === "EMAIL" ? "email" : "text"}
                required={f.required}
                value={answers[f.field_key] ?? ""}
                onChange={(e) => setAnswer(f.field_key, e.target.value)}
                className={INPUT_CLS}
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-3.5 font-semibold text-white transition-colors hover:bg-secondary/80 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <TicketIcon className="h-4 w-4" />}
          {isPaid ? "Daftar & Dapatkan Tiket" : "Daftar Sekarang"}
        </button>
        </div>
      </form>
      )}
    </div>
  );
}
