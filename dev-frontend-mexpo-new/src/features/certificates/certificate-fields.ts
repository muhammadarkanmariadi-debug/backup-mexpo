import {
  CertificateBinding,
  CertificateData,
  CertificateFieldKey,
} from "@/entities/event/certificate-template.entity";
import { dateFormat } from "@/shared/utils/format";

/** Designer-facing list of dynamic certificate and badge fields (whitelisted on the backend too). */
export const CERTIFICATE_FIELDS: { key: CertificateFieldKey; label: string }[] = [
  { key: "participant_name", label: "Nama Peserta" },
  { key: "organization", label: "Organisasi / Instansi" },
  { key: "role", label: "Peran / Role" },
  { key: "email", label: "Email" },
  { key: "event_name", label: "Nama Event" },
  { key: "workshop_title", label: "Judul Workshop" },
  { key: "date", label: "Tanggal" },
  { key: "organizer_name", label: "Nama Penyelenggara" },
  { key: "certificate_number", label: "Nomor Sertifikat / ID" },
  { key: "qr_code", label: "Data QR Code" },
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
    organization: "SMK Telkom Malang",
    role: "VISITOR",
    email: "rizky.pratama@example.com",
    qr_code: "mexpo:sample:visitor",
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
  organization?: string;
  role?: string;
  email?: string;
  qrCode?: string;
}

export function buildCertificateData(source: CertificateSource): CertificateData {
  return {
    participant_name: source.participantName,
    event_name: source.eventName,
    workshop_title: source.workshopTitle,
    date: source.date,
    organizer_name: source.organizerName,
    certificate_number: source.certificateNumber ?? "",
    organization: source.organization ?? "",
    role: source.role ?? "VISITOR",
    email: source.email ?? "",
    qr_code: source.qrCode ?? "",
  };
}

export function buildBadgeData(params: {
  fullName: string;
  eventName: string;
  date: string;
  organization?: string;
  email?: string;
  role?: string;
  qrCodeData?: string;
  qrCodeImage?: string;
}): CertificateData {
  return {
    participant_name: params.fullName,
    event_name: params.eventName,
    workshop_title: "",
    date: params.date,
    organizer_name: "",
    certificate_number: params.qrCodeData ?? "",
    organization: params.organization || "Umum",
    role: params.role || "VISITOR",
    email: params.email || "",
    qr_code: params.qrCodeImage || params.qrCodeData || "",
  };
}

/** Small stable id helper for designer nodes. */
export function uid(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}