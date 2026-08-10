import { httpGet, httpPost, httpPut, httpDelete } from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";
import { TenantProduct } from "@/entities/event/tenant.entity";
import { buildFormData } from "@/shared/utils/form-data";

export interface ProductPayload {
  name: string;
  description: string;
  price: number;
}

export async function getProducts(
  tenantId: string,
  query?: Record<string, string>,
) {
  const res = await httpGet(`tenant-products/${tenantId}`, "token", META_DYNAMIC, query);
  return { data: (res.data as TenantProduct[]) ?? [], status: res.status, message: res.message, meta: res.meta };
}

export async function createProduct(tenantId: string, payload: ProductPayload, photo?: File) {
  const fd = buildFormData(payload as unknown as Record<string, unknown>, photo);
  return await httpPost(`tenant-products/${tenantId}`, fd, "token");
}

export async function updateProduct(id: string, payload: Partial<ProductPayload>, photo?: File) {
  const fd = buildFormData(payload as unknown as Record<string, unknown>, photo);
  return await httpPut(`tenant-products/${id}`, fd, "token");
}

export async function deleteProduct(id: string) {
  return await httpDelete(`tenant-products/${id}`, "token");
}
