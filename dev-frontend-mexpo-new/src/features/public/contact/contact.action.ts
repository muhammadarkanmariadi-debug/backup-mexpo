"use server";

import { contactSchema, type ContactFormData } from "./contact.schema";
import { httpPost } from "@/shared/utils/http-client";

/**
 * Public contact destination. Backend override: operator may point this at a
 * different inbox via the `CONTACT_DESTINATION_EMAIL` env var. Keep in sync
 * with the display value in contact.data.ts (Email card).
 */
const CONTACT_DESTINATION_EMAIL = "tefa@smktelkom-mlg.sch.id";

export type ContactActionResult = {
  success: boolean;
  message: string;
  mailto?: string;
};

/**
 * Submits the public contact form to the backend `POST /contact` endpoint,
 * which persists the message and notifies the team by email.
 * If the API is unreachable (network error), falls back to opening the
 * visitor's mail client pre-filled with the message — and says so honestly.
 */
export async function submitContactAction(
  data: ContactFormData
): Promise<ContactActionResult> {
  const parsed = contactSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: "Data tidak valid. Periksa kembali isian Anda.",
    };
  }

  const { name, email, subject, message } = parsed.data;

  try {
    const result = await httpPost<{ uuid: string }>(
      "contact",
      JSON.stringify({ name, email, subject, message })
    );

    if (result.status) {
      return {
        success: true,
        message: "Pesan terkirim. Terima kasih!",
      };
    }

    // API reachable but rejected it (validation / rate limit / server error).
    return {
      success: false,
      message:
        result.message ?? "Pesan gagal terkirim. Silakan coba beberapa saat lagi.",
    };
  } catch {
    // Network-level failure — fall back to mailto so the message isn't lost.
    return buildMailtoFallback({ name, email, subject, message });
  }
}

function buildMailtoFallback(data: ContactFormData): ContactActionResult {
  const { name, email, subject, message } = data;
  const body = `Nama: ${name}\nEmail: ${email}\n\n${message}`;
  const mailto = `mailto:${CONTACT_DESTINATION_EMAIL}?subject=${encodeURIComponent(
    `[Mexpo] ${subject}`
  )}&body=${encodeURIComponent(body)}`;

  return {
    success: true,
    message:
      "Server tidak dapat dijangkau. Membuka aplikasi email Anda sebagai cadangan.",
    mailto,
  };
}