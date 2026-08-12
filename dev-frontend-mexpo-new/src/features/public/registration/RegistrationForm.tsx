"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Ticket as TicketIcon } from "lucide-react";

import Input from "@/shared/components/form/Input";
import { Event, RegistrationField, TicketType } from "@/entities/event/event.entity";
import {
  registerVisitor,
  RegisterVisitorPayload,
} from "@/services/registration.service";
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

  useEffect(() => {
    if (!isAuthenticated || !user) {
      toast.error("Silakan login terlebih dahulu untuk mendaftar.");
      router.push("/auth");
    }
  }, [isAuthenticated, user, router]);

  const isPaid = event.ticket_mode === "PAID";

  const setAnswer = (key: string, value: string) =>
    setAnswers((a) => ({ ...a, [key]: value }));

  // A8 — only render fields whose condition (if any) is satisfied.
  const visibleFields = fields.filter((f) => {
    if (!f.condition) return true;
    return (answers[f.condition.field_key] ?? "") === f.condition.value;
  });

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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan server");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mb-4 flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Pendaftaran Berhasil!</h1>
        <p className="mb-6 text-sm text-gray-500">
          Kamu berhasil mendaftar ke {event.name}.
          {isPaid
            ? " Pembayaran tiket akan diproses oleh panitia."
            : " Sampai jumpa di event!"}
        </p>
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
                  {t.name} — Rp {t.price.toLocaleString("id-ID")}
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
