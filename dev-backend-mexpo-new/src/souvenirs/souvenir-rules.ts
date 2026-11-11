import {
  buildPointLedger,
  loadPointActivity,
  type Db,
  type LedgerEntry,
} from './point-ledger';

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
/** A souvenir catalog item; redeeming it costs `minPoints`. */
export type SouvenirTier = {
  id: string;
  name: string;
  minPoints: number;
  description?: string;
  image?: string;
  /** Units available; absent/null = unlimited. */
  stock?: number | null;
};

/** Catalog item with live availability (stock minus redemptions). */
export type SouvenirCatalogItem = SouvenirTier & {
  redeemed: number;
  /** null = unlimited. */
  remaining: number | null;
  soldOut: boolean;
};

/**
 * The event's souvenir catalog sorted by point cost, with remaining stock.
 * Redemptions are counted per item through `souvenirs.tier_id`.
 */
export async function getSouvenirCatalog(
  prisma: Db,
  event: { uuid: string; souvenir_rules: unknown },
): Promise<SouvenirCatalogItem[]> {
  const rules = (event.souvenir_rules ?? {}) as SouvenirRules;
  const items = [...(rules.tiers ?? [])].sort(
    (a, b) => a.minPoints - b.minPoints,
  );
  if (items.length === 0) return [];

  const counts = new Map<string, number>();
  if (items.some((t) => t.stock != null)) {
    const grouped = await prisma.souvenirs.groupBy({
      by: [`tier_id`],
      where: { event_id: event.uuid, tier_id: { in: items.map((t) => t.id) } },
      _count: { _all: true },
    });
    for (const g of grouped) {
      if (g.tier_id) counts.set(g.tier_id, g._count._all);
    }
  }

  return items.map((t) => {
    const redeemed = counts.get(t.id) ?? 0;
    const remaining = t.stock == null ? null : Math.max(0, t.stock - redeemed);
    return { ...t, redeemed, remaining, soldOut: remaining === 0 };
  });
}

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
  /** Point history (earnings and redemptions), newest first. */
  ledger: LedgerEntry[];
  tiers: (SouvenirCatalogItem & { unlocked: boolean; missingPoints: number })[];
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
  prisma: Db,
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
    // The balance is derived from the point ledger (history), so the history
    // shown to a visitor always adds up to the balance.
    const ledger = buildPointLedger(
      rules,
      await loadPointActivity(prisma, event.uuid, userId, rules),
    );
    const totalPoints = ledger.earned;
    const spentPoints = ledger.spent;
    const availablePoints = ledger.available;
    const { booth, seminar, transaction } = ledger.breakdown;

    const catalog = await getSouvenirCatalog(prisma, event);
    const tiers = catalog.map((t) => ({
      ...t,
      unlocked: availablePoints >= t.minPoints,
      missingPoints: Math.max(0, t.minPoints - availablePoints),
    }));
    // Redeemable = affordable AND still in stock.
    const eligibleTiers = tiers.filter((t) => t.unlocked && !t.soldOut);
    const recommendedTier =
      eligibleTiers.length > 0 ? eligibleTiers[eligibleTiers.length - 1] : null;

    if (catalog.length === 0) {
      reasons.push(`Katalog souvenir belum diatur oleh organizer`);
    } else if (!recommendedTier) {
      const affordable = tiers.filter((t) => t.unlocked);
      const cheapestInStock = tiers.find((t) => !t.soldOut);
      if (affordable.length > 0) {
        reasons.push(`Stok souvenir yang bisa ditukar sudah habis`);
      } else if (!cheapestInStock) {
        reasons.push(`Semua stok souvenir sudah habis`);
      } else {
        reasons.push(
          `Poin kurang: sisa ${availablePoints} poin, minimal penukaran ${cheapestInStock.minPoints} poin (${cheapestInStock.name})`,
        );
      }
    }

    return {
      usePointSystem,
      eligible: recommendedTier !== null,
      reasons,
      totalPoints,
      spentPoints,
      availablePoints,
      pointBreakdown: ledger.breakdown,
      ledger: ledger.entries,
      tiers,
      eligibleTiers,
      recommendedTier,
      data: {
        boothVisits: booth.count,
        seminarCount: seminar.count,
        joinedSeminar: seminar.count > 0,
        transactionCount: transaction.count,
        transactionTotal: transaction.totalAmount,
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
    ledger: [],
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
