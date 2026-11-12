import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AttendancesService } from './attendances.service';
import { attendanceSlotsLeft, hasAttendanceSlot } from './workshop-slots';

type Booking = {
  uuid: string;
  status: string;
  checkin_at: Date | null;
} | null;

type FakePrisma = {
  workshops: { findFirst: jest.Mock };
  user_event_roles: { findFirst: jest.Mock };
  workshop_bookings: {
    findFirst: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  $transaction: jest.Mock;
};

function build(opts: {
  quota: number;
  attended: number;
  booking: Booking;
  member?: boolean;
}) {
  const prisma: FakePrisma = {
    workshops: {
      findFirst: jest.fn().mockResolvedValue({
        uuid: 'ws-1',
        event_id: 'ev-1',
        quota: opts.quota,
      }),
    },
    // 1st call = scanner permission (committee), 2nd = the attendee's event role.
    user_event_roles: {
      findFirst: jest
        .fn()
        .mockImplementation((q: { where: { role?: unknown } }) =>
          q.where.role
            ? Promise.resolve({ role: 'COMMITTEE' })
            : Promise.resolve(
                opts.member === false ? null : { role: 'VISITOR' },
              ),
        ),
    },
    workshop_bookings: {
      findFirst: jest.fn().mockResolvedValue(opts.booking),
      count: jest.fn().mockResolvedValue(opts.attended),
      create: jest
        .fn()
        .mockImplementation((a: { data: object }) =>
          Promise.resolve({ uuid: 'new', ...a.data }),
        ),
      update: jest
        .fn()
        .mockImplementation((a: { data: object }) =>
          Promise.resolve({ uuid: 'wb', ...a.data }),
        ),
    },
    $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(prisma)),
  };
  const service = new AttendancesService(prisma as unknown as PrismaService);
  const checkIn = () =>
    service.createWorkshopAttendance(
      'ws-1',
      { user_id: 'visitor-1' },
      'staff-1',
      'USER',
    );
  return { prisma, checkIn };
}

describe('workshop attendance slots', () => {
  it('counts free slots from attendance, not bookings', () => {
    expect(attendanceSlotsLeft(60, 2)).toBe(58);
    expect(attendanceSlotsLeft(2, 5)).toBe(0);
    expect(attendanceSlotsLeft(0, 99)).toBeNull();
    expect(hasAttendanceSlot(2, 1)).toBe(true);
    expect(hasAttendanceSlot(2, 2)).toBe(false);
    expect(hasAttendanceSlot(0, 999)).toBe(true);
  });
});

describe('AttendancesService.createWorkshopAttendance (slots and auto-booking)', () => {
  it('checks in a registered visitor', async () => {
    const { checkIn, prisma } = build({
      quota: 10,
      attended: 0,
      booking: { uuid: 'wb-1', status: 'REGISTERED', checkin_at: null },
    });
    const res = await checkIn();
    expect(res.data).toMatchObject({
      status: 'CHECKED_IN',
      auto_booked: false,
    });
    expect(prisma.workshop_bookings.create).not.toHaveBeenCalled();
  });

  it('auto-books and checks in a visitor who never registered', async () => {
    const { checkIn, prisma } = build({
      quota: 10,
      attended: 3,
      booking: null,
    });
    const res = await checkIn();
    expect(prisma.workshop_bookings.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: 'CHECKED_IN',
        checkin_at: expect.any(Date) as unknown,
      }) as unknown,
    });
    expect(res.data).toMatchObject({
      auto_booked: true,
      slots: { attended: 4, quota: 10 },
    });
    expect(res.message).toContain('otomatis didaftarkan');
    // The kiosk/check-in UI treats "sudah" / "already saved" as a duplicate scan.
    expect(res.message).not.toMatch(/sudah|already saved/i);
  });

  it("lets a walk-in take a no-show's slot even when registrations are full", async () => {
    // quota 2, both seats booked, nobody has arrived: attended 0 → slots free.
    const { checkIn } = build({ quota: 2, attended: 0, booking: null });
    await expect(checkIn()).resolves.toMatchObject({
      data: { auto_booked: true },
    });
  });

  it('refuses a walk-in once checked-in people fill the quota', async () => {
    const { checkIn, prisma } = build({ quota: 2, attended: 2, booking: null });
    await expect(checkIn()).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.workshop_bookings.create).not.toHaveBeenCalled();
  });

  it('refuses even a registered visitor when the room is full', async () => {
    const { checkIn } = build({
      quota: 2,
      attended: 2,
      booking: { uuid: 'wb-1', status: 'REGISTERED', checkin_at: null },
    });
    await expect(checkIn()).rejects.toThrow(
      'Slot kehadiran workshop penuh (2/2)',
    );
  });

  it('treats a cancelled booking like a walk-in and reuses the row', async () => {
    const { checkIn, prisma } = build({
      quota: 5,
      attended: 1,
      booking: { uuid: 'wb-9', status: 'CANCELLED', checkin_at: null },
    });
    const res = await checkIn();
    expect(res.data).toMatchObject({ auto_booked: true, status: 'CHECKED_IN' });
    expect(prisma.workshop_bookings.update).toHaveBeenCalled();
    expect(prisma.workshop_bookings.create).not.toHaveBeenCalled();
  });

  it('is idempotent for someone already checked in', async () => {
    const { checkIn, prisma } = build({
      quota: 2,
      attended: 2,
      booking: { uuid: 'wb-1', status: 'CHECKED_IN', checkin_at: new Date() },
    });
    const res = await checkIn();
    expect(res.message).toMatch(/sudah check-in/);
    expect(prisma.workshop_bookings.update).not.toHaveBeenCalled();
  });

  it('lets someone who checked out come back without using another slot', async () => {
    const first = new Date('2026-11-12T01:00:00Z');
    const { checkIn, prisma } = build({
      quota: 2,
      attended: 2,
      booking: { uuid: 'wb-1', status: 'CHECKED_OUT', checkin_at: first },
    });
    await checkIn();
    expect(prisma.workshop_bookings.update).toHaveBeenCalledWith({
      where: { uuid: 'wb-1' },
      data: expect.objectContaining({
        status: 'CHECKED_IN',
        checkin_at: first,
        checkout_at: null,
      }) as unknown,
    });
  });

  it('does not limit a workshop with quota 0', async () => {
    const { checkIn } = build({ quota: 0, attended: 500, booking: null });
    await expect(checkIn()).resolves.toMatchObject({
      data: { auto_booked: true },
    });
  });

  it('never books someone who is not in the event', async () => {
    const { checkIn, prisma } = build({
      quota: 10,
      attended: 0,
      booking: null,
      member: false,
    });
    await expect(checkIn()).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.workshop_bookings.create).not.toHaveBeenCalled();
  });

  it('answers 409 when two scanners race for the last slot', async () => {
    const { checkIn, prisma } = build({ quota: 1, attended: 0, booking: null });
    prisma.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('serialization', {
        code: 'P2034',
        clientVersion: 'x',
      }),
    );
    await expect(checkIn()).rejects.toBeInstanceOf(ConflictException);
  });
});
