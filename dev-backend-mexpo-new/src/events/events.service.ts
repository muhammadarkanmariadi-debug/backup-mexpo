import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ApproveEventDto } from './dto/approve-event.dto';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { QueryEventDto } from './dto/query-event.dto';
import { EventRole, EventStatus, Prisma, UserRole } from '@prisma/client';
import { buildOrderBy } from '../helper/sort';
import { isUuid, uniqueSlug } from '../helper/slug';

/** True when the event's feature flag marks it as a paid-ticket event. */
function isPaidTicketFeature(features?: unknown): boolean {
  return (
    !!features &&
    typeof features === 'object' &&
    (features as { paidTicket?: unknown }).paidTicket === true
  );
}

const EVENT_SORTABLE: Record<
  string,
  (dir: 'asc' | 'desc') => Prisma.eventsOrderByWithRelationInput
> = {
  name: (d) => ({ name: d }),
  start_date: (d) => ({ start_date: d }),
  created_at: (d) => ({ created_at: d }),
  updated_at: (d) => ({ updated_at: d }),
};

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
    private readonly mailer: MailService,
  ) {}
  async create(
    createEventDto: CreateEventDto,
    userId: string,
    file?: Express.Multer.File,
  ) {
    try {
      const findUser = await this.prisma.users.findFirst({
        where: { uuid: userId },
      });
      if (!findUser) {
        throw new NotFoundException(`User is not found`);
      }
      let photo: string = ``;
      if (file) {
        const filename = `${new Date().getTime().toString()}-${file.originalname}`;
        photo = `${this.configService.get<string>(`MINIO_ENDPOINT`)}/expo-project-event/${filename}`;
        await this.s3Service.upload(
          `expo-project-event`,
          filename,
          file.buffer,
          file.mimetype,
        );
      }

      const {
        name,
        location,
        quota,
        start_date,
        end_date,
        description,
        organizer_name,
        registration_start,
        registration_deadline,
        souvenir_rules,
        visibility,
        event_type,
        ticket_mode,
        features,
      } = createEventDto;
      const slug = await uniqueSlug(createEventDto.name ?? `event`, (s) =>
        this.prisma.events.findFirst({ where: { slug: s } }).then(Boolean),
      );
      const newEvent = await this.prisma.events.create({
        data: {
          slug,
          name,
          location,
          description,
          start_date,
          end_date,
          quota,
          organizer_name,
          created_by: userId,
          updated_by: userId,
          photo,
          registration_start,
          registration_deadline,
          souvenir_rules: souvenir_rules as unknown as
            | Prisma.InputJsonValue
            | undefined,
          visibility: visibility ?? `PUBLIC`,
          event_type: event_type ?? `OTHER`,
          // The admin "Tiket Berbayar" toggle lives in features.paidTicket; keep
          // the ticket_mode column in sync so public pages & payment gating agree.
          ticket_mode:
            ticket_mode ?? (isPaidTicketFeature(features) ? `PAID` : `FREE`),
          features: features as unknown as Prisma.InputJsonValue | undefined,
          userEventRoles: {
            create: {
              role: `OWNER`,
              status: `APPROVED`,
              user_id: userId,
              created_by: userId,
              updated_by: userId,
              verify_at: new Date(),
            },
          },
        },
      });

      return {
        success: true,
        message: `New event has been created successfully`,
        data: newEvent,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async findAll(
    @Query() query: QueryEventDto,
    role?: EventRole[],
    userId?: string,
  ) {
    try {
      const { page, quantity, search } = query;
      const take = quantity ?? undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const counts = await this.prisma.events.count({
        where: {
          userEventRoles: userId
            ? {
                some: {
                  role: { in: role },
                  user_id: userId,
                  status: `APPROVED`,
                },
              }
            : undefined,
          OR: [
            { name: { contains: search ?? `` } },
            { description: { contains: search ?? `` } },
            { organizer_name: { contains: search ?? `` } },
            { location: { contains: search ?? `` } },
            { creator: { full_name: { contains: search ?? `` } } },
          ],
        },
      });

      const events = await this.prisma.events.findMany({
        take,
        skip,
        orderBy: buildOrderBy(query.sort_by, query.sort_dir, EVENT_SORTABLE, {
          created_at: `desc`,
        }) as Prisma.eventsOrderByWithRelationInput,
        where: {
          userEventRoles: userId
            ? {
                some: {
                  role: { in: role },
                  user_id: userId,
                  status: `APPROVED`,
                },
              }
            : undefined,
          OR: [
            { name: { contains: search ?? `` } },
            { description: { contains: search ?? `` } },
            { organizer_name: { contains: search ?? `` } },
            { location: { contains: search ?? `` } },
            { creator: { full_name: { contains: search ?? `` } } },
          ],
        },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
          userEventRoles: {
            where: { user_id: userId },
            select: { role: true },
          },
          _count: {
            select: {
              userEventRoles: { where: { role: `VISITOR` } },
              tenants: { where: { status: `APPROVED` } },
              workshops: true,
            },
          },
        },
      });

      const mappedEvents = events.map((e) => ({
        ...e,
        count_user_registration: e._count?.userEventRoles ?? 0,
        count_tenants: e._count?.tenants ?? 0,
        count_workshops: e._count?.workshops ?? 0,
      }));

      return {
        success: true,
        message: `Events retrieved successfully`,
        data: mappedEvents,
        meta: { page, quantity, counts },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async findOne(id: string, userId?: string) {
    try {
      const findExistingEvent = await this.prisma.events.findFirst({
        where: isUuid(id) ? { uuid: id } : { slug: id },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
          userEventRoles: {
            where: { user_id: userId },
            select: { role: true },
          },
          workshops: {
            include: {
              workshopBookings: true,
              workshopSpeakers: { include: { event_speaker: true } },
            },
          },
          eventContacts: true,
          eventRundowns: { include: { eventRundownSpeakers: true } },
          eventSpeakers: { where: { status: `APPROVED` } },
          eventSponsors: true,
          tenants: {
            where: { status: `APPROVED` },
            include: { tenantProducts: true, category: true },
          },
          _count: {
            select: {
              userEventRoles: { where: { role: `VISITOR` } },
              tenants: { where: { status: `APPROVED` } },
              workshops: true,
            },
          },
        },
      });
      if (!findExistingEvent) {
        throw new NotFoundException(`Event doesn't exists`);
      }

      const mappedEvent = {
        ...findExistingEvent,
        count_user_registration: findExistingEvent._count?.userEventRoles ?? 0,
        count_tenants: findExistingEvent._count?.tenants ?? 0,
        count_workshops: findExistingEvent._count?.workshops ?? 0,
      };

      return {
        success: true,
        message: `Events retrieved successfully`,
        data: mappedEvent,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    userId: string,
    file?: Express.Multer.File,
    role?: UserRole,
  ) {
    try {
      const findExistingEvent = await this.prisma.events.findFirst({
        where: { uuid: id },
      });
      if (!findExistingEvent) {
        throw new NotFoundException(`Event doesn't exists`);
      }

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });
      if (!findEventUser && role !== `SUPERADMIN`) {
        throw new ForbiddenException(
          `Sorry, you can't edit ${findExistingEvent.name}`,
        );
      }

      let fileUrl = findExistingEvent.photo;
      if (file) {
        const oldFileUrl = findExistingEvent.photo;
        if (oldFileUrl) {
          const oldFilename = oldFileUrl.split('/').pop() || '';
          await this.s3Service.delete(`expo-project-event`, oldFilename);
        }
        const filename = `${new Date().getTime().toString()}-${file.originalname}`;
        fileUrl = `${this.configService.get<string>(`MINIO_ENDPOINT`)}/expo-project-event/${filename}`;
        await this.s3Service.upload(
          `expo-project-event`,
          filename,
          file.buffer,
          file.mimetype,
        );
      }

      const {
        description,
        end_date,
        location,
        name,
        organizer_name,
        registration_start,
        registration_deadline,
        quota,
        start_date,
        status,
        souvenir_rules,
        visibility,
        event_type,
        ticket_mode,
        features,
      } = updateEventDto;

      // A3 lifecycle: only a SUPERADMIN may set PUBLISHED directly. Everyone
      // else must submit a publish request (status PENDING) and wait for approval.
      if (
        status === `PUBLISHED` &&
        role !== `SUPERADMIN` &&
        findExistingEvent.status !== `PUBLISHED`
      ) {
        throw new ForbiddenException(
          `Publishing requires super admin approval. Submit a publish request instead.`,
        );
      }

      const nextStatus = status ?? findExistingEvent.status;
      // Unchecked input is required: `approved_by`/`updated_by` are scalar FKs
      // backing relations (approver/editor) and are not on eventsUpdateInput.
      const updateData: Prisma.eventsUncheckedUpdateInput = {
        name: name ?? findExistingEvent.name,
        registration_start:
          registration_start ?? findExistingEvent.registration_start,
        start_date: start_date ?? findExistingEvent.start_date,
        end_date: end_date ?? findExistingEvent.end_date,
        location: location ?? findExistingEvent.location,
        description: description ?? findExistingEvent.description,
        organizer_name: organizer_name ?? findExistingEvent.organizer_name,
        quota: quota ?? findExistingEvent.quota,
        status: nextStatus,
        registration_deadline:
          registration_deadline ?? findExistingEvent.registration_deadline,
        photo: fileUrl,
        // approved_by records who published the event, not who created it (FIX-13).
        approved_by:
          nextStatus === `PUBLISHED` ? userId : findExistingEvent.approved_by,
        visibility: visibility ?? findExistingEvent.visibility,
        event_type: event_type ?? findExistingEvent.event_type,
        // Clear the rejection reason whenever the event leaves REJECTED.
        rejection_reason:
          nextStatus === `REJECTED` ? findExistingEvent.rejection_reason : null,
      };
      // Only touch JSON fields when the caller actually provides them,
      // so an event without config is never overwritten with null.
      if (souvenir_rules !== undefined) {
        updateData.souvenir_rules =
          souvenir_rules as unknown as Prisma.InputJsonValue;
      }
      if (features !== undefined) {
        updateData.features = features as unknown as Prisma.InputJsonValue;
        // Keep ticket_mode in sync with the paidTicket toggle when the admin
        // saves the event config (create already follows the same rule).
        updateData.ticket_mode = isPaidTicketFeature(features)
          ? `PAID`
          : `FREE`;
      } else if (ticket_mode !== undefined) {
        // Explicit ticket_mode wins over the stored value (e.g. API callers).
        updateData.ticket_mode = ticket_mode;
      } else {
        updateData.ticket_mode = findExistingEvent.ticket_mode;
      }
      // Keep slug in sync when the name changes (never on unrelated updates).
      if (name !== undefined && name !== findExistingEvent.name) {
        updateData.slug = await uniqueSlug(name, (s) =>
          this.prisma.events.findFirst({ where: { slug: s } }).then(Boolean),
        );
      }
      const updateEvent = await this.prisma.events.update({
        where: { uuid: id },
        data: updateData,
      });

      return {
        success: true,
        message: `Events has been updated successfully`,
        data: updateEvent,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async remove(id: string, userId: string) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: id },
      });
      if (!findEvent) {
        throw new NotFoundException(`Event doesn't exists`);
      }

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: id,
          user_id: userId,
          role: { in: [`OWNER`] },
        },
      });
      if (!findEventUser) {
        throw new ForbiddenException(
          `Sorry, you can't remove ${findEvent.name}`,
        );
      }

      const oldFileUrl = findEvent.photo;
      if (oldFileUrl !== ``) {
        const oldFilename = oldFileUrl.split('/').pop() || '';
        await this.s3Service.delete(`expo-project-event`, oldFilename);
      }
      const dropEvent = await this.prisma.events.delete({
        where: { uuid: id },
      });
      return {
        success: true,
        message: `Event has been deleted`,
        data: dropEvent,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  /**
   * A3 — Owner/committee submits a publish request: event → PENDING and waits
   * for super admin approval.
   */
  async publishRequest(id: string, userId: string) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: id },
      });
      if (!findEvent) {
        throw new NotFoundException(`Event doesn't exists`);
      }

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: id,
          user_id: userId,
          status: `APPROVED`,
          role: { in: [`OWNER`, `COMMITTEE`] },
        },
      });
      if (!findEventUser) {
        throw new ForbiddenException(
          `Only the event owner/committee can submit a publish request`,
        );
      }

      if (findEvent.status === `PUBLISHED`) {
        throw new ConflictException(`This event is already published`);
      }
      if (findEvent.status === `PENDING`) {
        throw new ConflictException(
          `This event already has a pending publish request`,
        );
      }
      if (findEvent.status === `FINISHED`) {
        throw new BadRequestException(
          `A finished event cannot request publishing. Reopen it first.`,
        );
      }

      const updatedEvent = await this.prisma.events.update({
        where: { uuid: id },
        data: {
          status: `PENDING`,
          updated_by: userId,
          rejection_reason: null,
          approved_by: null,
        },
      });

      return {
        success: true,
        message: `Publish request submitted for ${findEvent.name}. Waiting for super admin approval.`,
        data: updatedEvent,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  /**
   * A3 — Super admin approves/rejects a publish request.
   * Approve → PUBLISHED (approved_by = approver). Reject → REJECTED with reason.
   */
  async approval(
    id: string,
    approveEventDto: ApproveEventDto,
    superAdminId: string,
  ) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: id },
      });
      if (!findEvent) {
        throw new NotFoundException(`Event doesn't exists`);
      }
      if (findEvent.status !== `PENDING`) {
        throw new ConflictException(
          `This event has no pending publish request (current status: ${findEvent.status})`,
        );
      }

      const { approved, rejection_reason } = approveEventDto;

      const updatedEvent = await this.prisma.events.update({
        where: { uuid: id },
        data: approved
          ? {
              status: `PUBLISHED`,
              approved_by: superAdminId,
              updated_by: superAdminId,
              rejection_reason: null,
            }
          : {
              status: `REJECTED`,
              updated_by: superAdminId,
              approved_by: null,
              rejection_reason: rejection_reason ?? `Not approved`,
            },
      });

      // A11 — notify the event creator about the decision.
      const creator = await this.prisma.users.findFirst({
        where: { uuid: findEvent.created_by },
      });
      if (creator?.email) {
        const frontendUrl =
          this.configService.get<string>(`PUBLIC_FRONTEND_URL`);
        const statusText = approved ? `disetujui & dipublikasikan` : `ditolak`;
        const reasonHtml = approved
          ? ``
          : `<p style="color:#b91c1c;">Alasan: ${
              rejection_reason ?? `Tidak ada alasan`
            }</p>`;
        this.mailer
          .sendMail(
            creator.email,
            `[Mexpo] Event "${findEvent.name}" ${statusText}`,
            `
              <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;">
                <h2 style="margin:0 0 12px;">Keputusan Publikasi Event</h2>
                <p>Halo <strong>${creator.full_name}</strong>,</p>
                <p>Event <strong>${findEvent.name}</strong> telah <strong>${statusText}</strong> oleh super admin.</p>
                ${reasonHtml}
                <p><a href="${frontendUrl}/dashboard" style="background:#3c85f3;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Buka Dashboard</a></p>
              </div>
            `,
          )
          .then(() => console.log(`Approval email sent to ${creator.email}`))
          .catch((error) =>
            console.error(`Error sending approval email: ${error}`),
          );
      }

      return {
        success: true,
        message: approved
          ? `${findEvent.name} has been approved and published`
          : `${findEvent.name} has been rejected`,
        data: updatedEvent,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  /**
   * A3 — Super admin approval queue: events awaiting decision (PENDING)
   * plus recently rejected ones.
   */
  async findAllForApproval(query: QueryEventDto) {
    try {
      const { page, quantity, search } = query;
      const take = quantity ?? undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const where: Prisma.eventsWhereInput = {
        status: { in: [EventStatus.PENDING, EventStatus.REJECTED] },
        OR: [
          { name: { contains: search ?? `` } },
          { description: { contains: search ?? `` } },
          { organizer_name: { contains: search ?? `` } },
        ],
      };

      const counts = await this.prisma.events.count({ where });
      const events = await this.prisma.events.findMany({
        take,
        skip,
        orderBy: { updated_at: `desc` },
        where,
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
          approver: { select: { full_name: true } },
        },
      });

      return {
        success: true,
        message: `Approval queue retrieved`,
        data: events,
        meta: { page, quantity, counts },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  /**
   * Owner/committee finishes a PUBLISHED event → FINISHED.
   * Blocks new registrations; existing data remains accessible.
   */
  async finish(id: string, userId: string, role?: UserRole) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: id },
      });
      if (!findEvent) {
        throw new NotFoundException(`Event doesn't exists`);
      }
      if (findEvent.status !== `PUBLISHED`) {
        throw new BadRequestException(
          `Only a published event can be finished (current status: ${findEvent.status})`,
        );
      }
      if (role !== `SUPERADMIN`) {
        const member = await this.prisma.user_event_roles.findFirst({
          where: {
            event_id: id,
            user_id: userId,
            status: `APPROVED`,
            role: { in: [`OWNER`, `COMMITTEE`] },
          },
        });
        if (!member) {
          throw new ForbiddenException(
            `Only the event owner/committee can finish this event`,
          );
        }
      }
      const updatedEvent = await this.prisma.events.update({
        where: { uuid: id },
        data: { status: `FINISHED`, updated_by: userId },
      });
      return {
        success: true,
        message: `${findEvent.name} has been finished`,
        data: updatedEvent,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  /**
   * Owner/committee reopens a FINISHED event → PUBLISHED.
   * Restores the event to its published state.
   */
  async reopen(id: string, userId: string, role?: UserRole) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: id },
      });
      if (!findEvent) {
        throw new NotFoundException(`Event doesn't exists`);
      }
      if (findEvent.status !== `FINISHED`) {
        throw new BadRequestException(
          `Only a finished event can be reopened (current status: ${findEvent.status})`,
        );
      }
      if (role !== `SUPERADMIN`) {
        const member = await this.prisma.user_event_roles.findFirst({
          where: {
            event_id: id,
            user_id: userId,
            status: `APPROVED`,
            role: { in: [`OWNER`, `COMMITTEE`] },
          },
        });
        if (!member) {
          throw new ForbiddenException(
            `Only the event owner/committee can reopen this event`,
          );
        }
      }
      const updatedEvent = await this.prisma.events.update({
        where: { uuid: id },
        data: { status: `PUBLISHED`, updated_by: userId },
      });
      return {
        success: true,
        message: `${findEvent.name} has been reopened`,
        data: updatedEvent,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }
}
