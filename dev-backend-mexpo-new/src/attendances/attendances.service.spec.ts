import { Test, TestingModule } from '@nestjs/testing';
import { AttendancesService } from './attendances.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('AttendancesService - Scanner Permission Protection', () => {
  let service: AttendancesService;
  let prisma: {
    events: { findFirst: jest.Mock };
    workshops: { findFirst: jest.Mock };
    user_event_roles: { findFirst: jest.Mock };
    log_attendances: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
    workshop_bookings: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock; count: jest.Mock };
    booth_visits: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      events: { findFirst: jest.fn() },
      workshops: { findFirst: jest.fn() },
      user_event_roles: { findFirst: jest.fn() },
      log_attendances: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
      workshop_bookings: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn().mockResolvedValue(0) },
      booth_visits: { findMany: jest.fn() },
      // Interactive transactions run the callback against the same mock client.
      $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendancesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AttendancesService>(AttendancesService);
  });

  describe('Event Check-in (create)', () => {
    it('throws ForbiddenException if user is not organizer or committee', async () => {
      prisma.events.findFirst.mockResolvedValue({ uuid: 'ev-1', slug: 'ev-slug' });
      prisma.user_event_roles.findFirst.mockResolvedValue(null);

      await expect(
        service.create('ev-1', { user_id: 'visitor-1' }, 'unauthorized-user', 'USER'),
      ).rejects.toThrow(new ForbiddenException('You are not allowed to record attendance'));
    });

    it('allows approved committee or owner to record check-in', async () => {
      prisma.events.findFirst.mockResolvedValue({ uuid: 'ev-1', slug: 'ev-slug' });
      // First call for scanner role, second for attendee role
      prisma.user_event_roles.findFirst
        .mockResolvedValueOnce({ role: 'COMMITTEE', status: 'APPROVED' })
        .mockResolvedValueOnce({ role: 'PARTICIPANT', status: 'APPROVED' });
      prisma.log_attendances.findFirst.mockResolvedValue(null);
      prisma.log_attendances.create.mockResolvedValue({ uuid: 'log-1' });

      const res = await service.create('ev-1', { user_id: 'visitor-1' }, 'committee-user', 'USER');
      expect(res.success).toBe(true);
    });

    it('allows superadmin to record check-in without event role', async () => {
      prisma.events.findFirst.mockResolvedValue({ uuid: 'ev-1', slug: 'ev-slug' });
      // Scanner bypasses check, attendee role check is called
      prisma.user_event_roles.findFirst.mockResolvedValueOnce({ role: 'PARTICIPANT', status: 'APPROVED' });
      prisma.log_attendances.findFirst.mockResolvedValue(null);
      prisma.log_attendances.create.mockResolvedValue({ uuid: 'log-1' });

      const res = await service.create('ev-1', { user_id: 'visitor-1' }, 'superadmin-user', 'SUPERADMIN');
      expect(res.success).toBe(true);
    });
  });

  describe('Workshop Check-in (createWorkshopAttendance)', () => {
    it('throws ForbiddenException if user is not organizer or committee', async () => {
      prisma.workshops.findFirst.mockResolvedValue({ uuid: 'ws-1', event_id: 'ev-1', quota: 50, workshopBookings: [] });
      prisma.user_event_roles.findFirst.mockResolvedValue(null);

      await expect(
        service.createWorkshopAttendance('ws-1', { user_id: 'visitor-1' }, 'random-user', 'USER'),
      ).rejects.toThrow(new ForbiddenException('You are not allowed to record attendance'));
    });

    it('allows committee to scan workshop check-in', async () => {
      prisma.workshops.findFirst.mockResolvedValue({ uuid: 'ws-1', event_id: 'ev-1', quota: 50, workshopBookings: [] });
      prisma.user_event_roles.findFirst.mockResolvedValue({ role: 'COMMITTEE', status: 'APPROVED' });
      prisma.workshop_bookings.findFirst.mockResolvedValue({ uuid: 'wb-1', status: 'BOOKED' });
      prisma.workshop_bookings.update.mockResolvedValue({ uuid: 'wb-1', status: 'CHECKED_IN' });

      const res = await service.createWorkshopAttendance('ws-1', { user_id: 'visitor-1' }, 'committee-user', 'USER');
      expect(res.success).toBe(true);
    });
  });

  describe('Event Check-out (checkout)', () => {
    it('throws ForbiddenException if scanner is not organizer or committee', async () => {
      prisma.events.findFirst.mockResolvedValue({ uuid: 'ev-1', slug: 'ev-slug' });
      prisma.user_event_roles.findFirst.mockResolvedValue(null);

      await expect(
        service.checkout('ev-1', { user_id: 'visitor-1' }, 'unauthorized-user', 'USER'),
      ).rejects.toThrow(new ForbiddenException('You are not allowed to record attendance'));
    });

    it('allows organizer to check-out attendee', async () => {
      prisma.events.findFirst.mockResolvedValue({ uuid: 'ev-1', slug: 'ev-slug' });
      prisma.user_event_roles.findFirst
        .mockResolvedValueOnce({ role: 'OWNER', status: 'APPROVED' })
        .mockResolvedValueOnce({ role: 'PARTICIPANT', status: 'APPROVED' });
      prisma.log_attendances.findFirst.mockResolvedValue({
        uuid: 'log-1',
        created_at: new Date(),
        checkout_at: null,
      });
      prisma.log_attendances.update.mockResolvedValue({ uuid: 'log-1', checkout_at: new Date() });
      prisma.booth_visits.findMany.mockResolvedValue([]);

      const res = await service.checkout('ev-1', { user_id: 'visitor-1' }, 'organizer-user', 'USER');
      expect(res.success).toBe(true);
    });
  });

  describe('Workshop Check-out (checkoutWorkshop)', () => {
    it('throws ForbiddenException if scanner is not organizer or committee', async () => {
      prisma.workshops.findFirst.mockResolvedValue({ uuid: 'ws-1', event_id: 'ev-1', workshopBookings: [] });
      prisma.user_event_roles.findFirst.mockResolvedValue(null);

      await expect(
        service.checkoutWorkshop('ws-1', { user_id: 'visitor-1' }, 'unauthorized-user', 'USER'),
      ).rejects.toThrow(new ForbiddenException('You are not allowed to record attendance'));
    });

    it('allows committee to check-out attendee from workshop', async () => {
      prisma.workshops.findFirst.mockResolvedValue({ uuid: 'ws-1', event_id: 'ev-1', workshopBookings: [] });
      prisma.user_event_roles.findFirst.mockResolvedValue({ role: 'COMMITTEE', status: 'APPROVED' });
      prisma.workshop_bookings.findFirst.mockResolvedValue({
        uuid: 'wb-1',
        checkin_at: new Date(),
        status: 'CHECKED_IN',
      });
      prisma.workshop_bookings.update.mockResolvedValue({ uuid: 'wb-1', status: 'CHECKED_OUT' });

      const res = await service.checkoutWorkshop('ws-1', { user_id: 'visitor-1' }, 'committee-user', 'USER');
      expect(res.success).toBe(true);
    });
  });
});
