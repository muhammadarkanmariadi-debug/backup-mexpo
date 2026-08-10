import { httpGet, httpPost, httpPut, httpDelete } from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";
import { Workshop } from "@/entities/event/workshop.entity";

export async function registerWorkshop(workshopId: string) {
    return await httpPost(`workshop-bookings/${workshopId}`, "{}", "token");
}

export interface WorkshopPayload {
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  quota?: number;
  is_public?: boolean;
}

export async function getWorkshops(
  eventId: string,
  query?: Record<string, string>,
) {
  const res = await httpGet(`workshops/${eventId}`, "token", META_DYNAMIC, query);
  return { data: (res.data as Workshop[]) ?? [], status: res.status, message: res.message, meta: res.meta };
}

export async function createWorkshop(eventId: string, payload: WorkshopPayload) {
  return await httpPost(`workshops/${eventId}`, JSON.stringify(payload), "token");
}

export async function updateWorkshop(id: string, payload: Partial<WorkshopPayload>) {
  return await httpPut(`workshops/${id}`, JSON.stringify(payload), "token");
}

export async function deleteWorkshop(id: string) {
  return await httpDelete(`workshops/${id}`, "token");
}

export async function attachWorkshopSpeaker(workshopId: string, speakerId: string) {
  return await httpPost(
    `workshops/speaker/${workshopId}`,
    JSON.stringify({ speaker_id: speakerId }),
    "token",
  );
}

export async function removeWorkshopSpeaker(workshopSpeakerId: string) {
  return await httpDelete(`workshops/speaker/${workshopSpeakerId}`, "token");
}

export interface Certificate {
  uuid: string;
  workshop_id: string;
  status: string;
  checkin_at: string | null;
  workshop: Workshop;
}

/** A10 — the caller's CHECKED_IN workshop bookings (certificate data). */
export async function getMyCertificates(eventId: string) {
  const res = await httpGet(`workshop-bookings/certificates/my/${eventId}`, "token", META_DYNAMIC);
  return { data: (res.data as Certificate[]) ?? [], status: res.status, message: res.message };
}
