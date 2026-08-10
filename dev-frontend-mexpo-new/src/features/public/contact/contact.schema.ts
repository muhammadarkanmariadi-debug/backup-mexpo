import { z } from "zod";

/** Validation for the public contact form (FIX-20). */
export const contactSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  subject: z.string().min(1, "Subjek wajib diisi"),
  message: z.string().min(10, "Pesan minimal 10 karakter"),
});

export type ContactFormData = z.infer<typeof contactSchema>;
