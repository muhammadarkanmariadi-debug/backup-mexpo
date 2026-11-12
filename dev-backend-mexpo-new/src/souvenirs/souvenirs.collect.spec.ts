import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { SouvenirsService } from './souvenirs.service';

const CODE = 'SV-7K2M9QX4HB';
const ROW = {
  id: 5,
  event_id: 'event-1',
  user_id: 'visitor-1',
  tier_id: 'tier-1',
  code: CODE,
  souvenir_name: 'Totebag',
  points_spent: 40,
  collected_at: null as Date | null,
  created_at: new Date('2026-11-12T01:00:00Z'),
  users: {
    uuid: 'visitor-1',
    full_name: 'Budi',
    email: 'budi@x.id',
    photo: '',
  },
};

function build(opts: {
  row?: typeof ROW | null;
  manager?: boolean;
  updateCount?: number;
}) {
  const updateMany = jest
    .fn()
    .mockResolvedValue({ count: opts.updateCount ?? 1 });
  const prisma = {
    events: {
      findFirst: jest.fn().mockResolvedValue({
        uuid: 'event-1',
        name: 'Expo',
        features: {},
        souvenir_rules: {
          tiers: [{ id: 'tier-1', name: 'Totebag', image: 'http://img/t.png' }],
        },
      }),
    },
    user_event_roles: {
      findFirst: jest
        .fn()
        .mockResolvedValue(opts.manager === false ? null : { uuid: 'r' }),
    },
    souvenirs: {
      findFirst: jest.fn().mockResolvedValue(opts.row ?? null),
      updateMany,
    },
  };
  const service = new SouvenirsService(
    prisma as unknown as PrismaService,
    {} as S3Service,
    {} as ConfigService,
  );
  return { service, prisma, updateMany };
}

describe('SouvenirsService.resolveVoucher', () => {
  it('shows who redeemed what and whether it was handed over', async () => {
    const { service } = build({ row: ROW });
    const res = await service.resolveVoucher(
      'event-1',
      { code: ' sv-7k2m9qx4hb ' },
      'owner-1',
    );
    expect(res.data).toMatchObject({
      id: 5,
      status: 'READY',
      item: { name: 'Totebag', image: 'http://img/t.png', points: 40 },
      user: { full_name: 'Budi' },
    });
  });

  it('reports a collected voucher as COLLECTED', async () => {
    const { service } = build({ row: { ...ROW, collected_at: new Date() } });
    const res = await service.resolveVoucher(
      'event-1',
      { code: CODE },
      'owner-1',
    );
    expect(res.data.status).toBe('COLLECTED');
  });

  it('is for event managers only', async () => {
    const { service } = build({ row: ROW, manager: false });
    await expect(
      service.resolveVoucher('event-1', { code: CODE }, 'visitor-2'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a malformed code and an unknown code', async () => {
    await expect(
      build({ row: ROW }).service.resolveVoucher(
        'event-1',
        { code: 'nope' },
        'owner-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      build({ row: null }).service.resolveVoucher(
        'event-1',
        { code: CODE },
        'owner-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('SouvenirsService.collect', () => {
  it('hands the item over and records who did it', async () => {
    const { service, updateMany } = build({ row: ROW });
    const res = await service.collect('event-1', { code: CODE }, 'owner-1');
    expect(res.data).toEqual({ id: 5, status: 'COLLECTED' });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 5, collected_at: null },
      data: expect.objectContaining({ collected_by: 'owner-1' }) as unknown,
    });
  });

  it('hands over only once: a second scan is a conflict', async () => {
    const { service } = build({ row: ROW, updateCount: 0 });
    await expect(
      service.collect('event-1', { code: CODE }, 'owner-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('is refused for a visitor, even with their own code', async () => {
    const { service, updateMany } = build({ row: ROW, manager: false });
    await expect(
      service.collect('event-1', { code: CODE }, 'visitor-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
