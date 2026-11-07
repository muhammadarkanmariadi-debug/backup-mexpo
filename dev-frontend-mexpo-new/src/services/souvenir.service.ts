import { httpGet, httpPost, httpPut } from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";
import { SouvenirRules, SouvenirTier } from "@/entities/event/event.entity";

export interface SouvenirRecord {
  id: number;
  souvenir_name: string;
  points_earned: number;
  points_spent: number;
  created_at: string;
  users: { uuid: string; full_name: string; email: string };
  creator?: { full_name: string };
}

/** Recipient history for an event (committee/owner). */
export async function listSouvenirs(eventId: string, query?: Record<string, string>) {
  const res = await httpGet(`souvenirs/${eventId}`, "token", META_DYNAMIC, query);
  return {
    data: (res.data ?? []) as unknown as SouvenirRecord[],
    status: res.status,
    message: res.message,
  };
}

/** Quick update of an event's souvenir rules (organizer). */
export async function updateSouvenirRules(eventId: string, rules: SouvenirRules) {
  return await httpPut(
    `events/${eventId}`,
    JSON.stringify({ souvenir_rules: rules }),
    "token",
  );
}

export interface SouvenirPointBreakdown {
  booth: { enabled: boolean; count: number; points: number };
  seminar: { enabled: boolean; count: number; points: number };
  transaction: {
    enabled: boolean;
    count: number;
    totalAmount: number;
    points: number;
  };
}

export interface SouvenirCheckResult {
  user: { uuid: string; full_name: string; email: string; photo: string };
  usePointSystem: boolean;
  eligible: boolean;
  reasons: string[];
  boothVisits: number;
  seminarCount: number;
  joinedSeminar: boolean;
  transactionCount: number;
  transactionTotal: number;
  totalPoints: number;
  spentPoints: number;
  availablePoints: number;
  claimedCount: number;
  claims: { souvenir_name: string; points_spent: number; claimed_at: string }[];
  pointBreakdown: SouvenirPointBreakdown;
  tiers: (SouvenirTier & { unlocked: boolean; missingPoints: number })[];
  eligibleTiers: SouvenirTier[];
  recommendedTier: SouvenirTier | null;
  alreadyClaimed: boolean;
  claimedSouvenir: {
    souvenir_name: string;
    points_earned: number;
    claimed_at: string;
  } | null;
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
export async function grantSouvenir(
  eventId: string,
  userId: string,
  tierId?: string,
) {
  return await httpPost(
    `souvenirs/${eventId}`,
    JSON.stringify({ user_id: userId, tier_id: tierId }),
    "token",
  );
}
