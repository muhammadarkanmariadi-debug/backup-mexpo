import { httpGet, httpPost, httpPut } from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";
import { buildFormData } from "@/shared/utils/form-data";
import {
  CheckoutPayload,
  EventPayoutInfo,
  PaymentTransaction,
  SettlePayload,
  SettlementSummary,
} from "@/entities/payment/payment.entity";

/** JWT visitor — creates/attaches the payment intent and returns Snap token. */
export async function checkout(eventId: string, payload: CheckoutPayload = {}) {
  return await httpPost(`events/${eventId}/checkout`, JSON.stringify(payload), "token");
}

export async function getMyTransactions(eventId: string) {
  const res = await httpGet(`transactions/my/${eventId}`, "token", META_DYNAMIC);
  return {
    data: (res.data as PaymentTransaction[]) ?? [],
    status: res.status,
    message: res.message,
  };
}

export async function getTransaction(id: string) {
  const res = await httpGet(`transactions/${id}`, "token", META_DYNAMIC);
  return {
    data: (res.data as PaymentTransaction | null) ?? null,
    status: res.status,
    message: res.message,
  };
}

export async function getEventTransactions(
  eventId: string,
  query?: Record<string, string>,
) {
  const res = await httpGet(
    `events/${eventId}/transactions`,
    "token",
    META_DYNAMIC,
    query,
  );
  return {
    data: (res.data as PaymentTransaction[]) ?? [],
    status: res.status,
    message: res.message,
    meta: res.meta,
  };
}

export async function getSettlementSummary(eventId: string) {
  const res = await httpGet(
    `events/${eventId}/settlement-summary`,
    "token",
    META_DYNAMIC,
  );
  return {
    data: (res.data as SettlementSummary | null) ?? null,
    status: res.status,
    message: res.message,
  };
}

export async function updateEventPayout(
  eventId: string,
  payload: Partial<EventPayoutInfo>,
) {
  return await httpPut(
    `events/${eventId}/payout`,
    JSON.stringify({
      payout_bank_name: payload.bank_name,
      payout_account_number: payload.account_number,
      payout_account_holder: payload.account_holder,
    }),
    "token",
  );
}

/** SUPERADMIN — records the manual payout; optional proof-of-transfer image. */
export async function settleEvent(
  eventId: string,
  payload: SettlePayload,
  file?: File | null,
) {
  const fd = buildFormData(
    { amount_transferred: payload.amount_transferred, note: payload.note },
    file ?? undefined,
  );
  return await httpPost(`events/${eventId}/settle`, fd, "token");
}

export async function refundTransaction(id: string, reason: string) {
  return await httpPut(`transactions/${id}/refund`, JSON.stringify({ reason }), "token");
}