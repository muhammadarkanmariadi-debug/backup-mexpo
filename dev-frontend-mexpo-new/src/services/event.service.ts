import { Event, SouvenirRules } from "@/entities/event/event.entity";
import {
  httpPut,
  httpDelete,
  httpGet,
  httpPost,
} from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";
import { assertUploadableImage } from "@/shared/utils/upload";

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
  souvenir_rules?: SouvenirRules;
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

/** Super admin list of all events (for settlements etc.) */
export async function getAllEvents(query?: Record<string, string>) {
  const res = await httpGet(`events`, "token", META_DYNAMIC, query);
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
  payload: Partial<CreateEventPayload>,
  file?: File | null
): FormData {
  const fd = new FormData();
  if (payload.name !== undefined) fd.append("name", payload.name);
  if (payload.description !== undefined) fd.append("description", payload.description);
  if (payload.location !== undefined) fd.append("location", payload.location);
  if (payload.organizer_name !== undefined) fd.append("organizer_name", payload.organizer_name);
  if (payload.start_date !== undefined) fd.append("start_date", payload.start_date);
  if (payload.end_date !== undefined) fd.append("end_date", payload.end_date);
  if (payload.registration_start !== undefined) fd.append("registration_start", payload.registration_start);
  if (payload.registration_deadline !== undefined) fd.append("registration_deadline", payload.registration_deadline);
  if (payload.quota !== undefined) fd.append("quota", String(payload.quota));
  if (payload.visibility !== undefined) fd.append("visibility", payload.visibility);
  if (payload.event_type !== undefined) fd.append("event_type", payload.event_type);
  if (payload.ticket_mode !== undefined) fd.append("ticket_mode", payload.ticket_mode);
  if (payload.features !== undefined) fd.append("features", JSON.stringify(payload.features));
  if (payload.souvenir_rules !== undefined) fd.append("souvenir_rules", JSON.stringify(payload.souvenir_rules));
  if (file) {
    assertUploadableImage(file);
    fd.append("file", file);
  }
  return fd;
}

export async function createEvent(payload: CreateEventPayload, file?: File | null) {
  return await httpPost(`events`, buildEventFormData(payload, file), "token");
}

export async function updateEvent(
  uuid: string,
  payload: Partial<CreateEventPayload>,
  file?: File | null
) {
  return await httpPut(`events/${uuid}`, buildEventFormData(payload, file), "token");
}

/** Photo-only update for an event (sends only the file in multipart form data). */
export async function updateEventPhoto(uuid: string, file: File) {
  return await updateEvent(uuid, {}, file);
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
        // On failure httpGet puts the raw error body in `data`. Never hand that
        // out as an event: pages used to render an empty shell from it (no name,
        // no role, "registrasi ditutup") and child tabs then called the API with
        // `event.uuid === undefined`.
        data: (res.status ? res.data : null) as Event,
        status: res.status,
        code: res.code,
        message: res.message
    };


}
