import { PrismaService } from '../prisma/prisma.service';

/**
 * Configurable souvenir eligibility rules (A5).
 * Stored per-event in `events.souvenir_rules` (JSON).
 *
 * - `minVisitedBooth`: minimum distinct booth visits (default 5).
 * - `minTransaction`: minimum total transaction amount across the event
 *   (transactions must carry `visitor_id`, set via the POS visitor scan).
 * - `joinedSeminar`: visitor must have a non-cancelled workshop booking.
 * - `requireAll` (default true): ALL configured rules must pass; set `false`
 *   for ANY (at least one) rule to pass.
 */
export type SouvenirRules = {
  minVisitedBooth?: number;
  minTransaction?: number;
  joinedSeminar?: boolean;
  requireAll?: boolean;
};

export type SouvenirEligibility = {
  eligible: boolean;
  reasons: string[];
  data: {
    boothVisits: number;
    joinedSeminar: boolean;
    transactionTotal: number;
  };
};

export async function evaluateSouvenirEligibility(
  prisma: PrismaService,
  event: { uuid: string; souvenir_rules: unknown },
  userId: string,
): Promise<SouvenirEligibility> {
  const rules = (event.souvenir_rules ?? {}) as SouvenirRules;
  const reasons: string[] = [];
  const checks: boolean[] = [];
  let boothVisits = 0;

  // Rule 1 — minimum booth visits. Only enforced when explicitly configured;
  // an event with no `souvenir_rules` (or without minVisitedBooth) does not
  // inherit an invisible default rule (FIX: allow full opt-out).
  if (rules.minVisitedBooth !== undefined) {
    const minVisitedBooth = rules.minVisitedBooth;
    boothVisits = await prisma.booth_visits.count({
      where: { user_id: userId, event_id: event.uuid },
    });
    const boothOk = boothVisits >= minVisitedBooth;
    checks.push(boothOk);
    if (!boothOk) {
      reasons.push(`Kunjungan booth ${boothVisits}/${minVisitedBooth}`);
    }
  }

  // Rule 2 — minimum total transaction amount.
  let transactionTotal = 0;
  if (rules.minTransaction !== undefined && rules.minTransaction > 0) {
    const agg = await prisma.tenant_transactions.aggregate({
      where: { event_id: event.uuid, visitor_id: userId },
      _sum: { amount: true },
    });
    transactionTotal = agg._sum.amount ?? 0;
    const txOk = transactionTotal >= rules.minTransaction;
    checks.push(txOk);
    if (!txOk) {
      reasons.push(
        `Transaksi ${transactionTotal.toLocaleString('id-ID')}/${rules.minTransaction.toLocaleString('id-ID')}`,
      );
    }
  }

  // Rule 3 — joined a seminar/workshop.
  let joinedSeminar = false;
  if (rules.joinedSeminar === true) {
    joinedSeminar =
      (await prisma.workshop_bookings.count({
        where: {
          user_id: userId,
          status: { not: `CANCELLED` },
          workshop: { event_id: event.uuid },
        },
      })) > 0;
    checks.push(joinedSeminar);
    if (!joinedSeminar) {
      reasons.push(`Belum mengikuti seminar`);
    }
  }

  const requireAll = rules.requireAll ?? true;
  const eligible =
    checks.length === 0 ||
    (requireAll ? checks.every(Boolean) : checks.some(Boolean));

  return {
    eligible,
    reasons,
    data: { boothVisits, joinedSeminar, transactionTotal },
  };
}
