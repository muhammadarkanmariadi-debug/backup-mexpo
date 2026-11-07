"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  FileText,
  Globe,
  LayoutGrid,
  Loader2,
  Lock,
  MapPin,
  Sliders,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";

import Input from "@/shared/components/form/Input";
import CurrencyInput from "@/shared/components/form/CurrencyInput";
import FormattedNumberInput from "@/shared/components/form/FormattedNumberInput";
import {
  Event,
  EventFeatures,
  EventType,
  EventVisibility,
  SouvenirTier,
} from "@/entities/event/event.entity";
import { createEvent, updateEvent } from "@/services/event.service";
import {
  EVENT_TYPE_LABELS,
  EVENT_FEATURE_LABELS,
} from "@/shared/data/labels";

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "EXPO", label: EVENT_TYPE_LABELS.EXPO },
  { value: "CAREER_FAIR", label: EVENT_TYPE_LABELS.CAREER_FAIR },
  { value: "SEMINAR", label: EVENT_TYPE_LABELS.SEMINAR },
  { value: "GRADUATION", label: EVENT_TYPE_LABELS.GRADUATION },
  { value: "EXHIBITION", label: EVENT_TYPE_LABELS.EXHIBITION },
  { value: "MARKETPLACE", label: EVENT_TYPE_LABELS.MARKETPLACE },
  { value: "GOVERNMENT", label: EVENT_TYPE_LABELS.GOVERNMENT },
  { value: "CAMPUS_SCHOOL", label: EVENT_TYPE_LABELS.CAMPUS_SCHOOL },
  { value: "OTHER", label: EVENT_TYPE_LABELS.OTHER },
];

const FEATURE_KEYS: { key: keyof EventFeatures; label: string; desc: string }[] = [
  {
    key: "tenant",
    label: EVENT_FEATURE_LABELS.tenant,
    desc: "Buka pendaftaran stan bazar & booth UMKM",
  },
  {
    key: "seminar",
    label: EVENT_FEATURE_LABELS.seminar,
    desc: "Kelola sesi workshop, lokakarya & pembicara",
  },
  {
    key: "souvenir",
    label: EVENT_FEATURE_LABELS.souvenir,
    desc: "Sistem checkpoint & penukaran merchandise",
  },
  {
    key: "product",
    label: EVENT_FEATURE_LABELS.product,
    desc: "Katalog produk & display barang milik tenant",
  },
  {
    key: "pos",
    label: EVENT_FEATURE_LABELS.pos,
    desc: "Pencatatan kasir & transaksi langsung tenant",
  },
  {
    key: "paidTicket",
    label: EVENT_FEATURE_LABELS.paidTicket,
    desc: "Penjualan tiket berbayar via Midtrans Snap",
  },
];

/** Convert an ISO date string to `datetime-local` input value (local time). */
function toLocalInputValue(dateString?: string): string {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Extract YYYY-MM-DD from datetime-local or ISO string */
function toDateOnly(dateString?: string): string {
  if (!dateString) return "";
  return dateString.split("T")[0] || "";
}

function CreateEventIllustration() {
  return (
    <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto flex items-center justify-center select-none">
      {/* Sparkle decorative lines top-left */}
      <div className="absolute top-3 left-2 text-blue-400">
        <svg className="w-6 h-6 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12H2m4.5-6.5L4.5 4m8-2v3m5.5 1.5L20 4.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Main Calendar Card */}
      <div className="relative w-32 sm:w-40 h-32 sm:h-40 bg-white rounded-3xl shadow-xl shadow-blue-500/10 border-2 border-blue-200/90 p-3.5 flex flex-col justify-between -rotate-3 transition-transform hover:rotate-0 duration-300">
        {/* Top Header / Binder Loops */}
        <div className="flex justify-between items-center border-b border-blue-100 pb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-secondary ring-4 ring-blue-100" />
          <div className="h-1.5 w-12 bg-blue-100 rounded-full" />
          <div className="w-2.5 h-2.5 rounded-full bg-secondary ring-4 ring-blue-100" />
        </div>

        {/* Calendar Grid of Days */}
        <div className="grid grid-cols-4 gap-1.5 my-auto px-1">
          <div className="h-3.5 bg-blue-50 rounded-md" />
          <div className="h-3.5 bg-blue-100 rounded-md" />
          <div className="h-3.5 bg-blue-50 rounded-md" />
          <div className="h-3.5 bg-blue-200 rounded-md" />
          <div className="h-3.5 bg-blue-100 rounded-md" />
          <div className="h-3.5 bg-secondary/80 rounded-md" />
          <div className="h-3.5 bg-blue-50 rounded-md" />
          <div className="h-3.5 bg-blue-100 rounded-md" />
        </div>

        {/* Plus Circular Badge */}
        <div className="absolute -bottom-3 -right-3 w-11 h-11 bg-secondary text-white rounded-full flex items-center justify-center shadow-lg shadow-secondary/40 border-2 border-white">
          <svg className="w-6 h-6 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </div>
    </div>
  );
}

interface Props {
  /** Present = edit mode. */
  event?: Event;
}

export default function EventForm({ event }: Props) {
  const router = useRouter();
  const isEdit = !!event;

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(event?.photo ?? "");
  const [registrationStatus, setRegistrationStatus] = useState<"ACTIVE" | "CLOSED" | "UPCOMING">("ACTIVE");

  const [form, setForm] = useState({
    name: event?.name ?? "",
    description: event?.description ?? "",
    location: event?.location ?? "",
    organizer_name: event?.organizer_name ?? "",
    start_date: toLocalInputValue(event?.start_date),
    end_date: toLocalInputValue(event?.end_date),
    registration_start: toLocalInputValue(event?.registration_start),
    registration_deadline: toLocalInputValue(event?.registration_deadline),
    quota: event ? String(event.quota) : "0",
    visibility: (event?.visibility ?? "PUBLIC") as EventVisibility,
    event_type: (event?.event_type ?? "EXPO") as EventType,
    features: {
      tenant: event?.features?.tenant ?? true,
      seminar: event?.features?.seminar ?? true,
      souvenir: event?.features?.souvenir ?? true,
      product: event?.features?.product ?? true,
      pos: event?.features?.pos ?? true,
      paidTicket: event ? (event.features?.paidTicket ?? (event.ticket_mode === "PAID")) : false,
      maps_embed_url: event?.features?.maps_embed_url ?? "",
    },
  });

  const [souvenirRules, setSouvenirRules] = useState({
    minVisitedBooth: String(event?.souvenir_rules?.minVisitedBooth ?? 5),
    minTransaction: String(event?.souvenir_rules?.minTransaction ?? ""),
    joinedSeminar: event?.souvenir_rules?.joinedSeminar ?? false,
    requireAll: event?.souvenir_rules?.requireAll ?? true,
    usePointSystem: event?.souvenir_rules?.usePointSystem ?? false,
    boothEnabled: event?.souvenir_rules?.boothVisitPoint?.enabled ?? true,
    pointsPerVisit: event?.souvenir_rules?.boothVisitPoint?.pointsPerVisit ?? 10,
    seminarEnabled: event?.souvenir_rules?.seminarPoint?.enabled ?? true,
    pointsPerSeminar: event?.souvenir_rules?.seminarPoint?.pointsPerSeminar ?? 25,
    txEnabled: event?.souvenir_rules?.transactionPoint?.enabled ?? false,
    pointsPerTransaction: event?.souvenir_rules?.transactionPoint?.pointsPerTransaction ?? 0,
    amountStep: event?.souvenir_rules?.transactionPoint?.amountStep ?? 50000,
    pointsPerAmountStep: event?.souvenir_rules?.transactionPoint?.pointsPerAmountStep ?? 10,
  });
  const [souvenirTiers, setSouvenirTiers] = useState<SouvenirTier[]>(
    event?.souvenir_rules?.tiers ?? [],
  );

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleFeature = (key: keyof EventFeatures) =>
    setForm((f) => ({
      ...f,
      features: { ...f.features, [key]: !f.features[key] },
    }));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|gif|jpg)$/.test(file.type)) {
      toast.error("Hanya file gambar (JPG/PNG/GIF) yang diizinkan.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5 MB.");
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // Quick date change handler in step 1
  const handleStep1DateChange = (dateVal: string) => {
    if (!dateVal) return;
    const startDateTime = `${dateVal}T08:00`;
    const endDateTime = `${dateVal}T17:00`;
    setForm((f) => ({
      ...f,
      start_date: f.start_date ? f.start_date : startDateTime,
      end_date: f.end_date ? f.end_date : endDateTime,
    }));
  };

  const validateStep1 = () => {
    if (!form.name.trim()) {
      toast.error("Judul event wajib diisi.");
      return false;
    }
    if (!form.event_type) {
      toast.error("Kategori event wajib dipilih.");
      return false;
    }
    if (!form.start_date) {
      toast.error("Tanggal event wajib ditentukan.");
      return false;
    }
    if (!form.location.trim()) {
      toast.error("Lokasi event wajib diisi.");
      return false;
    }
    if (!form.description.trim()) {
      toast.error("Deskripsi event wajib diisi.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!form.start_date) {
      toast.error("Waktu mulai event wajib ditentukan.");
      return false;
    }
    if (!form.end_date) {
      toast.error("Waktu selesai event wajib ditentukan.");
      return false;
    }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      toast.error("Waktu selesai tidak boleh lebih awal dari waktu mulai.");
      return false;
    }
    return true;
  };

  const goToNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        // If end_date is still empty, auto-fill from start_date
        if (!form.end_date && form.start_date) {
          const d = new Date(form.start_date);
          d.setHours(d.getHours() + 8);
          setForm((f) => ({ ...f, end_date: toLocalInputValue(d.toISOString()) }));
        }
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        organizer_name: form.organizer_name.trim() || undefined,
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date).toISOString(),
        registration_start: form.registration_start
          ? new Date(form.registration_start).toISOString()
          : undefined,
        registration_deadline: form.registration_deadline
          ? new Date(form.registration_deadline).toISOString()
          : undefined,
        quota: Number(form.quota) || 0,
        visibility: form.visibility,
        event_type: form.event_type,
        ticket_mode: form.features.paidTicket ? ("PAID" as const) : ("FREE" as const),
        features: form.features,
        souvenir_rules: souvenirRules.usePointSystem
          ? {
              usePointSystem: true,
              boothVisitPoint: {
                enabled: souvenirRules.boothEnabled,
                pointsPerVisit: Number(souvenirRules.pointsPerVisit) || 0,
              },
              seminarPoint: {
                enabled: souvenirRules.seminarEnabled,
                pointsPerSeminar: Number(souvenirRules.pointsPerSeminar) || 0,
              },
              transactionPoint: {
                enabled: souvenirRules.txEnabled,
                pointsPerTransaction: Number(souvenirRules.pointsPerTransaction) || 0,
                amountStep: Number(souvenirRules.amountStep) || 0,
                pointsPerAmountStep: Number(souvenirRules.pointsPerAmountStep) || 0,
              },
              tiers: souvenirTiers
                .filter((t) => t.name.trim())
                .map((t) => ({
                  id: t.id,
                  name: t.name.trim(),
                  minPoints: Number(t.minPoints) || 0,
                  description: t.description?.trim() || undefined,
                })),
            }
          : {
              usePointSystem: false,
              minVisitedBooth: Number(souvenirRules.minVisitedBooth) || 0,
              minTransaction: Number(souvenirRules.minTransaction) || 0,
              joinedSeminar: souvenirRules.joinedSeminar,
              requireAll: souvenirRules.requireAll,
            },
      };

      const res = isEdit
        ? await updateEvent(event!.uuid, payload, photo)
        : await createEvent(payload, photo);
      if (!res.status) throw new Error(res.message || "Gagal menyimpan event");

      toast.success(isEdit ? "Event berhasil diperbarui." : "Event berhasil dibuat.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-blue-50 shadow-xl shadow-slate-100/70 p-6 sm:p-10 lg:p-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* ── Left Column: Illustration & Vertical Stepper ── */}
        <div className="lg:col-span-4 flex flex-col items-center lg:items-start lg:border-r lg:border-slate-100 lg:pr-8 py-2">
          {/* Calendar Illustration matching design */}
          <CreateEventIllustration />

          {/* Stepper Navigation */}
          <div className="mt-8 space-y-6 w-full max-w-xs mx-auto lg:mx-0">
            {/* Step 1 Item */}
            <div
              onClick={() => setCurrentStep(1)}
              className="flex items-start gap-3.5 cursor-pointer group"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                  currentStep === 1
                    ? "bg-secondary text-white shadow-md shadow-secondary/30 ring-4 ring-blue-50"
                    : currentStep > 1
                    ? "bg-emerald-500 text-white"
                    : "bg-white border border-gray-300 text-gray-500"
                }`}
              >
                {currentStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : "1"}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-sm font-bold transition-colors ${
                    currentStep === 1 ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900"
                  }`}
                >
                  Informasi Dasar
                </p>
                <p className="text-xs text-gray-400 leading-snug mt-0.5">
                  Isi informasi utama event seperti judul, kategori, dan deskripsi singkat.
                </p>
              </div>
            </div>

            {/* Step 2 Item */}
            <div
              onClick={() => {
                if (validateStep1()) setCurrentStep(2);
              }}
              className="flex items-start gap-3.5 cursor-pointer group"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                  currentStep === 2
                    ? "bg-secondary text-white shadow-md shadow-secondary/30 ring-4 ring-blue-50"
                    : currentStep > 2
                    ? "bg-emerald-500 text-white"
                    : "bg-white border border-gray-300 text-gray-400"
                }`}
              >
                {currentStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : "2"}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-sm font-bold transition-colors ${
                    currentStep === 2 ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900"
                  }`}
                >
                  Detail Event
                </p>
                <p className="text-xs text-gray-400 leading-snug mt-0.5">
                  Tambahkan detail acara seperti tanggal, lokasi, dan agenda.
                </p>
              </div>
            </div>

            {/* Step 3 Item */}
            <div
              onClick={() => {
                if (validateStep1() && validateStep2()) setCurrentStep(3);
              }}
              className="flex items-start gap-3.5 cursor-pointer group"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                  currentStep === 3
                    ? "bg-secondary text-white shadow-md shadow-secondary/30 ring-4 ring-blue-50"
                    : "bg-white border border-gray-300 text-gray-400"
                }`}
              >
                3
              </div>
              <div className="min-w-0">
                <p
                  className={`text-sm font-bold transition-colors ${
                    currentStep === 3 ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900"
                  }`}
                >
                  Publikasi
                </p>
                <p className="text-xs text-gray-400 leading-snug mt-0.5">
                  Tentukan pengaturan publikasi event.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Form Step Content ── */}
        <div className="lg:col-span-8 flex flex-col">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ═══════════ STEP 1: INFORMASI DASAR (Exact match to screenshot) ═══════════ */}
            {currentStep === 1 && (
              <div className="space-y-5">
                {/* Step Header with Icon Badge */}
                <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-secondary flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      Informasi Dasar
                    </h2>
                    <p className="text-xs text-gray-400">
                      Mulai dengan informasi dasar event Anda.
                    </p>
                  </div>
                </div>

                {/* Judul Event */}
                <div>
                  <label className="block mb-1.5 font-bold text-gray-800 text-sm">
                    Judul Event <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="Masukkan judul event"
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-secondary focus:outline-hidden focus:ring-2 focus:ring-secondary/15 transition-all"
                  />
                </div>

                {/* Grid 2-col: Kategori Event & Tanggal Event */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kategori Event */}
                  <div>
                    <label className="block mb-1.5 font-bold text-gray-800 text-sm">
                      Kategori Event <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                        <LayoutGrid className="w-4 h-4 text-gray-500" />
                      </div>
                      <select
                        value={form.event_type}
                        onChange={(e) => setField("event_type", e.target.value as EventType)}
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-8 text-sm text-gray-800 focus:border-secondary focus:outline-hidden focus:ring-2 focus:ring-secondary/15 transition-all cursor-pointer"
                      >
                        {EVENT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tanggal Event */}
                  <div>
                    <label className="block mb-1.5 font-bold text-gray-800 text-sm">
                      Tanggal Event <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                        <Calendar className="w-4 h-4 text-gray-500" />
                      </div>
                      <input
                        type="date"
                        required
                        value={toDateOnly(form.start_date)}
                        onChange={(e) => handleStep1DateChange(e.target.value)}
                        placeholder="Pilih tanggal event"
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-secondary focus:outline-hidden focus:ring-2 focus:ring-secondary/15 transition-all cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Grid 2-col: Lokasi Event & Status Pendaftaran */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Lokasi Event */}
                  <div>
                    <label className="block mb-1.5 font-bold text-gray-800 text-sm">
                      Lokasi Event <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                        <MapPin className="w-4 h-4 text-gray-500" />
                      </div>
                      <input
                        type="text"
                        required
                        value={form.location}
                        onChange={(e) => setField("location", e.target.value)}
                        placeholder="Masukkan lokasi event"
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-secondary focus:outline-hidden focus:ring-2 focus:ring-secondary/15 transition-all"
                      />
                    </div>
                  </div>

                  {/* Status Pendaftaran */}
                  <div>
                    <label className="block mb-1.5 font-bold text-gray-800 text-sm">
                      Status Pendaftaran
                    </label>
                    <div className="relative">
                      <select
                        value={registrationStatus}
                        onChange={(e) => setRegistrationStatus(e.target.value as "ACTIVE" | "CLOSED" | "UPCOMING")}
                        className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-4 pr-8 text-sm text-gray-800 focus:border-secondary focus:outline-hidden focus:ring-2 focus:ring-secondary/15 transition-all cursor-pointer"
                      >
                        <option value="ACTIVE">• Aktif</option>
                        <option value="UPCOMING">• Segera Hadir</option>
                        <option value="CLOSED">• Ditutup</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Deskripsi Singkat */}
                <div>
                  <label className="block mb-1.5 font-bold text-gray-800 text-sm">
                    Deskripsi Singkat <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    maxLength={200}
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="Tuliskan deskripsi singkat event (maks. 200 karakter)..."
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-secondary focus:outline-hidden focus:ring-2 focus:ring-secondary/15 transition-all"
                  />
                  <div className="flex justify-end mt-1 text-xs text-gray-400">
                    <span>{form.description.length} / 200</span>
                  </div>
                </div>

                {/* Footer Buttons Step 1 */}
                <div className="pt-4 flex items-center justify-between border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="px-6 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-semibold text-sm transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-semibold text-sm shadow-md shadow-secondary/25 transition-all cursor-pointer"
                  >
                    <span>Selanjutnya</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════ STEP 2: DETAIL EVENT ═══════════ */}
            {currentStep === 2 && (
              <div className="space-y-5">
                {/* Step Header with Icon Badge */}
                <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-secondary flex items-center justify-center shrink-0">
                    <Sliders className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      Detail Event
                    </h2>
                    <p className="text-xs text-gray-400">
                      Tambahkan detail acara seperti tanggal, waktu, poster, dan kuota.
                    </p>
                  </div>
                </div>

                {/* Foto / Poster Event */}
                <div>
                  <label className="block mb-1.5 font-bold text-gray-800 text-sm">
                    Foto / Poster Banner Event
                  </label>
                  <div className="flex items-start gap-4">
                    <div className="relative flex justify-center items-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl w-44 h-32 overflow-hidden shrink-0">
                      {photoPreview ? (
                        <Image src={photoPreview} alt="Preview" fill unoptimized className="object-cover" />
                      ) : (
                        <span className="text-gray-400 text-xs text-center px-3">
                          Belum ada poster
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="cursor-pointer">
                        <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                          <Upload className="w-3.5 h-3.5" /> Pilih Poster
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                      {photoPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setPhoto(null);
                            setPhotoPreview("");
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Hapus Foto
                        </button>
                      )}
                      <p className="text-[11px] text-gray-400">
                        Format JPG/PNG, ukuran maksimal 5 MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Grid 2-col: Waktu Mulai & Waktu Selesai */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Tanggal & Waktu Mulai"
                    type="datetime-local"
                    required
                    value={form.start_date}
                    onChange={(e) => setField("start_date", e.target.value)}
                  />
                  <Input
                    label="Tanggal & Waktu Selesai"
                    type="datetime-local"
                    required
                    value={form.end_date}
                    onChange={(e) => setField("end_date", e.target.value)}
                  />
                </div>

                {/* Grid 2-col: Registrasi Dibuka & Ditutup */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Registrasi Dibuka (Opsional)"
                    type="datetime-local"
                    value={form.registration_start}
                    onChange={(e) => setField("registration_start", e.target.value)}
                  />
                  <Input
                    label="Registrasi Ditutup (Opsional)"
                    type="datetime-local"
                    value={form.registration_deadline}
                    onChange={(e) => setField("registration_deadline", e.target.value)}
                  />
                </div>

                {/* Grid 2-col: Kuota & Penyelenggara */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormattedNumberInput
                    label="Kuota Pengunjung (0 = Tidak terbatas)"
                    value={Number(form.quota) || 0}
                    onChange={(val) => setField("quota", String(val))}
                    suffix="Orang"
                    placeholder="0"
                    hint="Batas maksimal pendaftar event"
                  />
                  <Input
                    label="Nama Penyelenggara / Organizer"
                    type="text"
                    value={form.organizer_name}
                    onChange={(e) => setField("organizer_name", e.target.value)}
                    placeholder="Contoh: SMK Telkom Malang"
                  />
                </div>

                {/* Google Maps Embed */}
                <div>
                  <Input
                    label="Google Maps Embed URL (Opsional)"
                    type="text"
                    value={form.features.maps_embed_url || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const match = val.match(/src=["']([^"']+)["']/);
                      const cleanUrl = match ? match[1] : val;
                      setForm((f) => ({
                        ...f,
                        features: { ...f.features, maps_embed_url: cleanUrl },
                      }));
                    }}
                    placeholder="https://www.google.com/maps/embed?pb=... atau kode <iframe>"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Jika dikosongkan, halaman publik akan mengarahkan peta ke lokasi event secara otomatis.
                  </p>
                </div>

                {/* Footer Buttons Step 2 */}
                <div className="pt-4 flex items-center justify-between border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-semibold text-sm transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-semibold text-sm shadow-md shadow-secondary/25 transition-all cursor-pointer"
                  >
                    <span>Selanjutnya</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════ STEP 3: PUBLIKASI & FITUR ═══════════ */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Step Header with Icon Badge */}
                <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-secondary flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      Publikasi &amp; Pengaturan Fitur
                    </h2>
                    <p className="text-xs text-gray-400">
                      Tentukan visibilitas event dan aktifkan modul fitur yang Anda butuhkan.
                    </p>
                  </div>
                </div>

                {/* Visibilitas Event */}
                <div>
                  <label className="block mb-2 font-bold text-gray-800 text-sm">
                    Visibilitas Event
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setField("visibility", "PUBLIC")}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                        form.visibility === "PUBLIC"
                          ? "border-secondary bg-blue-50/50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <Globe className={`w-5 h-5 mt-0.5 ${form.visibility === "PUBLIC" ? "text-secondary" : "text-gray-400"}`} />
                      <div>
                        <p className="text-sm font-bold text-gray-900">Publik</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Tampil di beranda Mexpo dan dapat dicari oleh semua pengunjung.
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => setField("visibility", "PRIVATE")}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                        form.visibility === "PRIVATE"
                          ? "border-secondary bg-blue-50/50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <Lock className={`w-5 h-5 mt-0.5 ${form.visibility === "PRIVATE" ? "text-secondary" : "text-gray-400"}`} />
                      <div>
                        <p className="text-sm font-bold text-gray-900">Pribadi</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Hanya dapat diakses melalui link langsung, tidak tampil di katalog utama.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modul & Fitur Event */}
                <div>
                  <label className="block mb-2 font-bold text-gray-800 text-sm">
                    Fitur &amp; Modul Event
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {FEATURE_KEYS.map(({ key, label, desc }) => (
                      <label
                        key={key}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          form.features[key]
                            ? "border-secondary/40 bg-blue-50/30"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!form.features[key]}
                          onChange={() => toggleFeature(key)}
                          className="w-4 h-4 mt-0.5 accent-secondary shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-gray-800">{label}</p>
                          <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Aturan Souvenir (Jika fitur souvenir aktif) */}
                {form.features.souvenir && (
                  <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/30 space-y-3">
                    <p className="text-xs sm:text-sm font-bold text-gray-900">
                      Aturan Penukaran Souvenir
                    </p>
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={souvenirRules.usePointSystem}
                        onChange={(e) =>
                          setSouvenirRules({ ...souvenirRules, usePointSystem: e.target.checked })
                        }
                      />
                      Gunakan Sistem Poin &amp; Jenis Souvenir
                    </label>

                    {souvenirRules.usePointSystem ? (
                      <div className="space-y-4">
                        {/* Sumber poin */}
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-gray-700">Sumber Perolehan Poin</p>

                          <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
                            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={souvenirRules.boothEnabled}
                                onChange={(e) =>
                                  setSouvenirRules({ ...souvenirRules, boothEnabled: e.target.checked })
                                }
                              />
                              Kunjungan Booth
                            </label>
                            {souvenirRules.boothEnabled && (
                              <FormattedNumberInput
                                label="Poin per Booth yang Dikunjungi"
                                value={Number(souvenirRules.pointsPerVisit) || 0}
                                onChange={(val) =>
                                  setSouvenirRules({ ...souvenirRules, pointsPerVisit: Number(val) })
                                }
                                suffix="Poin"
                                placeholder="10"
                              />
                            )}
                          </div>

                          <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
                            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={souvenirRules.seminarEnabled}
                                onChange={(e) =>
                                  setSouvenirRules({ ...souvenirRules, seminarEnabled: e.target.checked })
                                }
                              />
                              Mengikuti Seminar / Workshop
                            </label>
                            {souvenirRules.seminarEnabled && (
                              <FormattedNumberInput
                                label="Poin per Seminar/Workshop yang Diikuti"
                                value={Number(souvenirRules.pointsPerSeminar) || 0}
                                onChange={(val) =>
                                  setSouvenirRules({ ...souvenirRules, pointsPerSeminar: Number(val) })
                                }
                                suffix="Poin"
                                placeholder="25"
                              />
                            )}
                          </div>

                          <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
                            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={souvenirRules.txEnabled}
                                onChange={(e) =>
                                  setSouvenirRules({ ...souvenirRules, txEnabled: e.target.checked })
                                }
                              />
                              Transaksi Pembelian
                            </label>
                            {souvenirRules.txEnabled && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <FormattedNumberInput
                                  label="Poin per Transaksi"
                                  value={Number(souvenirRules.pointsPerTransaction) || 0}
                                  onChange={(val) =>
                                    setSouvenirRules({ ...souvenirRules, pointsPerTransaction: Number(val) })
                                  }
                                  suffix="Poin"
                                  placeholder="0"
                                />
                                <CurrencyInput
                                  label="Kelipatan Nominal"
                                  value={Number(souvenirRules.amountStep) || 0}
                                  onChange={(val) =>
                                    setSouvenirRules({ ...souvenirRules, amountStep: Number(val) })
                                  }
                                  placeholder="50000"
                                  hint="0 = nonaktif"
                                />
                                <FormattedNumberInput
                                  label="Poin per Kelipatan"
                                  value={Number(souvenirRules.pointsPerAmountStep) || 0}
                                  onChange={(val) =>
                                    setSouvenirRules({ ...souvenirRules, pointsPerAmountStep: Number(val) })
                                  }
                                  suffix="Poin"
                                  placeholder="10"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Jenis souvenir (tiers) */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-gray-700">
                              Jenis Souvenir &amp; Minimal Poin
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                setSouvenirTiers([
                                  ...souvenirTiers,
                                  { id: crypto.randomUUID(), name: "", minPoints: 0 },
                                ])
                              }
                              className="text-xs font-semibold text-secondary cursor-pointer"
                            >
                              + Tambah Jenis
                            </button>
                          </div>
                          {souvenirTiers.length === 0 && (
                            <p className="text-[11px] text-gray-400">
                              Belum ada jenis souvenir. Contoh: Sticker Pack = 20 poin, Totebag = 50 poin.
                            </p>
                          )}
                          {souvenirTiers.map((tier, idx) => (
                            <div key={tier.id} className="grid grid-cols-12 gap-2 items-end">
                              <div className="col-span-6">
                                <Input
                                  label="Nama Souvenir"
                                  value={tier.name}
                                  onChange={(e) =>
                                    setSouvenirTiers(
                                      souvenirTiers.map((t, i) =>
                                        i === idx ? { ...t, name: e.target.value } : t,
                                      ),
                                    )
                                  }
                                  placeholder="Totebag"
                                />
                              </div>
                              <div className="col-span-5">
                                <FormattedNumberInput
                                  label="Minimal Poin"
                                  value={Number(tier.minPoints) || 0}
                                  onChange={(val) =>
                                    setSouvenirTiers(
                                      souvenirTiers.map((t, i) =>
                                        i === idx ? { ...t, minPoints: Number(val) } : t,
                                      ),
                                    )
                                  }
                                  suffix="Poin"
                                  placeholder="50"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => setSouvenirTiers(souvenirTiers.filter((_, i) => i !== idx))}
                                className="col-span-1 pb-3 text-gray-400 hover:text-red-500 cursor-pointer"
                                aria-label="Hapus jenis souvenir"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormattedNumberInput
                        label="Min. Kunjungan Booth"
                        value={Number(souvenirRules.minVisitedBooth) || 5}
                        onChange={(val) => setSouvenirRules({ ...souvenirRules, minVisitedBooth: String(val) })}
                        suffix="Booth"
                        placeholder="5"
                        hint="Default: minimal 5 booth"
                      />
                      <CurrencyInput
                        label="Min. Total Transaksi"
                        value={Number(souvenirRules.minTransaction) || 0}
                        onChange={(val) => setSouvenirRules({ ...souvenirRules, minTransaction: String(val) })}
                        placeholder="0"
                        hint="Nominal transaksi POS tenant"
                      />
                    </div>
                    )}
                  </div>
                )}

                {/* Footer Buttons Step 3 */}
                <div className="pt-4 flex items-center justify-between border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-semibold text-sm transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-semibold text-sm shadow-md shadow-secondary/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>{isEdit ? "Simpan Perubahan" : "Buat Event Sekarang"}</span>
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
}
