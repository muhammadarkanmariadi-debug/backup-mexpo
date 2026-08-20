// ============================================================
// Payment / settlement types (Midtrans Snap escrow — A1b)
// ============================================================

export type TransactionStatus =
  | "PENDING"
  | "PAID"
  | "EXPIRED"
  | "FAILED"
  | "REFUNDED";

export type PayoutStatus = "NOT_SETTLED" | "SETTLED";

export interface PaymentIntent {
  transaction_uuid: string;
  snap_token: string;
  order_id: string;
  amount: number;
  platform_fee: number;
  redirect_url: string;
}

export interface PaymentTransaction {
  uuid: string;
  event_id: string;
  user_id: string;
  ticket_id: string | null;
  midtrans_order_id: string;
  amount: number;
  platform_fee: number;
  status: TransactionStatus;
  payment_method: string;
  snap_token: string;
  paid_at: string | null;
  expired_at: string | null;
  refunded_at: string | null;
  refund_reason: string;
  created_at: string;
  updated_at: string;
  ticket?: {
    uuid: string;
    ticket_type?: { uuid: string; name: string; price: number } | null;
  } | null;
  user?: { uuid: string; full_name: string; email: string };
}

export interface EventPayoutInfo {
  bank_name: string;
  account_number: string;
  account_holder: string;
}

export interface EventSettlement {
  uuid: string;
  event_id: string;
  amount_transferred: number;
  transferred_by: string;
  proof_of_transfer: string;
  note: string;
  created_at: string;
}

export interface SettlementSummary {
  event_id: string;
  gross: number;
  platform_fee: number;
  net: number;
  paid_transactions: number;
  already_transferred: number;
  payout: EventPayoutInfo;
  payout_status: PayoutStatus;
  settled_at: string | null;
  settlements: EventSettlement[];
}

export interface CheckoutPayload {
  ticket_type_id?: string;
}

export interface SettlePayload {
  amount_transferred: number;
  note?: string;
}