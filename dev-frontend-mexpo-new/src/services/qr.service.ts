import { httpGet, httpPost } from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";

export interface MyQr {
  code_data: string;
  image: string;
  event_id: string;
  user_id: string;
}

export interface ResolvedUser {
  uuid: string;
  full_name: string;
  email: string;
  photo: string;
}

export interface ResolvedQr {
  event_id: string;
  user_id: string;
  user: ResolvedUser;
}

/** A4 — my universal QR for an event (image data URL + raw code). */
export async function getMyQr(eventId: string) {
  const res = await httpGet(`qr-codes/my/${eventId}`, "token", META_DYNAMIC);
  return { data: (res.data as MyQr) ?? null, status: res.status, message: res.message };
}

/** A4 — resolve a scanned QR code to the participant identity. */
export async function resolveQr(codeData: string) {
  return (await httpPost(
    "qr-codes/resolve",
    JSON.stringify({ code_data: codeData }),
    "token",
  )) as unknown as {
    data: ResolvedQr;
    status: boolean;
    message?: string | null;
  };
}
