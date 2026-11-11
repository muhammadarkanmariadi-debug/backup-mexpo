import { httpGet, httpPost, httpPut, httpDelete } from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";

export interface TenantCategory {
  uuid: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type GetTenantCategoriesParams = 
  | string 
  | { search?: string; is_active?: boolean; page?: number; quantity?: number };

export async function getTenantCategories(params?: GetTenantCategoriesParams) {
  const query = new URLSearchParams();
  if (typeof params === "string") {
    if (params) query.append("search", params);
  } else if (params) {
    if (params.search) query.append("search", params.search);
    if (params.is_active !== undefined) query.append("is_active", String(params.is_active));
    if (params.page !== undefined) query.append("page", String(params.page));
    if (params.quantity !== undefined) query.append("quantity", String(params.quantity));
  }

  const qs = query.toString();
  const url = qs ? `tenant-categories?${qs}` : "tenant-categories";
  const res = await httpGet(url, "token", META_DYNAMIC);
  if (!res.status) throw new Error(res.message || "Gagal mengambil data");
  const resData = res.data as Record<string, unknown>;
  return {
    data: (resData?.data ?? res.data ?? []) as TenantCategory[],
    status: res.status,
    meta: (resData?.meta ?? { counts: Array.isArray(res.data) ? res.data.length : 0 }) as { counts: number },
  };
}

export async function createTenantCategory(payload: { name: string; description?: string; is_active?: boolean }) {
  const res = await httpPost("tenant-categories", JSON.stringify(payload), "token");
  if (!res.status) throw new Error(res.message || "Gagal membuat kategori");
  return res.data;
}

export async function updateTenantCategory(id: string, payload: { name: string; description?: string; is_active?: boolean }) {
  const res = await httpPut(`tenant-categories/${id}`, JSON.stringify(payload), "token");
  if (!res.status) throw new Error(res.message || "Gagal memperbarui kategori");
  return res.data;
}

export async function toggleTenantCategoryStatus(id: string) {
  const res = await httpPut(`tenant-categories/${id}/toggle-status`, JSON.stringify({}), "token");
  if (!res.status) throw new Error(res.message || "Gagal mengubah status kategori");
  return res.data;
}

export async function deleteTenantCategory(id: string) {
  const res = await httpDelete(`tenant-categories/${id}`, "token");
  if (!res.status) throw new Error(res.message || "Gagal menghapus kategori");
  return res.data;
}
