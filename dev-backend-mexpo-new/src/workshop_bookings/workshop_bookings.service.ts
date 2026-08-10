import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateWorkshopBookingDto } from './dto/update-workshop_booking.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryWorkshopBookingDto } from './dto/query-workshop-booking.dto';
import { UserRole } from '@prisma/client';
import { assertEventFeature } from 'src/events/event-features';

@Injectable()
export class WorkshopBookingsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(workshop_id: string, userId: string) {
    try {
      const findWorkshop = await this.prisma.workshops.findFirst({
        where: {
          uuid: workshop_id,
        },
        include: { workshopBookings: true },
      });

      if (!findWorkshop) {
        throw new NotFoundException(`Workshop doesn't exists`);
      }
      // A2 — seminar feature must be enabled for this event.
      await assertEventFeature(this.prisma, findWorkshop.event_id, 'seminar');

      const findUser = await this.prisma.users.findFirst({
        where: { uuid: userId },
      });
      if (!findUser) {
        throw new NotFoundException(`User doesn't exists`);
      }

      const findEventUserRole = await this.prisma.user_event_roles.findFirst({
        where: { user_id: userId, event_id: findWorkshop.event_id },
      });

      if (!findEventUserRole) {
        throw new ConflictException(`You should join event first`);
      }

      if (
        findEventUserRole &&
        [`OWNER`, `COMMITTEE`].includes(findEventUserRole.role)
      ) {
        throw new ConflictException(
          `You are commitee of this event, so you shouldn't register this workshop`,
        );
      }

      if (
        findWorkshop.quota > 0 &&
        findWorkshop.quota <= findWorkshop.workshopBookings.length
      ) {
        throw new ConflictException(
          `Limit of attendee for this workshop has reached`,
        );
      }
      const findExistingAttendee =
        await this.prisma.workshop_bookings.findFirst({
          where: { workshop_id, user_id: userId },
        });
      if (findExistingAttendee) {
        throw new ConflictException(`You already registered at this workshop`);
      }

      const newBookingWorkshop = await this.prisma.workshop_bookings.create({
        data: {
          user_id: userId,
          created_by: userId,
          updated_by: userId,
          workshop_id,
        },
      });

      return {
        success: true,
        message: `Your registration for this workshop has saved successfully`,
        data: newBookingWorkshop,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async findAll(
    workshop_id: string,
    query: QueryWorkshopBookingDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const findWorkshop = await this.prisma.workshops.findFirst({
        where: {
          uuid: workshop_id,
        },
      });

      if (!findWorkshop) {
        throw new NotFoundException(`Workshop doesn't exists`);
      }

      const findEventUserRole = await this.prisma.user_event_roles.findFirst({
        where: { user_id: userId, event_id: findWorkshop.event_id },
      });

      if (!findEventUserRole && role !== `SUPERADMIN`) {
        throw new ForbiddenException(`You are not allow to fetch data`);
      }

      if (
        findEventUserRole &&
        [`VISITOR`, `TENANT`].includes(findEventUserRole.role)
      ) {
        throw new ForbiddenException(`You are not allow to fetch data`);
      }

      const { page, quantity, search, status } = query;
      const take = quantity || undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const counts = await this.prisma.workshop_bookings.count({
        where: {
          workshop_id,
          status,
          OR: [
            { user: { full_name: { contains: search ?? `` } } },
            { user: { email: { contains: search ?? `` } } },
          ],
        },
      });

      const bookings = await this.prisma.workshop_bookings.findMany({
        take,
        skip,
        orderBy: { user: { full_name: `asc` } },
        where: {
          workshop_id,
          status,
          OR: [
            { user: { full_name: { contains: search ?? `` } } },
            { user: { email: { contains: search ?? `` } } },
          ],
        },
        include: {
          user: true,
          workshop: true,
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
        },
      });

      return {
        success: true,
        message: `Workshop Booking has retrieved`,
        data: bookings,
        meta: { page, quantity, counts },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async findOne(id: string, userId: string, role?: UserRole) {
    try {
      const findWorkshopBooking = await this.prisma.workshop_bookings.findFirst(
        {
          where: { uuid: id },
          include: {
            user: true,
            workshop: true,
            creator: { select: { full_name: true } },
            editor: { select: { full_name: true } },
          },
        },
      );

      if (!findWorkshopBooking) {
        throw new NotFoundException(`Workshop Booking doesn't exists`);
      }

      const findEventUserRole = await this.prisma.user_event_roles.findFirst({
        where: {
          user_id: userId,
          event_id: findWorkshopBooking.workshop.event_id,
        },
      });

      if (!findEventUserRole && role !== `SUPERADMIN`) {
        throw new ForbiddenException(`You are not allow to fetch data`);
      }

      if (
        findEventUserRole &&
        [`VISITOR`, `TENANT`].includes(findEventUserRole.role)
      ) {
        throw new ForbiddenException(`You are not allow to fetch data`);
      }

      return {
        success: true,
        message: `Workshop Booking has retrieved`,
        data: findWorkshopBooking,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  /** A10 — the caller's CHECKED_IN workshop bookings (certificate data). */
  async findMyCertificates(event_id: string, userId: string) {
    try {
      const bookings = await this.prisma.workshop_bookings.findMany({
        where: {
          user_id: userId,
          status: `CHECKED_IN`,
          workshop: { event_id },
        },
        include: { workshop: true },
        orderBy: { checkin_at: `desc` },
      });
      return {
        success: true,
        message: `Certificates retrieved`,
        data: bookings,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  /**
   * Authorization guard for modifying a workshop booking.
   * Allowed: SUPERADMIN, APPROVED OWNER/COMMITTEE of the event, or the
   * user who owns the booking (e.g. a visitor cancelling their own booking).
   */
  private async assertCanManageBooking(
    booking: {
      user_id: string;
      workshop: { event_id: string };
    },
    userId: string,
    role?: UserRole,
  ) {
    if (role === `SUPERADMIN`) return;

    const findEventUserRole = await this.prisma.user_event_roles.findFirst({
      where: { user_id: userId, event_id: booking.workshop.event_id },
    });

    const isManager =
      findEventUserRole &&
      findEventUserRole.status === `APPROVED` &&
      [`OWNER`, `COMMITTEE`].includes(findEventUserRole.role);

    const isBookingOwner = booking.user_id === userId;

    if (!isManager && !isBookingOwner) {
      throw new ForbiddenException(
        `You are not allowed to modify this workshop booking`,
      );
    }
  }

  async update(
    id: string,
    updateWorkshopBookingDto: UpdateWorkshopBookingDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const findWorkshopBooking = await this.prisma.workshop_bookings.findFirst(
        {
          where: { uuid: id },
          include: { workshop: true },
        },
      );

      if (!findWorkshopBooking) {
        throw new NotFoundException(`Workshop Booking doesn't exists`);
      }

      await this.assertCanManageBooking(findWorkshopBooking, userId, role);

      const { status } = updateWorkshopBookingDto;
      const updateWorkshopBooking = await this.prisma.workshop_bookings.update({
        where: { uuid: id },
        data: {
          status: status ?? findWorkshopBooking.status,
          updated_by: userId,
        },
      });

      return {
        success: true,
        message: `Workshop booking has updated`,
        data: updateWorkshopBooking,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async remove(id: string, userId: string, role?: UserRole) {
    try {
      const findWorkshopBooking = await this.prisma.workshop_bookings.findFirst(
        {
          where: { uuid: id },
          include: { workshop: true },
        },
      );

      if (!findWorkshopBooking) {
        throw new NotFoundException(`Workshop Booking doesn't exists`);
      }

      await this.assertCanManageBooking(findWorkshopBooking, userId, role);

      const dropWorkshopBooking = await this.prisma.workshop_bookings.delete({
        where: { uuid: id },
      });

      return {
        success: true,
        message: `Workshop booking has removed`,
        data: dropWorkshopBooking,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }
}
