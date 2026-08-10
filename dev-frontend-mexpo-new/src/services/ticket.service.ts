import { httpGet, httpPost, httpPut, httpDelete } from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";
import { Ticket, TicketStatus, TicketType } from "@/entities/event/event.entity";

// ── Owner: ticket types ──

export interface TicketTypePayload {
  name: string;
  price: number;
}

export async function createTicketType(eventId: string, payload: TicketTypePayload) {
  return await httpPost(`ticket-types/${eventId}`, JSON.stringify(payload), "token");
}

export async function updateTicketType(id: string, payload: Partial<TicketTypePayload>) {
  return await httpPut(`ticket-types/${id}`, JSON.stringify(payload), "token");
}

export async function deleteTicketType(id: string) {
  return await httpDelete(`ticket-types/${id}`, "token");
}

export async function getEventTicketTypes(eventId: string) {
  const res = await httpGet(`ticket-types/${eventId}`, "token", META_DYNAMIC);
  return { data: (res.data as TicketType[]) ?? [], status: res.status, message: res.message };
}

// ── Tickets ──

export interface BuyTicketPayload {
  ticket_type_id?: string;
  payment_reference?: string;
  payment_method?: string;
}

export async function buyTicket(eventId: string, payload: BuyTicketPayload) {
  return await httpPost(`tickets/${eventId}`, JSON.stringify(payload), "token");
}

export async function getMyTickets(eventId: string) {
  const res = await httpGet(`tickets/my/${eventId}`, "token", META_DYNAMIC);
  return { data: (res.data as Ticket[]) ?? [], status: res.status, message: res.message };
}

export async function getEventTickets(eventId: string) {
  const res = await httpGet(`tickets/${eventId}`, "token", META_DYNAMIC);
  return { data: (res.data as Ticket[]) ?? [], status: res.status, message: res.message };
}

export async function updateTicket(
  id: string,
  payload: { status?: TicketStatus; payment_reference?: string; payment_method?: string },
) {
  return await httpPut(`tickets/${id}`, JSON.stringify(payload), "token");
}
