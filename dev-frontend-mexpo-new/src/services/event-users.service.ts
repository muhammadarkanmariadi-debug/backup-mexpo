import { httpGet, httpPost, httpPut, httpDelete } from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";

export interface EventUser {
  uuid: string;
  event_id: string;
  role: "OWNER" | "COMMITTEE" | "TENANT" | "VISITOR";
  status: "PENDING" | "APPROVED" | "REJECTED";
  user: { uuid: string; full_name: string; email: string; photo: string };
  /** A8 — dynamic custom-form answers for this user on this event (VISITOR only). */
  registrationAnswers?: { field_key: string; label: string; value: string }[];
}

export async function getEventUsers(
  eventId: string,
  query?: Record<string, string>,
) {
  const res = await httpGet(`event-users/${eventId}`, "token", META_DYNAMIC, query);
  return { data: (res.data as EventUser[]) ?? [], status: res.status, message: res.message, meta: res.meta };
}

/** B5 — owner/superadmin approves/rejects a committee/tenant request. */
export async function verifyEventUser(id: string, status: "APPROVED" | "REJECTED") {
  return await httpPut(`event-users/${id}`, JSON.stringify({ status }), "token");
}

/** Owner assigns a committee member directly by email (APPROVED). */
export async function addCommitteeMember(eventId: string, email: string) {
  return await httpPost(
    `event-users/committee/${eventId}`,
    JSON.stringify({ email }),
    "token",
  );
}

/** Change a member's role (OWNER/COMMITTEE/TENANT/VISITOR). */
export async function changeEventUserRole(
  id: string,
  role: EventUser["role"],
) {
  return await httpPut(`event-users/${id}`, JSON.stringify({ role }), "token");
}

/** Remove a member from the event (owner). */
export async function removeEventUser(id: string) {
  return await httpDelete(`event-users/${id}`, "token");
}

