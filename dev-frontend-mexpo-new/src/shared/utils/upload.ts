/**
 * Client-side mirror of the backend upload rules (`helper/upload.format.ts`:
 * JPG/PNG/GIF, max 4 MB). Checked before the multipart body is handed to the
 * server action, so a bad file fails fast with a readable message instead of
 * a 413 from the server-action body limit or a generic backend 400.
 */
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif"];

export function assertUploadableImage(file: File | null | undefined): void {
  if (!file) return;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Format gambar harus JPG, PNG, atau GIF.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`Ukuran gambar maksimal 4 MB (file ini ${mb} MB).`);
  }
}
