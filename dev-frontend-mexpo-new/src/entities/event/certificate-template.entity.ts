// ============================================================
// Certificate template types (A10 — Konva designer / renderer)
// ============================================================

/** Dynamic certificate and badge values a text/image element can bind to. */
export type CertificateFieldKey =
  | "participant_name"
  | "event_name"
  | "workshop_title"
  | "date"
  | "organizer_name"
  | "certificate_number"
  | "organization"
  | "role"
  | "email"
  | "qr_code";

/**
 * Text binding = "default value vs custom value":
 * - `static`  → fixed default text typed by the designer.
 * - `dynamic` → per-recipient custom value resolved from certificate data.
 */
export interface CertificateBinding {
  type: "static" | "dynamic";
  /** Default/fallback text (used when static, or when the dynamic value is missing). */
  value?: string;
  /** Dynamic field key (only when type === "dynamic"). */
  key?: CertificateFieldKey;
}

export interface CertificateBackground {
  type: "color" | "image";
  /** Hex color when type === "color". */
  value?: string;
  /** Image URL when type === "image". */
  url?: string;
}

/** A serialized Konva node (className + attrs + optional children). */
export interface CertificateTemplateNode {
  className: string;
  attrs: Record<string, unknown> & {
    id?: string;
    text?: string;
    binding?: CertificateBinding;
    /** Image node source URL (we store the URL under `src`, not Konva's `image`). */
    src?: string;
  };
  children?: CertificateTemplateNode[];
}

/** The persisted Konva stage envelope stored in `certificate_templates.template`. */
export interface CertificateTemplateEnvelope {
  version: 1;
  width: number;
  height: number;
  background: CertificateBackground;
  /** Top-level Konva children (Layer(s)) of the stage. */
  nodes: CertificateTemplateNode[];
}

export interface CertificateTemplate {
  uuid: string;
  event_id: string;
  name: string;
  kind: string;
  template: CertificateTemplateEnvelope | null;
  background: string;
  is_active: boolean;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

/** Data a dynamic text element can resolve to, keyed by CertificateFieldKey. */
export type CertificateData = Record<CertificateFieldKey, string>;