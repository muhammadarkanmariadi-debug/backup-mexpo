"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

import Input from "@/shared/components/form/Input";
import Image from "next/image";
import {
  Event,
  EventFeatures,
  EventType,
  EventVisibility,
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

const FEATURE_KEYS: { key: keyof EventFeatures; label: string }[] = [
  { key: "tenant", label: EVENT_FEATURE_LABELS.tenant },
  { key: "seminar", label: EVENT_FEATURE_LABELS.seminar },
  { key: "souvenir", label: EVENT_FEATURE_LABELS.souvenir },
  { key: "product", label: EVENT_FEATURE_LABELS.product },
  { key: "pos", label: EVENT_FEATURE_LABELS.pos },
  { key: "paidTicket", label: EVENT_FEATURE_LABELS.paidTicket },
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

interface Props {
  /** Present = edit mode. */
  event?: Event;
}

export default function EventForm({ event }: Props) {
  const router = useRouter();
  const isEdit = !!event;
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(event?.photo ?? "");
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
    event_type: (event?.event_type ?? "OTHER") as EventType,
    features: {
      tenant: event?.features?.tenant ?? true,
      seminar: event?.features?.seminar ?? true,
      souvenir: event?.features?.souvenir ?? true,
      product: event?.features?.product ?? true,
      pos: event?.features?.pos ?? true,
      paidTicket: event?.features?.paidTicket ?? true,
    },
  });
  const [souvenirRules, setSouvenirRules] = useState({
    minVisitedBooth: String(event?.souvenir_rules?.minVisitedBooth ?? 5),
    minTransaction: String(event?.souvenir_rules?.minTransaction ?? ""),
    joinedSeminar: event?.souvenir_rules?.joinedSeminar ?? false,
    requireAll: event?.souvenir_rules?.requireAll ?? true,
  });

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
    // Backend accepts images only, max 5 MB (helper/upload.format.ts).
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        location: form.location,
        organizer_name: form.organizer_name,
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
        // Keep the paid/free flag in sync: "Tiket Berbayar" toggle → ticket_mode.
        ticket_mode: form.features.paidTicket ? ("PAID" as const) : ("FREE" as const),
        features: form.features,
        souvenir_rules: {
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
    <form onSubmit={handleSubmit} className="space-y-5 max-w-7xl">
      {/* Photo upload (top) */}

      <div className="flex gap-4">

        <div>
          <div>
            <label className="block mb-2 font-medium text-gray-700 text-sm">
              Foto Event
            </label>
            <div className="flex items-start gap-4">
              <div className="relative flex justify-center items-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl w-40 h-28 overflow-hidden">
                {photoPreview ? (
                   
                  <Image src={photoPreview} alt="Preview" fill unoptimized className="object-cover" />
                ) : (
                  <span className="text-gray-400 text-xs text-center px-2">
                    Belum ada foto
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                    <Upload className="w-3.5 h-3.5" /> Pilih Foto
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
                    <X className="w-3.5 h-3.5" /> Hapus
                  </button>
                )}
                <p className="text-[11px] text-gray-400">
                  JPG/PNG/GIF, maks 5 MB
                </p>
              </div>
            </div>
          </div>

          <Input
            label="Nama Event"
            type="text"
            required
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Contoh: Expo Teknologi 2026"
          />
          <Input
            label="Deskripsi"
            type="text-area"
            required
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            placeholder="Deskripsi singkat event..."
          />
          <Input
            label="Lokasi"
            type="text"
            required
            value={form.location}
            onChange={(e) => setField("location", e.target.value)}
            placeholder="Contoh: SMK Telkom Malang"
          />
          <Input
            label="Penyelenggara"
            type="text"
            value={form.organizer_name}
            onChange={(e) => setField("organizer_name", e.target.value)}
            placeholder="Nama penyelenggara"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Mulai"
              type="datetime-local"
              required
              value={form.start_date}
              onChange={(e) => setField("start_date", e.target.value)}
            />
            <Input
              label="Selesai"
              type="datetime-local"
              required
              value={form.end_date}
              onChange={(e) => setField("end_date", e.target.value)}
            />
            <Input
              label="Registrasi dibuka"
              type="datetime-local"
              value={form.registration_start}
              onChange={(e) => setField("registration_start", e.target.value)}
            />
            <Input
              label="Registrasi ditutup"
              type="datetime-local"
              value={form.registration_deadline}
              onChange={(e) => setField("registration_deadline", e.target.value)}
            />
            <Input
              label="Kuota (0 = tidak terbatas)"
              type="number"
              min="0"
              value={form.quota}
              onChange={(e) => setField("quota", e.target.value)}
            />
          </div>
        </div>

        <div>
          {/* A2 — visibility */}
          <div>
            <label className="block mb-2 font-medium text-gray-700 text-sm">
              Visibilitas
            </label>
            <div className="flex gap-2">
              {(["PUBLIC", "PRIVATE"] as EventVisibility[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setField("visibility", v)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${form.visibility === v
                    ? "bg-secondary text-white border-secondary"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                >
                  {v === "PUBLIC" ? "Publik" : "Pribadi"}
                </button>
              ))}
            </div>
          </div>

          {/* A7 — event type */}
          <div>
            <label className="block mb-2 font-medium text-gray-700 text-sm">
              Jenis Event
            </label>
            <select
              value={form.event_type}
              onChange={(e) => setField("event_type", e.target.value as EventType)}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-white text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 focus:outline-hidden"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* A2 — feature toggles */}
          <div>
            <label className="block mb-2 font-medium text-gray-700 text-sm">
              Fitur Event
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FEATURE_KEYS.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-gray-200 bg-white cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={!!form.features[key]}
                    onChange={() => toggleFeature(key)}
                    className="w-4 h-4 accent-brand-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* A5 — souvenir rules */}
          <div>
            <label className="block mb-2 font-medium text-gray-700 text-sm">
              Aturan Souvenir
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-white p-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Min. kunjungan booth (0 = 5)
                </label>
                <input
                  type="number"
                  min="0"
                  value={souvenirRules.minVisitedBooth}
                  onChange={(e) => setSouvenirRules({ ...souvenirRules, minVisitedBooth: e.target.value })}
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Min. total transaksi (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={souvenirRules.minTransaction}
                  onChange={(e) => setSouvenirRules({ ...souvenirRules, minTransaction: e.target.value })}
                  className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={souvenirRules.joinedSeminar}
                  onChange={(e) => setSouvenirRules({ ...souvenirRules, joinedSeminar: e.target.checked })}
                  className="h-4 w-4 accent-brand-500"
                />
                Wajib ikut seminar
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={souvenirRules.requireAll}
                  onChange={(e) => setSouvenirRules({ ...souvenirRules, requireAll: e.target.checked })}
                  className="h-4 w-4 accent-brand-500"
                />
                Semua syarat harus terpenuhi (nonaktif = salah satu)
              </label>
            </div>
          </div>
        </div>
      </div>


      <button
        type="submit"
        disabled={submitting}
        className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 disabled:opacity-50 px-5 py-3.5 rounded-lg w-full font-semibold text-white transition-colors"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {isEdit ? "Simpan Perubahan" : "Buat Event"}
      </button>
    </form>
  );
}
