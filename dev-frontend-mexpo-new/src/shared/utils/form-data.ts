/**
 * Builds a multipart FormData payload for the backend.
 * - `null`/`undefined` fields are skipped (so optional DTO dates stay unset).
 * - objects/arrays are JSON-stringified (backend `@Transform` parses them).
 * - an optional file is appended under `file` (matches FileInterceptor).
 */
export function buildFormData(
  fields: Record<string, unknown>,
  file?: File,
  fileKey = "file",
): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "object") {
      fd.append(key, JSON.stringify(value));
    } else {
      fd.append(key, String(value));
    }
  }
  if (file) fd.append(fileKey, file);
  return fd;
}
