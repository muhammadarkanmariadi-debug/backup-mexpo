"use server";

import { contactSchema, type ContactFormData } from "./contact.schema";

/**
 * Public contact destination (see contact.data.ts — Email card).
 * There is currently no backend contact endpoint, so the form opens the
 * visitor's mail client pre-filled with the message (FIX-20). If a backend
 * contact/notification endpoint is added later, switch this action to post it.
 */
export const CONTACT_DESTINATION_EMAIL = await "tefa@smktelkom-mlg.sch.id";

export type ContactActionResult = {
  success: boolean;
  message: string;
  mailto?: string;
};

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
  const body = `Nama: ${name}\nEmail: ${email}\n\n${message}`;
  const mailto = `mailto:${CONTACT_DESTINATION_EMAIL}?subject=${encodeURIComponent(
    `[Mexpo] ${subject}`
  )}&body=${encodeURIComponent(body)}`;

  return {
    success: true,
    message: "Membuka aplikasi email Anda...",
    mailto,
  };
}
