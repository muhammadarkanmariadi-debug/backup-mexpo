import { httpGet, httpPost, httpPut } from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";

/**
 * Check-in/out endpoints refuse with a non-2xx body (workshop slots full, visitor
 * not registered, ...) which the http client returns as `status: false` instead of
 * throwing. Callers show their own "Check-in berhasil" unless an error is thrown,
 * so a refusal used to be displayed as a success.
 */
function ensureRecorded<T extends { status: boolean; message?: string | null }>(res: T): T {
  if (!res.status) throw new Error(res.message || "Gagal mencatat kehadiran.");
  return res;
}

/** B6 — venue/event check-in (recorder: APPROVED committee/owner). */
export async function checkInEvent(eventId: string, userId: string) {
  return ensureRecorded(await httpPost(
    `attendances/event/${eventId}`,
    JSON.stringify({ user_id: userId }),
    "token",
  ));
}

/** Venue/event check-out (recorder: APPROVED committee/owner). */
export async function checkOutEvent(eventId: string, userId: string) {
  return ensureRecorded(await httpPut(
    `attendances/event/${eventId}`,
    JSON.stringify({ user_id: userId }),
    "token",
  ));
}

/** B6 — tenant booth visit / guest book (recorder: APPROVED tenant member). */
export async function checkInTenant(tenantId: string, userId: string) {
  return await httpPost(
    `attendances/tenant/${tenantId}`,
    JSON.stringify({ user_id: userId }),
    "token",
  );
}

/** B6 — workshop/seminar check-in (creates/updates workshop booking). */
export async function checkInWorkshop(workshopId: string, userId: string) {
  return ensureRecorded(await httpPost(
    `attendances/workshop/${workshopId}`,
    JSON.stringify({ user_id: userId }),
    "token",
  ));
}

/** Workshop/seminar check-out (updates workshop booking with checkout_at). */
export async function checkOutWorkshop(workshopId: string, userId: string) {
  return ensureRecorded(await httpPut(
    `attendances/workshop/${workshopId}`,
    JSON.stringify({ user_id: userId }),
    "token",
  ));
}

export interface AttendanceLog {
  uuid: string;
  user: { uuid: string; full_name: string };
  created_at: string;
  checkout_at?: string | null;
}

export async function getEventAttendance(
  eventId: string,
  query?: { start_date?: string; end_date?: string; search?: string },
) {
  const res = await httpGet(
    `attendances/event/${eventId}`,
    "token",
    META_DYNAMIC,
    query as Record<string, string>,
  );
  return { data: (res.data as AttendanceLog[]) ?? [], status: res.status, message: res.message, meta: res.meta };
}
