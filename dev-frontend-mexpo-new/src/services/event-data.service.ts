import { httpGet } from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";
import { Tenant } from "@/entities/event/tenant.entity";
import { Workshop } from "@/entities/event/workshop.entity";

export async function getEventTenants(eventId: string, query?: Record<string, string>) {
  const res = await httpGet(`tenants/${eventId}`, "token", META_DYNAMIC, query);
  return { data: (res.data as Tenant[]) ?? [], status: res.status, message: res.message, meta: res.meta };
}

export async function getEventWorkshops(eventId: string) {
  const res = await httpGet(`workshops/${eventId}`, "token", META_DYNAMIC);
  return { data: (res.data as Workshop[]) ?? [], status: res.status, message: res.message };
}

/** Tenants where the current user is an APPROVED member (tenant portal). */
export async function getMyTenants(eventId: string) {
  const res = await httpGet(`tenants/mine/${eventId}`, "token", META_DYNAMIC);
  return { data: (res.data as Tenant[]) ?? [], status: res.status, message: res.message };
}
