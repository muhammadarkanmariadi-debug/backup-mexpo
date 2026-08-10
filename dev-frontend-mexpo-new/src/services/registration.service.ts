import { httpGet, httpPost } from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";
import { RegistrationField, TicketType } from "@/entities/event/event.entity";

export interface RegistrationAnswer {
  field_key: string;
  value?: string;
}

export interface RegisterVisitorPayload {
  full_name: string;
  email: string;
  phone: string;
  organization?: string;
  ticket_type_id?: string;
  payment_reference?: string;
  payment_method?: string;
  answers?: RegistrationAnswer[];
}

/** A8 — public registration form schema (Basic auth). */
export async function getRegistrationFields(eventId: string) {
  const res = await httpGet(`public-api/registration-fields/${eventId}`, "Basic", META_DYNAMIC);
  return { data: (res.data as RegistrationField[]) ?? [], status: res.status, message: res.message };
}

/** A1 — public ticket types for a published event (Basic auth). */
export async function getTicketTypes(eventId: string) {
  const res = await httpGet(`public-api/ticket-types/${eventId}`, "Basic", META_DYNAMIC);
  return { data: (res.data as TicketType[]) ?? [], status: res.status, message: res.message };
}

/** Visitor self-registration (Basic auth) — issues a ticket + stores answers. */
export async function registerVisitor(eventId: string, payload: RegisterVisitorPayload) {
  return await httpPost(`public-api/registration/${eventId}`, JSON.stringify(payload), "Basic");
}
