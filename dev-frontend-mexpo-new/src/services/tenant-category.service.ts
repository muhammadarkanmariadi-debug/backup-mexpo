import { httpGet, httpPost, httpPut, httpDelete } from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";

export interface TenantCategory {
  uuid: string;
  name: string;
  description: string;
}

export async function getTenantCategories(search?: string) {
  const url = search ? `tenant-categories?name=${encodeURIComponent(search)}` : "tenant-categories";
  const res = await httpGet(url, "token", META_DYNAMIC);
  if (!res.status) throw new Error(res.message || "Gagal mengambil data");
  const resData = res.data as Record<string, unknown>;
  return {
    data: (resData?.data ?? res.data ?? []) as TenantCategory[],
    status: res.status,
    meta: (resData?.meta ?? { counts: Array.isArray(res.data) ? res.data.length : 0 }) as { counts: number },
  };
}

export async function createTenantCategory(payload: { name: string; description?: string }) {
  const res = await httpPost("tenant-categories", JSON.stringify(payload), "token");
  if (!res.status) throw new Error(res.message || "Gagal membuat kategori");
  return res.data;
}

export async function updateTenantCategory(id: string, payload: { name: string; description?: string }) {
  const res = await httpPut(`tenant-categories/${id}`, JSON.stringify(payload), "token");
  if (!res.status) throw new Error(res.message || "Gagal memperbarui kategori");
  return res.data;
}

export async function deleteTenantCategory(id: string) {
  const res = await httpDelete(`tenant-categories/${id}`, "token");
  if (!res.status) throw new Error(res.message || "Gagal menghapus kategori");
  return res.data;
}
