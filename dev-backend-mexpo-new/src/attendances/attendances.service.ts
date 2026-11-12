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
import {
  UpdateAttendanceDto,
  UpdateWorkshopAttendanceDto,
} from './dto/update-attendance.dto';
import { ATTENDED_STATUSES, hasAttendanceSlot } from './workshop-slots';

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

  private async validateScannerPermission(
    eventId: string,
    userId: string,
    userRole?: string,
  ) {
    if (userRole === 'SUPERADMIN') {
      return;
    }
    const findEventRole = await this.prisma.user_event_roles.findFirst({
      where: {
        user_id: userId,
        role: { in: ['COMMITTEE', 'OWNER'] },
        status: 'APPROVED',
        event_id: eventId,
      },
    });
    if (!findEventRole) {
      throw new ForbiddenException(`You are not allowed to record attendance`);
    }
  }

  async create(
    event_id: string,
    createAttendanceDto: CreateAttendanceDto,
    userId: string,
    userRole?: string,
  ) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: {
          OR: [{ uuid: event_id }, { slug: event_id }],
        },
      });
      if (!findEvent) throw new NotFoundException(`Event doesn't exists`);

      await this.validateScannerPermission(findEvent.uuid, userId, userRole);

      const { user_id } = createAttendanceDto;
      const findUserEventRole = await this.prisma.user_event_roles.findFirst({
        where: { user_id, event_id: findEvent.uuid },
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
        where: { user_id, event_id: findEvent.uuid },
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
        data: { user_id, event_id: findEvent.uuid },
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

  /**
   * Workshop check-in at the door (committee/owner/superadmin scan the visitor).
   *
   * - Registered visitor: checked in.
   * - Not registered (or booking cancelled) and an attendance slot is free:
   *   booked automatically and checked in — this is how a no-show's empty slot
   *   gets used by someone else.
   * - No free slot (checked-in people reached the quota): 409.
   *
   * The slot check and the write run in one Serializable transaction, so two
   * scanners filling the last slot at once cannot exceed the quota.
   */
  async createWorkshopAttendance(
    workshop_id: string,
    createWorkshopAttendance: CreateWorkshopAttendance,
    userId: string,
    userRole?: string,
  ) {
    try {
      const findWorkshop = await this.prisma.workshops.findFirst({
        where: { uuid: workshop_id },
      });
      if (!findWorkshop) throw new NotFoundException(`Workshop doesn't exists`);

      await this.validateScannerPermission(
        findWorkshop.event_id,
        userId,
        userRole,
      );

      const { user_id } = createWorkshopAttendance;
      // The attendee must belong to the event: a scan never books a stranger.
      const findMember = await this.prisma.user_event_roles.findFirst({
        where: { user_id, event_id: findWorkshop.event_id, status: `APPROVED` },
      });
      if (!findMember) {
        throw new ForbiddenException(
          `Peserta belum terdaftar di event ini atau pendaftarannya belum disetujui`,
        );
      }

      return await this.prisma.$transaction(
        async (tx) => {
          const booking = await tx.workshop_bookings.findFirst({
            where: { workshop_id, user_id },
          });

          if (booking?.status === `CHECKED_IN`) {
            return {
              success: true,
              message: `Peserta sudah check-in di workshop ini`,
              data: { ...booking, auto_booked: false },
            };
          }

          const attended = await tx.workshop_bookings.count({
            where: { workshop_id, status: { in: ATTENDED_STATUSES } },
          });
          // Someone who attended before (checked out, now coming back) already
          // holds a slot and must not be counted twice.
          const holdsSlot = booking?.checkin_at != null;
          if (!holdsSlot && !hasAttendanceSlot(findWorkshop.quota, attended)) {
            throw new ConflictException(
              `Slot kehadiran workshop penuh (${attended}/${findWorkshop.quota})`,
            );
          }

          const autoBooked = !booking || booking.status === `CANCELLED`;
          const now = new Date();
          const record = booking
            ? await tx.workshop_bookings.update({
                where: { uuid: booking.uuid },
                data: {
                  status: `CHECKED_IN`,
                  checkin_at: booking.checkin_at ?? now,
                  checkout_at: null,
                  updated_by: userId,
                },
              })
            : await tx.workshop_bookings.create({
                data: {
                  user_id,
                  workshop_id,
                  status: `CHECKED_IN`,
                  checkin_at: now,
                  created_by: userId,
                  updated_by: userId,
                },
              });

          const attendedNow = holdsSlot ? attended : attended + 1;
          const slotInfo =
            findWorkshop.quota > 0
              ? ` (slot kehadiran ${attendedNow}/${findWorkshop.quota})`
              : ``;
          return {
            success: true,
            message: autoBooked
              ? `Peserta belum terdaftar: otomatis didaftarkan dan check-in${slotInfo}`
              : `Log attendance for this workshop has saved`,
            data: {
              ...record,
              auto_booked: autoBooked,
              slots: { attended: attendedNow, quota: findWorkshop.quota },
            },
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      // Two scanners raced for the last slot and this one lost.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === `P2034`
      ) {
        throw new ConflictException(
          `Permintaan bersamaan terdeteksi, silakan scan ulang`,
        );
      }
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

      const dateFilter =
        start_date && end_date
          ? {
              gte: start_date,
              lte: new Date(end_date.getTime() + 24 * 60 * 60 * 1000),
            }
          : undefined;

      const searchFilter: Prisma.log_attendancesWhereInput = search?.trim()
        ? {
            OR: [
              { user: { full_name: { contains: search.trim() } } },
              { user: { email: { contains: search.trim() } } },
              { user: { phone: { contains: search.trim() } } },
            ],
          }
        : {};

      const where: Prisma.log_attendancesWhereInput = {
        event_id,
        created_at: dateFilter,
        ...searchFilter,
      };

      const counts = await this.prisma.log_attendances.count({ where });

      const attendances = await this.prisma.log_attendances.findMany({
        take,
        skip,
        orderBy: buildOrderBy(
          query.sort_by,
          query.sort_dir,
          ATTENDANCE_SORTABLE,
          { created_at: `desc` },
        ) as Prisma.log_attendancesOrderByWithRelationInput,
        where,
        include: {
          user: { omit: { password: true } },
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
          status: { in: [`CHECKED_IN`, `CHECKED_OUT`] },
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
          status: { in: [`CHECKED_IN`, `CHECKED_OUT`] },
          created_at:
            start_date && end_date
              ? {
                  gte: start_date,
                  lte: new Date(end_date.getTime() + 24 * 60 * 60 * 1000),
                }
              : undefined,
          OR: [{ user: { full_name: { contains: search || '' } } }],
        },
        include: { user: { omit: { password: true } } },
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
        include: { user: { omit: { password: true } } },
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

  async checkout(
    event_id: string,
    updateAttendanceDto: UpdateAttendanceDto,
    userId: string,
    userRole?: string,
  ) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: {
          OR: [{ uuid: event_id }, { slug: event_id }],
        },
      });
      if (!findEvent) throw new NotFoundException(`Event doesn't exist`);

      await this.validateScannerPermission(findEvent.uuid, userId, userRole);

      const { user_id } = updateAttendanceDto;
      const findUserEventRole = await this.prisma.user_event_roles.findFirst({
        where: { user_id, event_id: findEvent.uuid },
      });
      if (!findUserEventRole)
        throw new NotFoundException(
          `Sorry, you are not registered for this event`,
        );

      const notAllowedRoles: EventRole[] = [`COMMITTEE`, `OWNER`, `TENANT`];
      if (notAllowedRoles.includes(findUserEventRole.role))
        throw new ConflictException(
          `Sorry, you are registered as ${findUserEventRole.role} for this event`,
        );

      const findExistingVisit = await this.prisma.log_attendances.findFirst({
        where: { user_id, event_id: findEvent.uuid },
        orderBy: { created_at: `desc` },
      });
      const currentDate = new Date();
      const existingAttendance = findExistingVisit?.created_at;
      const isToday =
        currentDate.getDate() === existingAttendance?.getDate() &&
        currentDate.getMonth() === existingAttendance?.getMonth() &&
        currentDate.getFullYear() === existingAttendance?.getFullYear();

      if (!findExistingVisit || !isToday)
        throw new NotFoundException(
          `You have not checked in to the event today`,
        );
      else if (findExistingVisit.checkout_at)
        return {
          success: true,
          message: `You have already checkout before`,
          data: findExistingVisit,
        };

      const updateAttendanceStatus = await this.prisma.log_attendances.update({
        where: { uuid: findExistingVisit.uuid },
        data: {
          checkout_at: new Date(),
          updated_at: new Date(),
        },
      });

      const findVisitingHistory = await this.prisma.booth_visits.findMany({
        where: { user_id },
      });
      const countVisit = findVisitingHistory.length;
      return {
        success: true,
        message: `Your checkout has been recorded successfully. You have visited a total of ${countVisit} booths`,
        data: updateAttendanceStatus,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something went wrong: ${error}`);
    }
  }

  async checkoutWorkshop(
    workshop_id: string,
    updateWorkshopAttendanceDto: UpdateWorkshopAttendanceDto,
    userId: string,
    userRole?: string,
  ) {
    try {
      const findWorkshop = await this.prisma.workshops.findFirst({
        where: { uuid: workshop_id },
        include: { workshopBookings: true },
      });
      if (!findWorkshop) throw new NotFoundException(`Workshop doesn't exist`);

      await this.validateScannerPermission(
        findWorkshop.event_id,
        userId,
        userRole,
      );

      const { user_id } = updateWorkshopAttendanceDto;
      const findBookingWorkshop = await this.prisma.workshop_bookings.findFirst(
        {
          where: { workshop_id, user_id },
        },
      );

      if (
        !findBookingWorkshop ||
        findBookingWorkshop.checkin_at == null ||
        findBookingWorkshop.status !== `CHECKED_IN`
      ) {
        if (findBookingWorkshop?.status === `CHECKED_OUT`)
          return {
            success: true,
            message: `You have already checked out earlier`,
            data: findBookingWorkshop,
          };
        throw new NotFoundException(
          `You have not checked in to this workshop yet`,
        );
      }

      const updateStatusBooking = await this.prisma.workshop_bookings.update({
        where: { uuid: findBookingWorkshop.uuid },
        data: {
          status: `CHECKED_OUT`,
          checkout_at: new Date(),
          updated_by: userId,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        message: `Your checkout for this workshop has been saved`,
        data: updateStatusBooking,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something went wrong: ${error}`);
    }
  }
}
