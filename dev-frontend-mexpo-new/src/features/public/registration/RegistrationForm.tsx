/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Info,
  Loader2,
  Ticket as TicketIcon,
  Users,
  Store,
} from "lucide-react";

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
import { useAuth } from "@/context/AuthContext";

import { applyCommittee } from "@/services/event-users.service";
import TenantApplyForm from "@/features/dashboard/visitor/TenantApplyForm";

interface Props {
  event: Event;
  fields: RegistrationField[];
  ticketTypes: TicketType[];
}

const INPUT_CLS =
  "h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 transition-all placeholder:text-gray-400 focus:border-secondary focus:outline-hidden focus:ring-2 focus:ring-secondary/15";
const LABEL_CLS = "block mb-1.5 font-bold text-gray-800 text-sm";

function RegistrationIllustration() {
  return (
    <div className="relative w-44 h-44 sm:w-52 sm:h-52 mx-auto flex items-center justify-center select-none">
      {/* Sparkle decorative bursts */}
      <div className="absolute top-2 left-2 text-blue-300">
        <svg className="w-5 h-5 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 3v3m0 12v3m-9-9h3m12 0h3" strokeLinecap="round" />
        </svg>
      </div>
      <div className="absolute top-8 right-1 text-blue-400">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 7.4H22l-6 4.5 2.3 7.1-6.3-4.6-6.3 4.6 2.3-7.1-6-4.5h7.6z" />
        </svg>
      </div>
      <div className="absolute -bottom-1 left-6 text-blue-300">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 7.4H22l-6 4.5 2.3 7.1-6.3-4.6-6.3 4.6 2.3-7.1-6-4.5h7.6z" />
        </svg>
      </div>

      {/* Main Clipboard Container */}
      <div className="relative w-36 sm:w-40 h-44 sm:h-52 bg-white rounded-2xl shadow-xl shadow-blue-500/10 border-2 border-blue-200/80 p-3.5 flex flex-col -rotate-3 transition-transform hover:rotate-0 duration-300">
        {/* Top Clip */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-5 bg-gradient-to-b from-gray-200 to-gray-300 rounded-md border border-gray-300 flex items-center justify-center shadow-xs">
          <div className="w-7 h-1.5 bg-gray-400 rounded-full" />
        </div>

        {/* Paper lines / Checklist */}
        <div className="mt-4 space-y-3 flex-1">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-400 flex items-center justify-center text-secondary shrink-0">
              <svg className="w-3 h-3 text-secondary stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="h-2 bg-blue-100 rounded-full w-20" />
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-400 flex items-center justify-center text-secondary shrink-0">
              <svg className="w-3 h-3 text-secondary stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="h-2 bg-blue-100 rounded-full w-16" />
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-400 flex items-center justify-center text-secondary shrink-0">
              <svg className="w-3 h-3 text-secondary stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="h-2 bg-blue-100 rounded-full w-22" />
          </div>
        </div>

        {/* Overlapping Calendar Mini Badge */}
        <div className="absolute -bottom-3 -right-3 w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-xl shadow-lg border border-blue-100 p-1.5 rotate-6">
          <div className="w-full h-3 bg-secondary rounded-t-md flex justify-center items-center gap-1">
            <div className="w-1 h-1 bg-white rounded-full" />
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-1 p-1 mt-0.5">
            <div className="w-2 h-2 bg-blue-50 rounded-xs" />
            <div className="w-2 h-2 bg-blue-100 rounded-xs" />
            <div className="w-2 h-2 bg-blue-50 rounded-xs" />
            <div className="w-2 h-2 bg-blue-200 rounded-xs" />
            <div className="w-2 h-2 bg-secondary rounded-xs" />
            <div className="w-2 h-2 bg-blue-50 rounded-xs" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegistrationForm({ event, fields, ticketTypes }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("return_url");
  const urlRole = searchParams.get("role")?.toUpperCase();
  const { user, isAuthenticated } = useAuthStore();
  const { isLoadingAuth } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // By default, registration is purely VISITOR as requested.
  const [registrationType, setRegistrationType] = useState<"VISITOR" | "TENANT" | "COMMITTEE">(
    urlRole === "TENANT" ? "TENANT" : urlRole === "COMMITTEE" ? "COMMITTEE" : "VISITOR"
  );
  // Toggle to optionally reveal other role options if the user specifically requests it
  const [showRoleOptions, setShowRoleOptions] = useState(urlRole === "TENANT" || urlRole === "COMMITTEE");

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ticketTypeId, setTicketTypeId] = useState(ticketTypes[0]?.uuid ?? "");
  const [showManualPayment, setShowManualPayment] = useState(false);
  const [payment, setPayment] = useState({ payment_reference: "", payment_method: "CASH" });
  // Midtrans Snap intent returned by the public registration for PAID events.
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<TransactionStatus | "UNKNOWN">("UNKNOWN");
  const [paymentBusy, setPaymentBusy] = useState(false);
  // True until we've verified the caller isn't already registered in this event.
  const [checkingRegistration, setCheckingRegistration] = useState(true);

  const isPaidEvent =
    event.ticket_mode === "PAID" && event.features?.paidTicket !== false;

  const selectedTicket =
    ticketTypes.find((t) => t.uuid === ticketTypeId) || ticketTypes[0];

  const isTicketActuallyPaid = Boolean(
    isPaidEvent && selectedTicket && selectedTicket.price > 0
  );

  // Pre-load Snap script so checkout modal opens with zero delay (only for paid tickets)
  useEffect(() => {
    if (isTicketActuallyPaid) {
      void loadSnapScript();
    }
  }, [isTicketActuallyPaid]);

  useEffect(() => {
    if (isLoadingAuth) return;

    if (!isAuthenticated || !user) {
      const current = `${window.location.pathname}${window.location.search}`;
      toast.error("Silakan masuk terlebih dahulu untuk mendaftar.");
      router.push(`/auth?next=${encodeURIComponent(current)}`);
    }
  }, [isLoadingAuth, isAuthenticated, user, router]);

  // Block re-registration if already an approved participant
  useEffect(() => {
    if (isLoadingAuth || !isAuthenticated || !user) {
      if (!isLoadingAuth) setCheckingRegistration(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setCheckingRegistration(true);
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
        // Network/server error — fall through; backend still guards duplicates
      } finally {
        if (!cancelled) setCheckingRegistration(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoadingAuth, isAuthenticated, user, event.uuid, event.slug, router]);

  const setAnswer = (key: string, value: string) =>
    setAnswers((a) => ({ ...a, [key]: value }));

  // Only render fields whose condition (if any) is satisfied
  const visibleFields = fields.filter((f) => {
    if (!f.condition) return true;
    return (answers[f.condition.field_key] ?? "") === f.condition.value;
  });

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
        organization: answers["organization"] || answers["asal_instansi"] || user.organization || undefined,
        answers: visibleFields.map((f) => ({
          field_key: f.field_key,
          value: answers[f.field_key] ?? "",
        })),
      };
      if (isPaidEvent && selectedTicket) {
        payload.ticket_type_id = selectedTicket.uuid;
        if (isTicketActuallyPaid && showManualPayment && payment.payment_reference.trim()) {
          payload.payment_reference = payment.payment_reference.trim();
          payload.payment_method = payment.payment_method;
        }
      }
      const res = await registerVisitor(event.uuid, payload);
      if (!res.status) throw new Error(res.message || "Gagal mendaftar");
      setSubmitted(true);

      // Snap checkout for paid tickets
      if (isTicketActuallyPaid && !showManualPayment) {
        const paymentData = (res.data as { payment?: unknown } | null)?.payment;
        let intent = paymentData as unknown as PaymentIntent | undefined;

        if (!intent?.snap_token && isAuthenticated) {
          try {
            const checkoutRes = await checkout(event.uuid, {
              ticket_type_id: selectedTicket?.uuid,
            });
            if (checkoutRes.status && checkoutRes.data) {
              intent = checkoutRes.data as unknown as PaymentIntent;
            }
          } catch (err) {
            console.error("Checkout fallback error:", err);
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

  const statusLabel: Record<string, { text: string; cls: string }> = {
    PAID: { text: "Pembayaran berhasil", cls: "text-emerald-600" },
    PENDING: { text: "Menunggu pembayaran", cls: "text-amber-600" },
    EXPIRED: { text: "Waktu pembayaran habis", cls: "text-red-600" },
    FAILED: { text: "Pembayaran gagal", cls: "text-red-600" },
    REFUNDED: { text: "Dana telah dikembalikan", cls: "text-gray-500" },
  };

  if (isLoadingAuth || checkingRegistration) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb / Back Button */}
        <div className="mb-6">
          <Link
            href={`/event/${event.slug ?? event.uuid}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-brand-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Event</span>
          </Link>
        </div>

        {/* Main Card Container with Two Columns */}
        <div className="bg-white rounded-3xl border border-blue-50 shadow-xl shadow-slate-100/70 p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Visual Illustration + Title */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center text-center lg:border-r lg:border-slate-100 lg:pr-8 py-2">
              <RegistrationIllustration />
              <h2 className="mt-6 font-extrabold text-2xl text-gray-900 tracking-tight">
                Daftar Sekarang!
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-gray-500 max-w-xs leading-relaxed">
                Jangan lewatkan kesempatan untuk bergabung dalam event bersama Mexpo.
              </p>

              {/* Optional role toggle link for tenants/committee */}
              <div className="mt-8 pt-6 border-t border-slate-100 w-full text-center">
                {!showRoleOptions ? (
                  <button
                    type="button"
                    onClick={() => setShowRoleOptions(true)}
                    className="text-xs font-semibold text-secondary hover:text-brand-700 hover:underline transition-colors"
                  >
                    Daftar sebagai Tenant atau Panitia?
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setRegistrationType("VISITOR");
                      setShowRoleOptions(false);
                    }}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    ← Sembunyikan opsi peran lain
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Form and Stepper Content */}
            <div className="lg:col-span-8 flex flex-col">
              
              {/* Optional Role Selector: only shown if user clicks to see other roles */}
              {showRoleOptions && (
                <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <p className="text-xs font-semibold text-gray-600 mb-2.5 text-center">
                    Pilih Peran Pendaftaran:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRegistrationType("VISITOR")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        registrationType === "VISITOR"
                          ? "bg-secondary text-white shadow-xs"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      Pengunjung
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegistrationType("TENANT")}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        registrationType === "TENANT"
                          ? "bg-amber-600 text-white shadow-xs"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      Penyewa (Tenant)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegistrationType("COMMITTEE")}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        registrationType === "COMMITTEE"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      Panitia (Committee)
                    </button>
                  </div>
                </div>
              )}

              {/* Title Section (Matching screenshot) */}
              <div className="text-center mb-6">
                <span className="inline-block px-4 py-1 rounded-full bg-blue-50 text-secondary text-xs font-bold tracking-wide">
                  Pendaftaran Event
                </span>
                <h1 className="mt-2.5 font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight">
                  Formulir Pendaftaran
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                  {registrationType === "VISITOR"
                    ? "Pilih jenis pendaftaran yang sesuai dengan peran Anda di event ini."
                    : registrationType === "TENANT"
                    ? "Isi formulir pendaftaran tenant dan booth untuk event ini."
                    : "Ajukan diri menjadi bagian dari panitia penyelenggara event."}
                </p>
              </div>

              {/* Stepper (1. Data Peserta -> 2. Konfirmasi -> 3. Selesai) */}
              <div className="flex items-center justify-center max-w-sm sm:max-w-md mx-auto w-full mb-6 select-none">
                {/* Step 1 */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      !submitted
                        ? "bg-secondary text-white shadow-md shadow-secondary/30 ring-2 ring-blue-100"
                        : "bg-emerald-500 text-white"
                    }`}
                  >
                    1
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold mt-1 text-secondary">
                    Data Peserta
                  </span>
                </div>

                {/* Line 1-2 */}
                <div className="flex-1 h-[2px] bg-gray-200 mx-2 sm:mx-4 -mt-4" />

                {/* Step 2 */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                      isTicketActuallyPaid && !submitted
                        ? "bg-white border-secondary text-secondary font-bold"
                        : submitted
                        ? "bg-emerald-500 text-white border-transparent"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    2
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-medium mt-1 text-gray-400">
                    Konfirmasi
                  </span>
                </div>

                {/* Line 2-3 */}
                <div className="flex-1 h-[2px] bg-gray-200 mx-2 sm:mx-4 -mt-4" />

                {/* Step 3 */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                      submitted
                        ? "bg-secondary text-white shadow-md shadow-secondary/30 border-transparent"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    3
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-medium mt-1 text-gray-400">
                    Selesai
                  </span>
                </div>
              </div>

              {/* Alert Info Banner */}
              <div className="flex items-center gap-2.5 sm:gap-3 bg-blue-50/70 border border-blue-100/90 rounded-2xl p-3 sm:p-4 text-xs sm:text-sm text-secondary font-medium mb-6">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-secondary shrink-0" />
                <span>
                  Pastikan data yang Anda isi sudah benar untuk proses pendaftaran yang lebih mudah.
                </span>
              </div>

              {/* Submitted State View */}
              {submitted ? (
                <div className="py-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Pendaftaran Berhasil!</h3>
                  <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                    Kamu berhasil mendaftar ke <strong>{event.name}</strong>.
                    {isTicketActuallyPaid
                      ? " Lanjutkan ke pembayaran tiket untuk mengaktifkan tiketmu."
                      : " Tiket kamu sudah aktif dan dapat diakses langsung melalui dashboard."}
                  </p>

                  {/* Free Ticket Info Card */}
                  {!isTicketActuallyPaid && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 text-left max-w-md mx-auto">
                      <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                          Status Tiket
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aktif (Gratis)
                        </span>
                      </div>
                      <div className="mt-2.5 space-y-1 text-xs text-gray-600">
                        <p><strong>Nama:</strong> {user.full_name}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        {selectedTicket && (
                          <p><strong>Kategori:</strong> {selectedTicket.name} (Gratis)</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Paid Ticket Checkout Card */}
                  {isTicketActuallyPaid && paymentIntent && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-left max-w-md mx-auto shadow-xs">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <span className="text-xs font-semibold text-gray-500">Tagihan Tiket</span>
                        <span className="text-base font-bold text-gray-900">
                          Rp {paymentIntent.amount.toLocaleString("id-ID")}
                        </span>
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
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-secondary/90 disabled:opacity-50 transition-colors shadow-md shadow-secondary/25"
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
                    </div>
                  )}

                  <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-2.5">
                    {returnUrl && (
                      <a
                        href={returnUrl}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 w-full sm:w-auto"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Kembali ke Website Sekolah
                      </a>
                    )}
                    <Link
                      href={`/dashboard/${event.slug ?? event.uuid}`}
                      className="rounded-xl bg-secondary px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-secondary/90 w-full sm:w-auto text-center shadow-xs"
                    >
                      Buka E-Ticket &amp; QR Code
                    </Link>
                    <Link
                      href={`/event/${event.slug ?? event.uuid}`}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 w-full sm:w-auto text-center"
                    >
                      Lihat Detail Event
                    </Link>
                  </div>
                </div>
              ) : registrationType === "TENANT" ? (
                /* Tenant Registration */
                <TenantApplyForm event={event} />
              ) : registrationType === "COMMITTEE" ? (
                /* Committee Registration */
                <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-6 text-center max-w-lg mx-auto">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Daftar Sebagai Panitia</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-6">
                    Bergabunglah menjadi bagian dari panitia <strong>{event.name}</strong>. Permintaan Anda akan ditinjau oleh penyelenggara.
                  </p>
                  <button
                    type="button"
                    onClick={handleCommitteeApply}
                    disabled={submitting}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center transition-colors"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kirim Pengajuan Panitia"}
                  </button>
                </div>
              ) : (
                /* Main Visitor Form (Default View matching Screenshot) */
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Ticket Category Notice */}
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-800">
                    <TicketIcon className="w-4 h-4 text-secondary shrink-0" />
                    <span>
                      {selectedTicket
                        ? `Kategori Ikut ${selectedTicket.name} (${
                            selectedTicket.price > 0
                              ? `Rp ${selectedTicket.price.toLocaleString("id-ID")}`
                              : "Gratis"
                          }) – tiket langsung aktif setelah pendaftaran.`
                        : "Kategori Ikut Reguler (Gratis) – tiket langsung aktif setelah pendaftaran."}
                    </span>
                  </div>

                  {/* Ticket Selection Dropdown */}
                  {ticketTypes.length > 0 && (
                    <div>
                      <label className={LABEL_CLS}>
                        Pilih Kategori Tiket <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                          <TicketIcon className="w-4 h-4 text-secondary" />
                        </div>
                        <select
                          value={ticketTypeId}
                          onChange={(e) => setTicketTypeId(e.target.value)}
                          className={`${INPUT_CLS} appearance-none pl-10 pr-10 cursor-pointer`}
                        >
                          {ticketTypes.map((t) => (
                            <option key={t.uuid} value={t.uuid}>
                              {t.name} ({t.price > 0 ? `Rp ${t.price.toLocaleString("id-ID")}` : "Gratis - Gratis Rp 0"})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                      </div>
                    </div>
                  )}

                  {/* Manual Payment Option for Paid Tickets */}
                  {isTicketActuallyPaid && (
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowManualPayment(!showManualPayment)}
                        className="text-xs font-semibold text-secondary hover:underline"
                      >
                        {showManualPayment
                          ? "← Kembali ke Pembayaran Online (Midtrans)"
                          : "+ Punya bukti transfer / Bayar via kasir panitia (Manual)?"}
                      </button>

                      {showManualPayment && (
                        <div className="mt-3 space-y-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
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

                  {/* Dynamic Registration Fields */}
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
                          placeholder={`Masukkan ${f.label.toLowerCase()}`}
                          className="h-24 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-secondary focus:outline-hidden focus:ring-2 focus:ring-secondary/15"
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
                            className="h-4 w-4 accent-secondary"
                          />
                          Ya
                        </label>
                      ) : f.type === "NUMBER" ? (
                        <input
                          type="number"
                          required={f.required}
                          value={answers[f.field_key] ?? ""}
                          onChange={(e) => setAnswer(f.field_key, e.target.value)}
                          placeholder={`Masukkan ${f.label.toLowerCase()}`}
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
                          placeholder={`Masukkan ${f.label.toLowerCase()} Anda`}
                          className={INPUT_CLS}
                        />
                      )}
                    </div>
                  ))}

                  {/* Fallback inputs if no dynamic fields configured by event organizer */}
                  {visibleFields.length === 0 && (
                    <>
                      <div>
                        <label className={LABEL_CLS}>
                          Asal Instansi/Perusahaan <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={answers["asal_instansi"] ?? user.organization ?? ""}
                          onChange={(e) => setAnswer("asal_instansi", e.target.value)}
                          placeholder="Masukkan asal instansi atau perusahaan Anda"
                          className={INPUT_CLS}
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>Jabatan</label>
                        <input
                          type="text"
                          value={answers["jabatan"] ?? ""}
                          onChange={(e) => setAnswer("jabatan", e.target.value)}
                          placeholder="Masukkan jabatan Anda"
                          className={INPUT_CLS}
                        />
                      </div>
                    </>
                  )}

                  {/* Submit CTA Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-semibold py-3.5 px-6 text-sm sm:text-base shadow-md shadow-secondary/25 transition-all duration-200 disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <TicketIcon className="w-4 h-4" />
                          <span>
                            {isTicketActuallyPaid
                              ? "Daftar & Lanjut Pembayaran"
                              : "Daftar Sekarang (Gratis)"}
                          </span>
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
