import { httpGet } from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";
import { BASE_API_URL, BASIC_AUTH_USERNAME, BASIC_AUTH_PASSWORD } from "@/global";

export interface BoothReportRow {
  uuid: string;
  name: string;
  booth_number: string;
  counts: number;
}

export interface CategoryReportRow {
  uuid: string;
  name: string;
  count: number;
}

export interface AmountReportRow {
  uuid: string;
  name: string;
  booth_number: string;
  amount: number;
  count_transaction: number;
}

export interface AmountCategoryRow {
  uuid: string;
  name: string;
  amount: number;
  count_transaction: number;
}

export interface VisitorReport {
  name: string;
  counts: number;
  amounts?: number;
}

export type DateRange = { start_date?: string; end_date?: string };

function dateQuery(start?: Date, end?: Date): DateRange {
  const q: DateRange = {};
  if (start) q.start_date = start.toISOString();
  if (end) q.end_date = end.toISOString();
  return q;
}

export async function getBoothReport(eventId: string, start?: Date, end?: Date) {
  const res = await httpGet(`reports/booth/${eventId}`, "Basic", META_DYNAMIC, dateQuery(start, end));
  return { data: (res.data as BoothReportRow[]) ?? [], status: res.status, message: res.message };
}

export async function getCategoryReport(eventId: string, start?: Date, end?: Date) {
  const res = await httpGet(`reports/category/${eventId}`, "Basic", META_DYNAMIC, dateQuery(start, end));
  return { data: (res.data as CategoryReportRow[]) ?? [], status: res.status, message: res.message };
}

export async function getAmountBoothReport(eventId: string, start?: Date, end?: Date) {
  const res = await httpGet(`reports/amount/booth/${eventId}`, "Basic", META_DYNAMIC, dateQuery(start, end));
  return { data: (res.data as AmountReportRow[]) ?? [], status: res.status, message: res.message };
}

export async function getAmountCategoryReport(eventId: string, start?: Date, end?: Date) {
  const res = await httpGet(`reports/amount/category/${eventId}`, "Basic", META_DYNAMIC, dateQuery(start, end));
  return { data: (res.data as AmountCategoryRow[]) ?? [], status: res.status, message: res.message };
}

export async function getVisitorReport(eventId: string, start?: Date, end?: Date) {
  const res = await httpGet(`reports/visitor/${eventId}`, "Basic", META_DYNAMIC, dateQuery(start, end));
  return { data: (res.data as VisitorReport) ?? null, status: res.status, message: res.message };
}

export async function getAmountReport(eventId: string, start?: Date, end?: Date) {
  const res = await httpGet(`reports/amount/${eventId}`, "Basic", META_DYNAMIC, dateQuery(start, end));
  return { data: (res.data as VisitorReport) ?? null, status: res.status, message: res.message };
}

/**
 * A16 — download the tenant-scoped Excel export (this tenant's rows only).
 */
export async function downloadTenantExport(eventId: string, tenantId: string) {
  const url = `${BASE_API_URL}/reports/export/${eventId}/tenant/${tenantId}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${btoa(`${BASIC_AUTH_USERNAME}:${BASIC_AUTH_PASSWORD}`)}`,
    },
  });
  if (!res.ok) throw new Error(`Gagal mengunduh laporan (HTTP ${res.status})`);
  const blob = await res.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `report-${tenantId}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(downloadUrl);
}

/**
 * A16 — download the Excel export. Runs client-side with Basic auth and
 * triggers a browser download (xlsx is binary, so we bypass the JSON client).
 * Honors the active date range via query params.
 */
export async function downloadReportExport(eventId: string, start?: Date, end?: Date) {
  const qs = new URLSearchParams(dateQuery(start, end)).toString();
  const url = `${BASE_API_URL}/reports/export/${eventId}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${btoa(`${BASIC_AUTH_USERNAME}:${BASIC_AUTH_PASSWORD}`)}`,
    },
  });
  if (!res.ok) throw new Error(`Gagal mengunduh laporan (HTTP ${res.status})`);
  const blob = await res.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `report-${eventId}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(downloadUrl);
}
