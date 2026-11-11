import {
  buildPointLedger,
  transactionPoints,
  type PointActivity,
} from './point-ledger';
import type { SouvenirRules } from './souvenir-rules';

const at = (day: number) => new Date(Date.UTC(2026, 10, day));

const rules: SouvenirRules = {
  usePointSystem: true,
  boothVisitPoint: { enabled: true, pointsPerVisit: 10 },
  seminarPoint: { enabled: true, pointsPerSeminar: 25 },
  transactionPoint: {
    enabled: true,
    pointsPerTransaction: 5,
    amountStep: 50000,
    pointsPerAmountStep: 10,
  },
};

const activity: PointActivity = {
  booths: [
    { id: 'b1', tenantName: 'Kopi A', at: at(1) },
    { id: 'b2', tenantName: 'Roti B', at: at(2) },
  ],
  seminars: [{ id: 's1', title: 'AI 101', at: at(3) }],
  transactions: [
    { id: 't1', tenantName: 'Kopi A', amount: 120000, at: at(4) },
    { id: 't2', tenantName: 'Roti B', amount: 20000, at: at(5) },
  ],
  redemptions: [],
};

describe('transactionPoints', () => {
  it('adds a flat amount and a bonus per full step', () => {
    const cfg = rules.transactionPoint!;
    expect(transactionPoints(cfg, 120000)).toBe(5 + 2 * 10);
    expect(transactionPoints(cfg, 20000)).toBe(5);
    expect(transactionPoints(cfg, 0)).toBe(5);
  });

  it('ignores the step bonus when the step is 0', () => {
    expect(
      transactionPoints(
        { enabled: true, pointsPerTransaction: 3, amountStep: 0 },
        999999,
      ),
    ).toBe(3);
  });
});

describe('buildPointLedger', () => {
  it('earns points from booths, seminars and transactions', () => {
    const ledger = buildPointLedger(rules, activity);
    // 2 booths * 10 + 1 seminar * 25 + (5 + 20) + 5
    expect(ledger.earned).toBe(20 + 25 + 25 + 5);
    expect(ledger.spent).toBe(0);
    expect(ledger.available).toBe(75);
    expect(ledger.breakdown.booth).toEqual({
      enabled: true,
      count: 2,
      points: 20,
    });
    expect(ledger.breakdown.transaction.totalAmount).toBe(140000);
  });

  it('keeps history and balance consistent', () => {
    const ledger = buildPointLedger(rules, activity);
    const sum = ledger.entries
      .filter((e) => e.type === 'EARN')
      .reduce((n, e) => n + e.points, 0);
    expect(sum).toBe(ledger.earned);
  });

  it('deducts a redemption and lists it in the history', () => {
    const ledger = buildPointLedger(rules, {
      ...activity,
      redemptions: [{ id: '1', name: 'Totebag', pointsSpent: 40, at: at(9) }],
    });
    expect(ledger.spent).toBe(40);
    expect(ledger.available).toBe(35);
    expect(ledger.entries[0]).toMatchObject({
      type: 'SPEND',
      source: 'REDEEM',
      points: 40,
    });
  });

  it('lists the newest entry first', () => {
    const ledger = buildPointLedger(rules, activity);
    const times = ledger.entries.map((e) => e.at.getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it('never reports a negative balance', () => {
    const ledger = buildPointLedger(rules, {
      booths: [],
      seminars: [],
      transactions: [],
      redemptions: [{ id: '1', name: 'X', pointsSpent: 100, at: at(1) }],
    });
    expect(ledger.available).toBe(0);
  });

  it('ignores sources that are disabled', () => {
    const ledger = buildPointLedger(
      { ...rules, boothVisitPoint: { enabled: false, pointsPerVisit: 10 } },
      activity,
    );
    expect(ledger.breakdown.booth).toEqual({
      enabled: false,
      count: 0,
      points: 0,
    });
    expect(ledger.entries.some((e) => e.source === 'BOOTH')).toBe(false);
  });

  it('does not list zero-point earnings', () => {
    const ledger = buildPointLedger(
      { ...rules, seminarPoint: { enabled: true, pointsPerSeminar: 0 } },
      activity,
    );
    expect(ledger.entries.some((e) => e.source === 'SEMINAR')).toBe(false);
  });
});
