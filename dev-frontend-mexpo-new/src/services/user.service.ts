import { User } from "@/entities/auth/user.entity";
import { httpGet, httpPut, httpPost } from "../shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";
import { buildFormData } from "@/shared/utils/form-data";

export interface UserListItem {
  uuid: string;
  full_name: string;
  email: string;
  phone: string;
  organization: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  phone?: string;
  organization?: string;
}

/** Thrown by getProfile when the API rejects the token (expired or invalid). */
export class UnauthorizedError extends Error {
  constructor() {
    super("Sesi berakhir. Silakan masuk kembali.");
    this.name = "UnauthorizedError";
  }
}

/**
 * Current user. Throws instead of returning the error body: httpRequest hands
 * back the API's error JSON as `data` on a non-2xx response, which used to be
 * stored as the logged-in user (e.g. `{ message: "Unauthorized" }`).
 */
export async function getProfile(): Promise<User> {
  const res = await httpGet("users/me", "token");
  const data = res.data as Partial<User> | null | undefined;
  if (!res.status || !data || typeof data !== "object" || !data.uuid) {
    if (res.code === 401) throw new UnauthorizedError();
    throw new Error(res.message ?? "Gagal memuat profil");
  }
  return data as User;
}

/** Superadmin: list users with search + is_active filter + pagination. */
export async function getUsers(query?: Record<string, string>) {
  const res = await httpGet("users", "token", META_DYNAMIC, query);
  return {
    data: (Array.isArray(res.data) ? res.data : []) as UserListItem[],
    status: res.status,
    message: res.message,
    meta: res.meta,
  };
}

/** Update own profile — multipart so a photo can be attached. */
export async function updateProfile(payload: UpdateProfilePayload, photo?: File) {
  const fd = buildFormData(payload as unknown as Record<string, unknown>, photo);
  return await httpPut("users/me", fd, "token");
}

/** B11 — request a reset-password email. */
export async function requestResetPassword(email: string) {
  return await httpPost("users/reset-password", JSON.stringify({ email }), "Basic");
}

/** B11 — confirm reset with token + new password. */
export async function verifyResetPassword(
  token: string,
  password: string,
  confirm_password: string,
) {
  return await httpPost(
    "users/reset-password/verify",
    JSON.stringify({ token, password, confirm_password }),
    "Basic",
  );
}

/** Change own password — requires the current password (verified server-side). */
export async function changePassword(
  current_password: string,
  password: string,
  confirm_password: string,
) {
  return await httpPut(
    "users/me/password",
    JSON.stringify({ current_password, password, confirm_password }),
    "token",
  );
}

/**
 * Change own email — requires the current password. The account is set
 * inactive again until the new address is verified via the emailed link.
 */
export async function changeEmail(email: string, current_password: string) {
  return await httpPut(
    "users/me/email",
    JSON.stringify({ email, current_password }),
    "token",
  );
}

export interface BulkUserItem {
  full_name: string;
  email: string;
  phone?: string;
  organization?: string;
  role?: string;
}

/** Superadmin: bulk import users from Excel */
export async function bulkImportUsers(users: BulkUserItem[]) {
  return await httpPost(
    "users/bulk-import",
    JSON.stringify({ users }),
    "token",
  );
}

