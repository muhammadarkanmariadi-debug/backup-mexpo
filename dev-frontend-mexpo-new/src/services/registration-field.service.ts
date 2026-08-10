import { httpGet, httpPost, httpPut, httpDelete } from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";
import { RegistrationField, RegistrationFieldType } from "@/entities/event/event.entity";

export interface RegistrationFieldPayload {
  field_key: string;
  label: string;
  type: RegistrationFieldType;
  required?: boolean;
  options?: string[];
  position?: number;
}

export async function getEventRegistrationFields(eventId: string) {
  const res = await httpGet(`event-registration-fields/${eventId}`, "token", META_DYNAMIC);
  return { data: (res.data as RegistrationField[]) ?? [], status: res.status, message: res.message };
}

export async function createRegistrationField(eventId: string, payload: RegistrationFieldPayload) {
  return await httpPost(`event-registration-fields/${eventId}`, JSON.stringify(payload), "token");
}

export async function updateRegistrationField(id: string, payload: Partial<RegistrationFieldPayload>) {
  return await httpPut(`event-registration-fields/${id}`, JSON.stringify(payload), "token");
}

export async function deleteRegistrationField(id: string) {
  return await httpDelete(`event-registration-fields/${id}`, "token");
}
