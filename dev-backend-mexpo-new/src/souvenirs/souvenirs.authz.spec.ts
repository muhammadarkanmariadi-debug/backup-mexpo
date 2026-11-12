import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { SouvenirsService } from './souvenirs.service';

const ROW = {
  id: 7,
  event_id: 'event-1',
  user_id: 'visitor-1',
  souvenir_name: 'Totebag',
};

function build(opts: { row?: typeof ROW | null; manager?: boolean }) {
  const deleteFn = jest.fn().mockResolvedValue(ROW);
  const prisma = {
    souvenirs: {
      findFirst: jest.fn().mockResolvedValue(opts.row ?? null),
      delete: deleteFn,
    },
    user_event_roles: {
      findFirst: jest
        .fn()
        .mockResolvedValue(opts.manager ? { uuid: 'r' } : null),
    },
  };
  const service = new SouvenirsService(
    prisma as unknown as PrismaService,
    {} as S3Service,
    {} as ConfigService,
  );
  return { service, prisma, deleteFn };
}

describe('SouvenirsService.findOne authorization', () => {
  it('lets the redeemer read their own redemption', async () => {
    const { service } = build({ row: ROW });
    await expect(service.findOne(7, 'visitor-1')).resolves.toMatchObject({
      success: true,
    });
  });

  it('refuses another visitor', async () => {
    const { service } = build({ row: ROW, manager: false });
    await expect(service.findOne(7, 'visitor-2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('lets an event manager read it', async () => {
    const { service } = build({ row: ROW, manager: true });
    await expect(service.findOne(7, 'owner-1')).resolves.toMatchObject({
      success: true,
    });
  });

  it('lets a superadmin read it without an event role', async () => {
    const { service, prisma } = build({ row: ROW, manager: false });
    await expect(
      service.findOne(7, 'admin', 'SUPERADMIN'),
    ).resolves.toBeTruthy();
    expect(prisma.user_event_roles.findFirst).not.toHaveBeenCalled();
  });

  it('answers 404 for an unknown id', async () => {
    const { service } = build({ row: null });
    await expect(service.findOne(99, 'visitor-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('SouvenirsService.remove authorization', () => {
  it('refuses the redeemer deleting their own redemption', async () => {
    const { service, deleteFn } = build({ row: ROW, manager: false });
    await expect(service.remove(7, 'visitor-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(deleteFn).not.toHaveBeenCalled();
  });

  it('refuses another visitor', async () => {
    const { service, deleteFn } = build({ row: ROW, manager: false });
    await expect(service.remove(7, 'visitor-2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(deleteFn).not.toHaveBeenCalled();
  });

  it('lets an event manager cancel it', async () => {
    const { service, deleteFn } = build({ row: ROW, manager: true });
    await expect(service.remove(7, 'owner-1')).resolves.toMatchObject({
      success: true,
    });
    expect(deleteFn).toHaveBeenCalledWith({ where: { id: 7 } });
  });

  it('lets a superadmin cancel it', async () => {
    const { service, deleteFn } = build({ row: ROW });
    await service.remove(7, 'admin', 'SUPERADMIN');
    expect(deleteFn).toHaveBeenCalled();
  });

  it('answers 404 for an unknown id', async () => {
    const { service } = build({ row: null });
    await expect(service.remove(99, 'owner-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
