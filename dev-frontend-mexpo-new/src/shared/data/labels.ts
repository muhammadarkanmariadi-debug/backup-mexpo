// ============================================================
// Label maps — single source of truth for localized UI labels.
//
// Base language is Indonesian. Any raw enum values (DRAFTED,
// PENDING, CAREER_FAIR, GOLD, OWNER…) MUST go through these
// maps before being rendered to the user.
// ============================================================

/** Event status → Indonesian. */
export const EVENT_STATUS_LABELS: Record<string, string> = {
  DRAFTED: "Draf",
  PENDING: "Menunggu",
  PUBLISHED: "Terbit",
  REJECTED: "Ditolak",
  FINISHED: "Selesai",
};

/** Home-page time category (internal keys) → Indonesian. */
export const EVENT_CATEGORY_LABELS: Record<string, string> = {
  "All Events": "Semua Event",
  "On Going": "Berlangsung",
  Upcoming: "Akan Datang",
  Past: "Selesai",
};

/** Event type → Indonesian. */
export const EVENT_TYPE_LABELS: Record<string, string> = {
  EXPO: "Ekspo",
  CAREER_FAIR: "Job Fair",
  SEMINAR: "Seminar",
  GRADUATION: "Wisuda",
  EXHIBITION: "Pameran",
  MARKETPLACE: "Marketplace",
  GOVERNMENT: "Pemerintah",
  CAMPUS_SCHOOL: "Kampus/Sekolah",
  OTHER: "Lainnya",
};

/** Visibility → Indonesian. */
export const EVENT_VISIBILITY_LABELS: Record<string, string> = {
  PUBLIC: "Publik",
  PRIVATE: "Pribadi",
};

/** User/event role → Indonesian. */
export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Pemilik",
  COMMITTEE: "Panitia",
  TENANT: "Penyewa",
  VISITOR: "Pengunjung",
  SUPERADMIN: "Admin Super",
};

/** Approval / verification status → Indonesian. */
export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

/** Sponsor level → Indonesian. */
export const SPONSOR_LEVEL_LABELS: Record<string, string> = {
  PLATINUM: "Platinum",
  GOLD: "Emas",
  SILVER: "Perak",
  BRONZE: "Perunggu",
};

/** Registration field type → Indonesian. */
export const REGISTRATION_FIELD_TYPE_LABELS: Record<string, string> = {
  TEXT: "Teks",
  TEXTAREA: "Teks Panjang",
  NUMBER: "Angka",
  EMAIL: "Surel",
  SELECT: "Pilihan",
  DATE: "Tanggal",
  BOOLEAN: "Ya/Tidak",
};

/** Feature toggle labels for the event form (EventForm). */
export const EVENT_FEATURE_LABELS: Record<string, string> = {
  tenant: "Penyewa / Booth",
  seminar: "Seminar / Lokakarya",
  souvenir: "Souvenir",
  product: "Produk",
  pos: "POS",
  paidTicket: "Tiket Berbayar",
};

/** Generic lookup helper with fallback to the raw value. */
export function labelFor(
  map: Record<string, string>,
  value?: string | null,
  fallback = "—",
): string {
  if (!value) return fallback;
  return map[value] ?? map[value.toUpperCase()] ?? value;
}