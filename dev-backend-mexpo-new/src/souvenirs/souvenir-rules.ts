import { PrismaService } from '../prisma/prisma.service';

/**
 * Configurable souvenir eligibility rules (A5).
 * Stored per-event in `events.souvenir_rules` (JSON).
 *
 * Standard mode (`usePointSystem` not true):
 * - `minVisitedBooth`: minimum distinct booth visits.
 * - `minTransaction`: minimum total transaction amount across the event
 *   (transactions must carry `visitor_id`, set via the POS visitor scan).
 * - `joinedSeminar`: visitor must have a non-cancelled workshop booking.
 * - `requireAll` (default true): ALL configured rules must pass; set `false`
 *   for ANY (at least one) rule to pass.
 *
 * Point mode (`usePointSystem` true): visitors earn points per enabled
 * activity and the souvenir type is decided by organizer-defined `tiers`.
 */
export type SouvenirTier = {
  id: string;
  name: string;
  minPoints: number;
  description?: string;
};

export type SouvenirRules = {
  usePointSystem?: boolean;

  // Standard mode
  minVisitedBooth?: number;
  minTransaction?: number;
  joinedSeminar?: boolean;
  requireAll?: boolean;

  // Point mode
  boothVisitPoint?: { enabled: boolean; pointsPerVisit: number };
  seminarPoint?: { enabled: boolean; pointsPerSeminar: number };
  transactionPoint?: {
    enabled: boolean;
    pointsPerTransaction?: number;
    amountStep?: number;
    pointsPerAmountStep?: number;
  };
  tiers?: SouvenirTier[];
};

export type PointBreakdown = {
  booth: { enabled: boolean; count: number; points: number };
  seminar: { enabled: boolean; count: number; points: number };
  transaction: {
    enabled: boolean;
    count: number;
    totalAmount: number;
    points: number;
  };
};

export type SouvenirEligibility = {
  usePointSystem: boolean;
  eligible: boolean;
  reasons: string[];
  /** Total points earned from activities. */
  totalPoints: number;
  /** Points already spent on redeemed souvenirs. */
  spentPoints: number;
  /** Remaining balance = totalPoints - spentPoints (used to unlock tiers). */
  availablePoints: number;
  pointBreakdown: PointBreakdown;
  tiers: (SouvenirTier & { unlocked: boolean; missingPoints: number })[];
  eligibleTiers: SouvenirTier[];
  recommendedTier: SouvenirTier | null;
  data: {
    boothVisits: number;
    seminarCount: number;
    joinedSeminar: boolean;
    transactionCount: number;
    transactionTotal: number;
  };
};

export async function evaluateSouvenirEligibility(
  prisma: PrismaService,
  event: { uuid: string; souvenir_rules: unknown },
  userId: string,
): Promise<SouvenirEligibility> {
  const rules = (event.souvenir_rules ?? {}) as SouvenirRules;
  const usePointSystem = rules.usePointSystem === true;
  const reasons: string[] = [];

  const emptyBreakdown: PointBreakdown = {
    booth: { enabled: false, count: 0, points: 0 },
    seminar: { enabled: false, count: 0, points: 0 },
    transaction: { enabled: false, count: 0, totalAmount: 0, points: 0 },
  };

  // ---------- Point system mode ----------
  if (usePointSystem) {
    const boothCfg = rules.boothVisitPoint;
    const seminarCfg = rules.seminarPoint;
    const txCfg = rules.transactionPoint;

    const boothEnabled = boothCfg?.enabled === true;
    const seminarEnabled = seminarCfg?.enabled === true;
    const txEnabled = txCfg?.enabled === true;

    const [boothVisits, seminarCount, txAgg] = await Promise.all([
      boothEnabled
        ? prisma.booth_visits.count({
            where: { user_id: userId, event_id: event.uuid },
          })
        : Promise.resolve(0),
      seminarEnabled
        ? prisma.workshop_bookings.count({
            where: {
              user_id: userId,
              status: { not: `CANCELLED` },
              workshop: { event_id: event.uuid },
            },
          })
        : Promise.resolve(0),
      txEnabled
        ? prisma.tenant_transactions.aggregate({
            where: { event_id: event.uuid, visitor_id: userId },
            _sum: { amount: true },
            _count: { _all: true },
          })
        : Promise.resolve(null),
    ]);

    const transactionCount = txAgg?._count._all ?? 0;
    const transactionTotal = txAgg?._sum.amount ?? 0;

    const boothPoints = boothEnabled
      ? boothVisits * (boothCfg?.pointsPerVisit ?? 0)
      : 0;
    const seminarPoints = seminarEnabled
      ? seminarCount * (seminarCfg?.pointsPerSeminar ?? 0)
      : 0;
    const amountStep = txCfg?.amountStep ?? 0;
    const txPoints = txEnabled
      ? transactionCount * (txCfg?.pointsPerTransaction ?? 0) +
        (amountStep > 0
          ? Math.floor(transactionTotal / amountStep) *
            (txCfg?.pointsPerAmountStep ?? 0)
          : 0)
      : 0;

    const totalPoints = boothPoints + seminarPoints + txPoints;

    // Points already redeemed for souvenirs are deducted from the balance.
    const spentAgg = await prisma.souvenirs.aggregate({
      where: { event_id: event.uuid, user_id: userId },
      _sum: { points_spent: true },
    });
    const spentPoints = spentAgg._sum.points_spent ?? 0;
    const availablePoints = Math.max(0, totalPoints - spentPoints);

    const sortedTiers = [...(rules.tiers ?? [])].sort(
      (a, b) => a.minPoints - b.minPoints,
    );
    const tiers = sortedTiers.map((t) => ({
      ...t,
      unlocked: availablePoints >= t.minPoints,
      missingPoints: Math.max(0, t.minPoints - availablePoints),
    }));
    const eligibleTiers = sortedTiers.filter(
      (t) => availablePoints >= t.minPoints,
    );
    const recommendedTier =
      eligibleTiers.length > 0 ? eligibleTiers[eligibleTiers.length - 1] : null;

    if (sortedTiers.length === 0) {
      reasons.push(`Jenis souvenir belum diatur oleh organizer`);
    } else if (!recommendedTier) {
      reasons.push(
        `Poin kurang: sisa ${availablePoints} poin, minimal penukaran ${sortedTiers[0].minPoints} poin (${sortedTiers[0].name})`,
      );
    }

    return {
      usePointSystem,
      eligible: recommendedTier !== null,
      reasons,
      totalPoints,
      spentPoints,
      availablePoints,
      pointBreakdown: {
        booth: { enabled: boothEnabled, count: boothVisits, points: boothPoints },
        seminar: {
          enabled: seminarEnabled,
          count: seminarCount,
          points: seminarPoints,
        },
        transaction: {
          enabled: txEnabled,
          count: transactionCount,
          totalAmount: transactionTotal,
          points: txPoints,
        },
      },
      tiers,
      eligibleTiers,
      recommendedTier,
      data: {
        boothVisits,
        seminarCount,
        joinedSeminar: seminarCount > 0,
        transactionCount,
        transactionTotal,
      },
    };
  }

  // ---------- Standard mode (unchanged behaviour) ----------
  const checks: boolean[] = [];
  let boothVisits = 0;

  // Only enforced when explicitly configured (full opt-out supported).
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
    usePointSystem,
    eligible,
    reasons,
    totalPoints: 0,
    spentPoints: 0,
    availablePoints: 0,
    pointBreakdown: emptyBreakdown,
    tiers: [],
    eligibleTiers: [],
    recommendedTier: null,
    data: {
      boothVisits,
      seminarCount: 0,
      joinedSeminar,
      transactionCount: 0,
      transactionTotal,
    },
  };
}
