import { httpGet, httpPost, httpPut, httpDelete } from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";
import { EventRundown } from "@/entities/event/rundown.entity";
import { EventSponsor, SponsorLevel } from "@/entities/event/sponsor.entity";
import { EventContact } from "@/entities/event/contact.entity";
import { EventSpeaker } from "@/entities/event/speaker.entity";

// ============================================================
// Event detail management (B10): rundowns, sponsors, contacts, speakers
// ============================================================

// ── Rundown ──────────────────────────────────────────────────

export interface RundownPayload {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
}

export async function getRundowns(eventId: string, query?: Record<string, string>) {
  const res = await httpGet(`event-rundowns/${eventId}`, "token", META_DYNAMIC, query);
  return { data: res.data as EventRundown[], status: res.status, meta: res.meta };
}

export async function createRundown(eventId: string, payload: RundownPayload) {
  return await httpPost(`event-rundowns/${eventId}`, JSON.stringify(payload), "token");
}

export async function updateRundown(id: string, payload: Partial<RundownPayload>) {
  return await httpPut(`event-rundowns/${id}`, JSON.stringify(payload), "token");
}

export async function deleteRundown(id: string) {
  return await httpDelete(`event-rundowns/${id}`, "token");
}

export async function attachSpeakerToRundown(rundownId: string, speakerId: string) {
  return await httpPost(`event-rundowns/speaker/${rundownId}`, JSON.stringify({ speaker_id: speakerId }), "token");
}

export async function removeSpeakerFromRundown(speakerLinkId: string) {
  return await httpDelete(`event-rundowns/speaker/${speakerLinkId}`, "token");
}

// ── Sponsor ─────────────────────────────────────────────────

export interface SponsorPayload {
  name: string;
  level?: SponsorLevel;
}

export async function getSponsors(eventId: string, query?: Record<string, string>) {
  const res = await httpGet(`event-sponsors/${eventId}`, "token", META_DYNAMIC, query);
  return { data: res.data as EventSponsor[], status: res.status, meta: res.meta };
}

function buildSponsorFormData(payload: SponsorPayload, file?: File | null): FormData {
  const fd = new FormData();
  fd.append("name", payload.name);
  if (payload.level) fd.append("level", payload.level);
  if (file) fd.append("file", file);
  return fd;
}

export async function createSponsor(eventId: string, payload: SponsorPayload, file?: File | null) {
  return await httpPost(`event-sponsors/${eventId}`, buildSponsorFormData(payload, file), "token");
}

export async function updateSponsor(id: string, payload: SponsorPayload, file?: File | null) {
  return await httpPut(`event-sponsors/${id}`, buildSponsorFormData(payload, file), "token");
}

export async function deleteSponsor(id: string) {
  return await httpDelete(`event-sponsors/${id}`, "token");
}

// ── Contact ─────────────────────────────────────────────────

export interface ContactPayload {
  name: string;
  email: string;
  phone_number: string;
}

export async function getContacts(eventId: string, query?: Record<string, string>) {
  const res = await httpGet(`event-contacts/${eventId}`, "token", META_DYNAMIC, query);
  return { data: res.data as EventContact[], status: res.status, meta: res.meta };
}

export async function createContact(eventId: string, payload: ContactPayload) {
  return await httpPost(`event-contacts/${eventId}`, JSON.stringify(payload), "token");
}

export async function updateContact(id: string, payload: Partial<ContactPayload>) {
  return await httpPut(`event-contacts/${id}`, JSON.stringify(payload), "token");
}

export async function deleteContact(id: string) {
  return await httpDelete(`event-contacts/${id}`, "token");
}

// ── Speaker ─────────────────────────────────────────────────

export interface SpeakerPayload {
  name: string;
  bio: string;
}

export async function getSpeakers(eventId: string, query?: Record<string, string>) {
  const res = await httpGet(`event-speakers/${eventId}`, "token", META_DYNAMIC, query);
  return { data: res.data as EventSpeaker[], status: res.status, meta: res.meta };
}

function buildSpeakerFormData(payload: SpeakerPayload, file?: File | null): FormData {
  const fd = new FormData();
  fd.append("name", payload.name);
  fd.append("bio", payload.bio);
  if (file) fd.append("file", file);
  return fd;
}

export async function createSpeaker(eventId: string, payload: SpeakerPayload, file?: File | null) {
  return await httpPost(`event-speakers/${eventId}`, buildSpeakerFormData(payload, file), "token");
}

export async function updateSpeaker(id: string, payload: SpeakerPayload, file?: File | null) {
  return await httpPut(`event-speakers/${id}`, buildSpeakerFormData(payload, file), "token");
}

export async function deleteSpeaker(id: string) {
  return await httpDelete(`event-speakers/${id}`, "token");
}
