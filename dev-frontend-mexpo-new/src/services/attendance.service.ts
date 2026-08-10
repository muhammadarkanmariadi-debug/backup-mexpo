import { httpGet, httpPost } from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";

/** B6 — venue/event check-in (recorder: APPROVED committee/owner). */
export async function checkInEvent(eventId: string, userId: string) {
  return await httpPost(
    `attendances/event/${eventId}`,
    JSON.stringify({ user_id: userId }),
    "token",
  );
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
  return await httpPost(
    `attendances/workshop/${workshopId}`,
    JSON.stringify({ user_id: userId }),
    "token",
  );
}

export interface AttendanceLog {
  uuid: string;
  user: { uuid: string; full_name: string };
  created_at: string;
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
