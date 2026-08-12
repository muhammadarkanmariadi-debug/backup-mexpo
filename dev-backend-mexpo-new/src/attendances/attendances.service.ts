import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateAttendanceDto,
  CreateBoothAttendance,
  CreateWorkshopAttendance,
} from './dto/create-attendance.dto';
import { PrismaService } from '../prisma/prisma.service';
import { EventRole } from '@prisma/client';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { buildOrderBy } from '../helper/sort';
import { Prisma } from '@prisma/client';

const ATTENDANCE_SORTABLE: Record<
  string,
  (dir: 'asc' | 'desc') => Prisma.log_attendancesOrderByWithRelationInput
> = {
  created_at: (d) => ({ created_at: d }),
  full_name: (d) => ({ user: { full_name: d } }),
};

@Injectable()
export class AttendancesService {
  constructor(private readonly prisma: PrismaService) {}
  async create(
    event_id: string,
    createAttendanceDto: CreateAttendanceDto,
    userId: string,
  ) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) throw new NotFoundException(`Event doesn't exists`);

      const findEventRole = await this.prisma.user_event_roles.findFirst({
        where: {
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
          status: `APPROVED`,
          event_id,
        },
      });
      if (!findEventRole) {
        throw new ForbiddenException(`You are not allow record attendance`);
      }

      const { user_id } = createAttendanceDto;
      const findUserEventRole = await this.prisma.user_event_roles.findFirst({
        where: { user_id, event_id },
      });
      if (!findUserEventRole)
        throw new NotFoundException(
          `Sorry, you are not registered for this event`,
        );

      const notAllowedRoles: EventRole[] = [`COMMITTEE`, `OWNER`, `TENANT`];
      if (notAllowedRoles.includes(findUserEventRole.role))
        throw new ConflictException(
          `Sorry, you are registered for ${findUserEventRole.role} at this event`,
        );

      const findExistingVisit = await this.prisma.log_attendances.findFirst({
        where: { user_id, event_id },
        orderBy: { created_at: `desc` },
      });

      if (findExistingVisit) {
        const currentDate = new Date();
        const existingAttendance = findExistingVisit.created_at;
        if (
          currentDate.getDate() === existingAttendance.getDate() &&
          currentDate.getMonth() === existingAttendance.getMonth() &&
          currentDate.getFullYear() === existingAttendance.getFullYear()
        ) {
          const findVisitingHistory = await this.prisma.booth_visits.findMany({
            where: { user_id },
          });
          const countVisit = findVisitingHistory.filter((it) => {
            const { created_at } = it;
            return (
              currentDate.getDate() === created_at.getDate() &&
              currentDate.getMonth() === created_at.getMonth() &&
              currentDate.getFullYear() === created_at.getFullYear()
            );
          }).length;
          return {
            success: true,
            message: `Your attendaces in this day already saved. You have visited ${countVisit} booths today`,
            data: findExistingVisit,
          };
        }
      }
      const newAttendace = await this.prisma.log_attendances.create({
        data: { user_id, event_id },
      });
      return {
        success: true,
        message: `New attendance has been recorded`,
        data: newAttendace,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async createWorkshopAttendance(
    workshop_id: string,
    createWorkshopAttendance: CreateWorkshopAttendance,
    userId: string,
  ) {
    try {
      const findWorkshop = await this.prisma.workshops.findFirst({
        where: { uuid: workshop_id },
        include: { workshopBookings: true },
      });
      if (!findWorkshop) throw new NotFoundException(`Workshop doesn't exists`);
      const { user_id } = createWorkshopAttendance;
      const findBookingWorkshop = await this.prisma.workshop_bookings.findFirst(
        {
          where: { workshop_id, user_id },
        },
      );
      if (!findBookingWorkshop) {
        if (
          findWorkshop.quota > 0 &&
          findWorkshop.quota <= findWorkshop.workshopBookings.length
        ) {
          throw new ConflictException(
            `Limit of attendee for this workshop has reached`,
          );
        }
        const newBookingWorkshop = await this.prisma.workshop_bookings.create({
          data: {
            user_id,
            created_by: userId,
            updated_by: userId,
            workshop_id,
            status: `CHECKED_IN`,
          },
        });

        return {
          success: true,
          message: `Your registration for this workshop has saved successfully`,
          data: newBookingWorkshop,
        };
      }
      const updateStatusBooking = await this.prisma.workshop_bookings.update({
        where: { uuid: findBookingWorkshop.uuid },
        data: {
          status: `CHECKED_IN`,
          checkin_at: new Date(),
          updated_by: userId,
        },
      });
      return {
        success: true,
        message: `Log attendance for this workshop has saved`,
        data: updateStatusBooking,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async createBoothAttendance(
    tenant_id: string,
    createBoothAttendance: CreateBoothAttendance,
    userId: string,
  ) {
    try {
      const findTenant = await this.prisma.tenants.findFirst({
        where: { uuid: tenant_id },
      });
      if (!findTenant) throw new NotFoundException(`Tenant doesn't exists`);
      const findTenantMember = await this.prisma.tenant_members.findFirst({
        where: { user_id: userId, tenant_id, status: `APPROVED` },
      });
      if (!findTenantMember) {
        throw new ForbiddenException(`You are not allow record attendance`);
      }
      const { user_id } = createBoothAttendance;
      const findExistingVisit = await this.prisma.booth_visits.findFirst({
        where: { user_id, tenant_id },
        orderBy: { created_at: `desc` },
      });

      const currentDate = new Date();
      const findVisitingHistory = await this.prisma.booth_visits.findMany({
        where: { user_id },
      });
      const countVisit = findVisitingHistory.filter((it) => {
        const { created_at } = it;
        return (
          currentDate.getDate() === created_at.getDate() &&
          currentDate.getMonth() === created_at.getMonth() &&
          currentDate.getFullYear() === created_at.getFullYear()
        );
      }).length;

      if (findExistingVisit) {
        const existingAttendance = findExistingVisit.created_at;
        if (
          currentDate.getDate() === existingAttendance.getDate() &&
          currentDate.getMonth() === existingAttendance.getMonth() &&
          currentDate.getFullYear() === existingAttendance.getFullYear()
        ) {
          return {
            success: true,
            message: `Your attendaces in this day already saved. You have visited ${countVisit} booth today`,
            data: findExistingVisit,
          };
        }
      }
      const newAttendace = await this.prisma.booth_visits.create({
        data: {
          user_id,
          tenant_id,
          event_id: findTenant.event_id,
          created_by: userId,
          updated_by: userId,
        },
      });
      return {
        success: true,
        message: `New attendance has been recorded. You have visited ${countVisit + 1} booth today`,
        data: newAttendace,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async findAllEventAttendances(event_id: string, query: QueryAttendanceDto) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) throw new NotFoundException(`Event doesn't exists`);

      const { page, quantity, search, start_date, end_date } = query;
      const take = quantity ?? undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const counts = await this.prisma.log_attendances.count({
        where: {
          event_id,
          created_at:
            start_date && end_date
              ? {
                  gte: start_date,
                  lte: new Date(end_date.getTime() + 24 * 60 * 60 * 1000),
                }
              : undefined,
          OR: [{ user: { full_name: { contains: search || '' } } }],
        },
      });

      const attendances = await this.prisma.log_attendances.findMany({
        take,
        skip,
        orderBy: buildOrderBy(
          query.sort_by,
          query.sort_dir,
          ATTENDANCE_SORTABLE,
          { created_at: `desc` },
        ) as Prisma.log_attendancesOrderByWithRelationInput,
        where: {
          event_id,
          created_at:
            start_date && end_date
              ? {
                  gte: start_date,
                  lte: new Date(end_date.getTime() + 24 * 60 * 60 * 1000),
                }
              : undefined,
          OR: [{ user: { full_name: { contains: search || '' } } }],
        },
        include: {
          user: true,
        },
      });

      return {
        success: true,
        message: `Attandeances has retrieved`,
        data: attendances,
        meta: { page, quantity, counts },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async findAllWorkshopAttendances(
    workshop_id: string,
    query: QueryAttendanceDto,
  ) {
    try {
      const findWorkshop = await this.prisma.workshops.findFirst({
        where: { uuid: workshop_id },
      });
      if (!findWorkshop) throw new NotFoundException(`Workshop doesn't exists`);

      const { page, quantity, search, start_date, end_date } = query;
      const take = quantity ?? undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const counts = await this.prisma.workshop_bookings.count({
        where: {
          workshop_id,
          status: `CHECKED_IN`,
          created_at:
            start_date && end_date
              ? {
                  gte: start_date,
                  lte: new Date(end_date.getTime() + 24 * 60 * 60 * 1000),
                }
              : undefined,
          OR: [{ user: { full_name: { contains: search || '' } } }],
        },
      });

      const attendances = await this.prisma.workshop_bookings.findMany({
        take,
        skip,
        orderBy: { created_at: `desc` },
        where: {
          workshop_id,
          status: `CHECKED_IN`,
          created_at:
            start_date && end_date
              ? {
                  gte: start_date,
                  lte: new Date(end_date.getTime() + 24 * 60 * 60 * 1000),
                }
              : undefined,
          OR: [{ user: { full_name: { contains: search || '' } } }],
        },
        include: { user: true },
      });

      return {
        success: true,
        message: `Attandeances has retrieved`,
        data: attendances,
        meta: { page, quantity, counts },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async findAllTenantAttendances(tenant_id: string, query: QueryAttendanceDto) {
    try {
      const findTenant = await this.prisma.tenants.findFirst({
        where: { uuid: tenant_id },
      });
      if (!findTenant) throw new NotFoundException(`Tenant doesn't exists`);

      const { page, quantity, search, start_date, end_date } = query;
      const take = quantity ?? undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const counts = await this.prisma.booth_visits.count({
        where: {
          tenant_id,
          created_at:
            start_date && end_date
              ? {
                  gte: start_date,
                  lte: new Date(end_date.getTime() + 24 * 60 * 60 * 1000),
                }
              : undefined,
          OR: [{ user: { full_name: { contains: search || '' } } }],
        },
      });

      const attendances = await this.prisma.booth_visits.findMany({
        take,
        skip,
        orderBy: { created_at: `desc` },
        where: {
          tenant_id,
          created_at:
            start_date && end_date
              ? {
                  gte: start_date,
                  lte: new Date(end_date.getTime() + 24 * 60 * 60 * 1000),
                }
              : undefined,
          OR: [{ user: { full_name: { contains: search || '' } } }],
        },
        include: { user: true },
      });

      return {
        success: true,
        message: `Attandeances has retrieved`,
        data: attendances,
        meta: { page, quantity, counts },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }
}
