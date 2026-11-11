import type { Prisma } from '@prisma/client';
import type { SouvenirRules } from './souvenir-rules';

/** Works with the PrismaService and with an interactive-transaction client. */
export type Db = Prisma.TransactionClient;

export type LedgerType = 'EARN' | 'SPEND';
export type LedgerSource = 'BOOTH' | 'SEMINAR' | 'TRANSACTION' | 'REDEEM';

/** One line of a visitor's point history. `points` is always positive. */
export type LedgerEntry = {
  id: string;
  type: LedgerType;
  source: LedgerSource;
  label: string;
  points: number;
  at: Date;
};

/** Raw activity a visitor's points are derived from. */
export type PointActivity = {
  booths: { id: string; tenantName: string; at: Date }[];
  seminars: { id: string; title: string; at: Date }[];
  transactions: {
    id: string;
    tenantName: string;
    amount: number;
    at: Date;
  }[];
  redemptions: { id: string; name: string; pointsSpent: number; at: Date }[];
};

export type PointLedger = {
  /** Newest first. */
  entries: LedgerEntry[];
  earned: number;
  spent: number;
  /** earned - spent, never below zero. */
  available: number;
  breakdown: {
    booth: { enabled: boolean; count: number; points: number };
    seminar: { enabled: boolean; count: number; points: number };
    transaction: {
      enabled: boolean;
      count: number;
      totalAmount: number;
      points: number;
    };
  };
};

/**
 * Points for ONE transaction: a flat amount plus a bonus per `amountStep`
 * spent. Computed per transaction (not on the event total) so the history
 * lines add up exactly to the balance.
 */
export function transactionPoints(
  cfg: NonNullable<SouvenirRules['transactionPoint']>,
  amount: number,
): number {
  const flat = cfg.pointsPerTransaction ?? 0;
  const step = cfg.amountStep ?? 0;
  const perStep = cfg.pointsPerAmountStep ?? 0;
  const bonus = step > 0 ? Math.floor(amount / step) * perStep : 0;
  return flat + bonus;
}

/**
 * Builds the point ledger (history + balance) from a visitor's activity.
 * The balance is the sum of the history, so the two can never disagree.
 */
export function buildPointLedger(
  rules: SouvenirRules,
  activity: PointActivity,
): PointLedger {
  const boothCfg = rules.boothVisitPoint;
  const seminarCfg = rules.seminarPoint;
  const txCfg = rules.transactionPoint;
  const boothOn = boothCfg?.enabled === true;
  const seminarOn = seminarCfg?.enabled === true;
  const txOn = txCfg?.enabled === true;

  const entries: LedgerEntry[] = [];
  const breakdown: PointLedger['breakdown'] = {
    booth: { enabled: boothOn, count: 0, points: 0 },
    seminar: { enabled: seminarOn, count: 0, points: 0 },
    transaction: { enabled: txOn, count: 0, totalAmount: 0, points: 0 },
  };

  if (boothOn) {
    const per = boothCfg?.pointsPerVisit ?? 0;
    for (const b of activity.booths) {
      breakdown.booth.count += 1;
      breakdown.booth.points += per;
      if (per > 0) {
        entries.push({
          id: `booth:${b.id}`,
          type: 'EARN',
          source: 'BOOTH',
          label: `Kunjungan booth ${b.tenantName || ''}`.trim(),
          points: per,
          at: b.at,
        });
      }
    }
  }

  if (seminarOn) {
    const per = seminarCfg?.pointsPerSeminar ?? 0;
    for (const s of activity.seminars) {
      breakdown.seminar.count += 1;
      breakdown.seminar.points += per;
      if (per > 0) {
        entries.push({
          id: `seminar:${s.id}`,
          type: 'EARN',
          source: 'SEMINAR',
          label: `Lokakarya ${s.title || ''}`.trim(),
          points: per,
          at: s.at,
        });
      }
    }
  }

  if (txOn && txCfg) {
    for (const t of activity.transactions) {
      const pts = transactionPoints(txCfg, t.amount);
      breakdown.transaction.count += 1;
      breakdown.transaction.totalAmount += t.amount;
      breakdown.transaction.points += pts;
      if (pts > 0) {
        entries.push({
          id: `transaction:${t.id}`,
          type: 'EARN',
          source: 'TRANSACTION',
          label: `Transaksi di ${t.tenantName || 'booth'}`,
          points: pts,
          at: t.at,
        });
      }
    }
  }

  let spent = 0;
  for (const r of activity.redemptions) {
    spent += r.pointsSpent;
    entries.push({
      id: `redeem:${r.id}`,
      type: 'SPEND',
      source: 'REDEEM',
      label: `Tukar ${r.name || 'souvenir'}`,
      points: r.pointsSpent,
      at: r.at,
    });
  }

  const earned =
    breakdown.booth.points +
    breakdown.seminar.points +
    breakdown.transaction.points;
  entries.sort((a, b) => b.at.getTime() - a.at.getTime());

  return {
    entries,
    earned,
    spent,
    available: Math.max(0, earned - spent),
    breakdown,
  };
}

/** Loads the activity behind a visitor's points (only enabled sources). */
export async function loadPointActivity(
  db: Db,
  eventId: string,
  userId: string,
  rules: SouvenirRules,
): Promise<PointActivity> {
  const loadBooths = async (): Promise<PointActivity['booths']> => {
    if (rules.boothVisitPoint?.enabled !== true) return [];
    const rows = await db.booth_visits.findMany({
      where: { user_id: userId, event_id: eventId },
      select: {
        uuid: true,
        created_at: true,
        tenant: { select: { name: true } },
      },
    });
    return rows.map((b) => ({
      id: b.uuid,
      tenantName: b.tenant?.name ?? ``,
      at: b.created_at,
    }));
  };

  const loadSeminars = async (): Promise<PointActivity['seminars']> => {
    if (rules.seminarPoint?.enabled !== true) return [];
    const rows = await db.workshop_bookings.findMany({
      where: {
        user_id: userId,
        status: { not: `CANCELLED` },
        workshop: { event_id: eventId },
      },
      select: {
        uuid: true,
        created_at: true,
        workshop: { select: { title: true } },
      },
    });
    return rows.map((s) => ({
      id: s.uuid,
      title: s.workshop?.title ?? ``,
      at: s.created_at,
    }));
  };

  const loadTransactions = async (): Promise<PointActivity['transactions']> => {
    if (rules.transactionPoint?.enabled !== true) return [];
    const rows = await db.tenant_transactions.findMany({
      where: { event_id: eventId, visitor_id: userId },
      select: {
        uuid: true,
        amount: true,
        transaction_date: true,
        tenant: { select: { name: true } },
      },
    });
    return rows.map((t) => ({
      id: t.uuid,
      tenantName: t.tenant?.name ?? ``,
      amount: t.amount,
      at: t.transaction_date,
    }));
  };

  const loadRedemptions = async (): Promise<PointActivity['redemptions']> => {
    const rows = await db.souvenirs.findMany({
      where: { event_id: eventId, user_id: userId },
      select: {
        id: true,
        souvenir_name: true,
        points_spent: true,
        created_at: true,
      },
    });
    return rows.map((r) => ({
      id: String(r.id),
      name: r.souvenir_name,
      pointsSpent: r.points_spent,
      at: r.created_at,
    }));
  };

  const [booths, seminars, transactions, redemptions] = await Promise.all([
    loadBooths(),
    loadSeminars(),
    loadTransactions(),
    loadRedemptions(),
  ]);
  return { booths, seminars, transactions, redemptions };
}
