import { httpGet, httpPost, httpPut, httpDelete } from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";
import { buildFormData } from "@/shared/utils/form-data";

export interface TransactionDetail {
  product_id: string;
  quantity: number;
}

export interface Transaction {
  uuid: string;
  amount: number;
  transaction_date: string;
  payment_method: string;
  paid: boolean;
  proof: string;
  tenantTransactionDetails: {
    product: { name: string };
    quantity: number;
    purchase_price: number;
  }[];
}

export async function getTransactions(
  tenantId: string,
  query?: Record<string, string>,
) {
  const res = await httpGet(`tenant-transactions/${tenantId}`, "token", META_DYNAMIC, query);
  return { data: (res.data as Transaction[]) ?? [], status: res.status, message: res.message, meta: res.meta };
}

export async function createTransaction(
  tenantId: string,
  detail_transactions: TransactionDetail[],
  payment_method: string,
  paid: boolean,
  proof?: File,
  visitor_id?: string,
) {
  const fd = buildFormData(
    {
      detail_transactions: detail_transactions,
      payment_method,
      paid,
      visitor_id,
    },
    proof,
  );
  return await httpPost(`tenant-transactions/${tenantId}`, fd, "token");
}

export async function updateTransaction(
  id: string,
  payload: { payment_method?: string; paid?: boolean },
) {
  return await httpPut(`tenant-transactions/${id}`, JSON.stringify(payload), "token");
}

export async function deleteTransaction(id: string) {
  return await httpDelete(`tenant-transactions/${id}`, "token");
}
