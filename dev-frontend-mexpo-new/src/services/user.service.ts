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

export async function getProfile() {
    const res = await httpGet('users/me', 'token')
    return res.data as User
}

/** Superadmin: list users with search + is_active filter + pagination. */
export async function getUsers(query?: Record<string, string>) {
  const res = await httpGet("users", "token", META_DYNAMIC, query);
  return {
    data: (res.data as UserListItem[]) ?? [],
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
