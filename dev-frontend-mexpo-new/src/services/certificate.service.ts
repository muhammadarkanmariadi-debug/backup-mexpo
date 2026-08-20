import { httpDelete, httpGet, httpPost, httpPut } from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";
import {
  CertificateTemplate,
  CertificateTemplateEnvelope,
} from "@/entities/event/certificate-template.entity";

export interface CertificateTemplatePayload {
  name?: string;
  kind?: string;
  template?: CertificateTemplateEnvelope | null;
  is_active?: boolean;
}

/** List templates of an event (owner/committee manage view). */
export async function getCertificateTemplates(
  eventId: string,
  query?: Record<string, string>,
) {
  const res = await httpGet(
    `certificates/templates/${eventId}`,
    "token",
    META_DYNAMIC,
    query,
  );
  return {
    data: (res.data as CertificateTemplate[]) ?? [],
    status: res.status,
    message: res.message,
    meta: res.meta,
  };
}

/** The active template used to render certificates for an event (or null). */
export async function getActiveCertificateTemplate(eventId: string) {
  const res = await httpGet(
    `certificates/templates/active/${eventId}`,
    "token",
    META_DYNAMIC,
  );
  return {
    data: (res.data as CertificateTemplate | null) ?? null,
    status: res.status,
    message: res.message,
  };
}

function buildTemplateFormData(
  payload: CertificateTemplatePayload,
  file?: File | null,
): FormData {
  const fd = new FormData();
  if (payload.name) fd.append("name", payload.name);
  if (payload.kind) fd.append("kind", payload.kind);
  if (payload.template) fd.append("template", JSON.stringify(payload.template));
  if (typeof payload.is_active === "boolean") {
    fd.append("is_active", String(payload.is_active));
  }
  if (file) fd.append("file", file);
  return fd;
}

export async function createCertificateTemplate(
  eventId: string,
  payload: CertificateTemplatePayload,
  file?: File | null,
) {
  return await httpPost(
    `certificates/templates/${eventId}`,
    buildTemplateFormData(payload, file),
    "token",
  );
}

export async function updateCertificateTemplate(
  id: string,
  payload: CertificateTemplatePayload,
  file?: File | null,
) {
  return await httpPut(
    `certificates/templates/${id}`,
    buildTemplateFormData(payload, file),
    "token",
  );
}

export async function deleteCertificateTemplate(id: string) {
  return await httpDelete(`certificates/templates/${id}`, "token");
}