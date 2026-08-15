import { httpPost } from "@/shared/utils/http-client";

export interface SouvenirCheckResult {
  user: { uuid: string; full_name: string; email: string; photo: string };
  eligible: boolean;
  reasons: string[];
  boothVisits: number;
  joinedSeminar: boolean;
  alreadyClaimed: boolean;
}

/** A6/B7 — check a visitor's souvenir eligibility (no grant). */
export async function checkSouvenir(eventId: string, userId: string) {
  return (await httpPost(
    `souvenirs/check/${eventId}`,
    JSON.stringify({ user_id: userId }),
    "token",
  )) as unknown as {
    data: SouvenirCheckResult;
    status: boolean;
    message?: string | null;
  };
}

/** A6 — grant a souvenir to a visitor (validates rules server-side). */
export async function grantSouvenir(eventId: string, userId: string) {
  return await httpPost(
    `souvenirs/${eventId}`,
    JSON.stringify({ user_id: userId }),
    "token",
  );
}
