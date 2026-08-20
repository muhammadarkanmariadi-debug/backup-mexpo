import {
  CertificateBinding,
  CertificateData,
  CertificateFieldKey,
} from "@/entities/event/certificate-template.entity";
import { dateFormat } from "@/shared/utils/format";

/** Designer-facing list of dynamic certificate fields (whitelisted on the backend too). */
export const CERTIFICATE_FIELDS: { key: CertificateFieldKey; label: string }[] = [
  { key: "participant_name", label: "Nama Peserta" },
  { key: "event_name", label: "Nama Event" },
  { key: "workshop_title", label: "Judul Workshop" },
  { key: "date", label: "Tanggal" },
  { key: "organizer_name", label: "Nama Penyelenggara" },
  { key: "certificate_number", label: "Nomor Sertifikat" },
];

export function fieldLabel(key: CertificateFieldKey): string {
  return CERTIFICATE_FIELDS.find((f) => f.key === key)?.label ?? key;
}

/** Sample data shown in the designer so dynamic fields render realistically. */
export function buildSampleData(): CertificateData {
  return {
    participant_name: "Rizky Pratama",
    event_name: "MEXPO 2026 · Pameran & Lokakarya SMK Telkom Malang",
    workshop_title: "Workshop UI/UX Design dengan Figma",
    date: dateFormat(new Date().toISOString()),
    organizer_name: "SMK Telkom Malang",
    certificate_number: "MXP/2026/0001",
  };
}

/** Resolves a text binding into the concrete string to render. */
export function resolveBinding(
  binding: CertificateBinding | undefined,
  data: CertificateData,
  fallback = "",
): string {
  if (!binding) return fallback;
  if (binding.type === "dynamic") {
    const value = binding.key ? data[binding.key] : "";
    return value && value.trim() ? value : (binding.value ?? fallback);
  }
  return binding.value ?? fallback;
}

/** Builds the render data for a real recipient (workshop certificate). */
export interface CertificateSource {
  participantName: string;
  eventName: string;
  workshopTitle: string;
  date: string;
  organizerName: string;
  certificateNumber?: string;
}

export function buildCertificateData(source: CertificateSource): CertificateData {
  return {
    participant_name: source.participantName,
    event_name: source.eventName,
    workshop_title: source.workshopTitle,
    date: source.date,
    organizer_name: source.organizerName,
    certificate_number: source.certificateNumber ?? "",
  };
}

/** Small stable id helper for designer nodes. */
export function uid(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}