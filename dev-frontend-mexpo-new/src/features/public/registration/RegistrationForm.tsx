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
import { getTransaction } from "@/services/payment.service";
import { loadSnapScript, payWithSnap } from "@/shared/utils/snap";
import { useAuthStore } from "@/stores/auth.store";

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
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ticketTypeId, setTicketTypeId] = useState(ticketTypes[0]?.uuid ?? "");
  const [payment, setPayment] = useState({ payment_reference: "", payment_method: "CASH" });
  // Midtrans Snap intent returned by the public registration for PAID events.
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<TransactionStatus | "UNKNOWN">("UNKNOWN");
  const [paymentBusy, setPaymentBusy] = useState(false);
  // True until we've verified the caller isn't already registered in this event.
  const [checkingRegistration, setCheckingRegistration] = useState(
    isAuthenticated && !!user,
  );

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

  const isPaid =
    event.ticket_mode === "PAID" || event.features?.paidTicket === true;

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
      if (!ready) {
        toast.error("Gagal memuat Midtrans Snap. Coba lagi nanti.");
        return;
      }
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
    if (paymentIntent) {
      await triggerSnap(paymentIntent);
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
        payload.payment_reference = payment.payment_reference || undefined;
        payload.payment_method = payment.payment_method || undefined;
      }
      const res = await registerVisitor(event.uuid, payload);
      if (!res.status) throw new Error(res.message || "Gagal mendaftar");
      setSubmitted(true);

      // A1b — public registration returns the Midtrans Snap intent for paid
      // events, so the fresh visitor can pay right away (no login needed).
      const paymentData = (res.data as { payment?: unknown } | null)?.payment;
      if (isPaid && paymentData && typeof paymentData === "object") {
        const intent = paymentData as unknown as PaymentIntent;
        setPaymentIntent(intent);
        setPaymentStatus("PENDING");
        // Automatically open Snap popup for immediate checkout
        void triggerSnap(intent);
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

  if (checkingRegistration) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-secondary" />
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

        {isPaid && paymentIntent && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 text-left">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-sm font-medium text-gray-600">
                Tagihan Tiket
              </span>
              <span className="text-lg font-bold text-gray-900">
                Rp {paymentIntent.amount.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center justify-between text-gray-500">
                <span>Biaya tiket</span>
                <span>Rp {paymentIntent.amount.toLocaleString("id-ID")}</span>
              </div>
              {paymentIntent.platform_fee > 0 && (
                <div className="flex items-center justify-between text-gray-500">
                  <span>Biaya platform</span>
                  <span>Rp {paymentIntent.platform_fee.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex items-center justify-between font-semibold text-gray-800">
                <span>Total dibayar</span>
                <span>Rp {paymentIntent.amount.toLocaleString("id-ID")}</span>
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
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Registrasi</h1>
      <p className="mb-6 text-sm text-gray-500">{event.name}</p>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-gray-100 bg-white p-6"
      >
        <div className="rounded-lg bg-blue-50/60 p-4 text-sm text-gray-700">
          {isPaid ? (
            <span>
              Tiket berbayar — pilih tiket dan siapkan referensi pembayaran
              (manual/POS).
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
          <>
            <Input
              label="Referensi Pembayaran (opsional)"
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
          </>
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
      </form>
    </div>
  );
}
