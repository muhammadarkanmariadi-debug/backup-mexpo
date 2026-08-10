import { Event } from "@/entities/event/event.entity";
import {
  httpPut,
  httpDelete,
  httpGet,
  httpPost,
} from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";

export interface CreateEventPayload {
  name: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  registration_start?: string;
  registration_deadline?: string;
  organizer_name?: string;
  quota?: number;
  visibility?: "PUBLIC" | "PRIVATE";
  event_type?: Event["event_type"];
  ticket_mode?: "FREE" | "PAID";
  features?: Event["features"];
  souvenir_rules?: {
    minVisitedBooth?: number;
    minTransaction?: number;
    joinedSeminar?: boolean;
    requireAll?: boolean;
  };
}

/** A3 — submit publish request (owner/committee). */
export async function publishRequest(uuid: string) {
  return await httpPost(`events/${uuid}/publish-request`, "", "token");
}

/** A3 — super admin approve/reject a pending event. */
export async function approveEvent(
  uuid: string,
  payload: { approved: boolean; rejection_reason?: string }
) {
  return await httpPut(`events/${uuid}/approval`, JSON.stringify(payload), "token");
}

/** Finish a PUBLISHED event (owner/committee). */
export async function finishEvent(uuid: string) {
  return await httpPut(`events/${uuid}/finish`, "", "token");
}

/** Reopen a FINISHED event (owner/committee). */
export async function reopenEvent(uuid: string) {
  return await httpPut(`events/${uuid}/reopen`, "", "token");
}

/** A3 — super admin approval queue. */
export async function getApprovalQueue(query?: Record<string, string>) {
  const res = await httpGet(`events/approval-queue`, "token", META_DYNAMIC, query);
  return {
    data: res.data as Event[],
    status: res.status,
    code: res.code,
    message: res.message,
    meta: res.meta,
  };
}

/** Builds multipart FormData for POST/PUT /events (backend FileInterceptor). */
function buildEventFormData(
  payload: CreateEventPayload,
  file?: File | null
): FormData {
  const fd = new FormData();
  fd.append("name", payload.name);
  fd.append("description", payload.description);
  fd.append("location", payload.location);
  if (payload.organizer_name) fd.append("organizer_name", payload.organizer_name);
  fd.append("start_date", payload.start_date);
  fd.append("end_date", payload.end_date);
  if (payload.registration_start) fd.append("registration_start", payload.registration_start);
  if (payload.registration_deadline) fd.append("registration_deadline", payload.registration_deadline);
  fd.append("quota", String(payload.quota ?? 0));
  if (payload.visibility) fd.append("visibility", payload.visibility);
  if (payload.event_type) fd.append("event_type", payload.event_type);
  if (payload.features) fd.append("features", JSON.stringify(payload.features));
  if (file) fd.append("file", file);
  return fd;
}

export async function createEvent(payload: CreateEventPayload, file?: File | null) {
  return await httpPost(`events`, buildEventFormData(payload, file), "token");
}

export async function updateEvent(
  uuid: string,
  payload: CreateEventPayload,
  file?: File | null
) {
  return await httpPut(`events/${uuid}`, buildEventFormData(payload, file), "token");
}

/** @deprecated A3 — publishing now goes through publish-request + super admin approval. */
export async function publishEvent(uuid: string) {
  return await httpPut(`events/${uuid}`, JSON.stringify({ status: "PUBLISHED" }), "token");
}

export async function deleteEvent(uuid: string) {
  return await httpDelete(`events/${uuid}`, "token");
}


export async function getEventByUuidByMe(uuid: string) {
    const res = await httpGet(
        `events/me/${uuid}`,
        "token",
        // Always fresh: the dashboard reflects publish/delete immediately (FIX-21).
        META_DYNAMIC
    );


    return {
        data: res.data as Event,
        status: res.status,
        code: res.code,
        message: res.message
    };


}
