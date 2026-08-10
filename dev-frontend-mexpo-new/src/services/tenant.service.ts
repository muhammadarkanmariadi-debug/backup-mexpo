import { httpGet, httpPost, httpPut, httpDelete } from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";
import { Tenant, TenantStatus } from "@/entities/event/tenant.entity";
import { buildFormData } from "@/shared/utils/form-data";

export type TenantMemberRole = "OWNER" | "STAFF";

export interface TenantMember {
  uuid: string;
  tenant_id: string;
  user_id: string;
  status: TenantStatus;
  role: TenantMemberRole;
  user: { uuid: string; full_name: string; email: string; photo: string };
}

export interface TenantProfilePayload {
  name: string;
  description: string;
  phone: string;
  website?: string;
  email?: string;
  booth_number?: string;
  category_id?: string;
}

export async function getTenantDetail(tenantId: string) {
  const res = await httpGet(`tenants/detail/${tenantId}`, "token", META_DYNAMIC);
  return { data: (res.data as Tenant) ?? null, status: res.status, message: res.message };
}

export async function updateTenant(tenantId: string, payload: TenantProfilePayload, logo?: File) {
  const fd = buildFormData(payload as unknown as Record<string, unknown>, logo);
  return await httpPut(`tenants/${tenantId}`, fd, "token");
}

// ── Team (A13) ──

export async function getTenantMembers(tenantId: string) {
  const res = await httpGet(`tenants/members/${tenantId}`, "token", META_DYNAMIC);
  return { data: (res.data as TenantMember[]) ?? [], status: res.status, message: res.message };
}

export async function inviteTenantMember(tenantId: string, email: string) {
  return await httpPost(`tenants/invite/${tenantId}`, JSON.stringify({ email }), "token");
}

export async function verifyTenantMember(memberId: string, status: TenantStatus) {
  return await httpPut(`tenants/verify/member/${memberId}`, JSON.stringify({ status }), "token");
}

export async function removeTenantMember(memberId: string) {
  return await httpDelete(`tenants/member/${memberId}`, "token");
}

export async function changeTenantMemberRole(memberId: string, role: TenantMemberRole) {
  return await httpPut(`tenants/member/${memberId}`, JSON.stringify({ role }), "token");
}

// ── Verification (B5) ──

export async function verifyTenant(tenantId: string, status: TenantStatus) {
  return await httpPut(`tenants/verify/${tenantId}`, JSON.stringify({ status }), "token");
}
