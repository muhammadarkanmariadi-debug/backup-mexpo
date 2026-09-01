import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventUserDto } from './dto/create-event-user.dto';
import { UpdateEventUserDto } from './dto/update-event-user.dto';
import { BulkImportEventUsersDto } from './dto/bulk-import-event-user.dto';
import { BroadcastTicketsDto } from './dto/broadcast-tickets.dto';
import { PrismaService } from '../prisma/prisma.service';
import { BcryptService } from '../bcrypt/bcrypt.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { EventRole } from '@prisma/client';
import { QueryEventUserDto } from './dto/query-event-user.dto';
import { buildOrderBy } from '../helper/sort';
import { Prisma } from '@prisma/client';
import * as QRCode from 'qrcode';
import { buildRegistrationTicketEmailHtml } from '../mail/templates/registration-ticket.template';

const EVENT_USER_SORTABLE: Record<
  string,
  (dir: 'asc' | 'desc') => Prisma.user_event_rolesOrderByWithRelationInput
> = {
  full_name: (d) => ({ user: { full_name: d } }),
  role: (d) => ({ role: d }),
  created_at: (d) => ({ created_at: d }),
};

@Injectable()
export class EventUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcrypt: BcryptService,
    private readonly mailer: MailService,
    private readonly configService: ConfigService,
  ) {}
  async create(
    event_id: string,
    userId: string,
    createEventUserDto?: CreateEventUserDto,
    role?: EventRole,
  ) {

    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) {
        throw new NotFoundException(`Event doesn't exists`);
      }

      if (role && role === `VISITOR`) {
        const findExistingVisitor =
          await this.prisma.user_event_roles.findFirst({
            where: { event_id, user_id: userId },
          });
        if (findExistingVisitor) {
          throw new ConflictException(
            `You have already to be ${findExistingVisitor.role} at ${findEvent.name}`,
          );
        }
        const currentVisitor = await this.prisma.user_event_roles.count({
          where: { event_id, role: `VISITOR` },
        });
        if (findEvent.quota > 0 && currentVisitor + 1 > findEvent.quota) {
          throw new ConflictException(
            `Sorry, quota of ${findEvent.name} has reached limit`,
          );
        }
        // Registration window enforcement (FIX-14).
        const now = new Date();
        if (
          findEvent.registration_start &&
          now < findEvent.registration_start
        ) {
          throw new ConflictException(
            `Registration for ${findEvent.name} has not started yet`,
          );
        }
        if (
          findEvent.registration_deadline &&
          now > findEvent.registration_deadline
        ) {
          throw new ConflictException(
            `Registration for ${findEvent.name} has been closed`,
          );
        }
        const newVisitor = await this.prisma.user_event_roles.create({
          data: {
            event_id,
            role: `VISITOR`,
            status: `APPROVED`,
            user_id: userId,
            created_by: userId,
            updated_by: userId,
          },
        });
        return {
          success: true,
          message: `New visitor of ${findEvent.name} has created`,
          data: newVisitor,
        };
      }

      if (role && role === `COMMITTEE`) {
        if (createEventUserDto?.email) {
          /** assume that process create by event's owner */
          const findEventOwner = await this.prisma.user_event_roles.findFirst({
            where: { user_id: userId, role: `OWNER`, event_id },
          });
          if (!findEventOwner)
            throw new ConflictException(
              `User is not as owner at ${findEvent.name}`,
            );

          const findUser = await this.prisma.users.findFirst({
            where: { email: createEventUserDto.email, is_active: true },
          });
          if (!findUser) {
            throw new NotFoundException(`Email is not registered`);
          }

          const findExistingCommitee =
            await this.prisma.user_event_roles.findFirst({
              where: { event_id, user_id: findUser.uuid },
            });
          if (findExistingCommitee) {
            throw new ConflictException(
              `You have already to be committee at ${findEvent.name}`,
            );
          }
          const newCommitee = await this.prisma.user_event_roles.create({
            data: {
              event_id,
              role: `COMMITTEE`,
              status: `APPROVED`,
              user_id: findUser.uuid,
              created_by: userId,
              updated_by: userId,
            },
          });

          return {
            success: true,
            message: `New commitee of ${findEvent.name} has created`,
            data: newCommitee,
          };
        }

        /** assume that process create by themselves */
        const findExistingCommitee =
          await this.prisma.user_event_roles.findFirst({
            where: { event_id, user_id: userId },
          });
        if (findExistingCommitee) {
          throw new ConflictException(
            `You have already to be ${findExistingCommitee.role} at ${findEvent.name}`,
          );
        }
        const newCommitee = await this.prisma.user_event_roles.create({
          data: {
            event_id,
            role: `COMMITTEE`,
            status: `PENDING`,
            user_id: userId,
            created_by: userId,
            updated_by: userId,
          },
        });

        return {
          success: true,
          message: `New commitee of ${findEvent.name} has created, please wait for owner to approve`,
          data: newCommitee,
        };
      }

      if (role && role == `TENANT`) {
        /** assume that process create by themselves */
        const findExistingTenant = await this.prisma.user_event_roles.findFirst(
          {
            where: { event_id, user_id: userId },
          },
        );
        if (findExistingTenant) {
          throw new ConflictException(
            `You have already to be ${findExistingTenant.role} at ${findEvent.name}`,
          );
        }
        const newTenant = await this.prisma.user_event_roles.create({
          data: {
            event_id,
            role: `TENANT`,
            status: `PENDING`,
            user_id: userId,
            created_by: userId,
            updated_by: userId,
          },
        });

        return {
          success: true,
          message: `New tenant of ${findEvent.name} has created, please wait for owner to approve`,
          data: newTenant,
        };
      }
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async findAll(event_id: string, query: QueryEventUserDto, userId: string) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) {
        throw new NotFoundException(`Event is doesn't exists`);
      }

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });
      if (!findEventUser) {
        throw new ForbiddenException(
          `Sorry, you can't fetch sponsor for ${findEvent.name}`,
        );
      }
      const { page, quantity, search, status, role } = query;
      const take = quantity ?? undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const searchFilter: Prisma.user_event_rolesWhereInput = search?.trim()
        ? {
            OR: [
              { user: { full_name: { contains: search.trim() } } },
              { user: { email: { contains: search.trim() } } },
              { user: { phone: { contains: search.trim() } } },
              { user: { organization: { contains: search.trim() } } },
            ],
          }
        : {};

      const rolesArray = role
        ? role.split(',').map((r) => r.trim() as EventRole)
        : undefined;
      const where: Prisma.user_event_rolesWhereInput = {
        event_id,
        status: status ?? undefined,
        role: rolesArray ? { in: rolesArray } : undefined,
        ...searchFilter,
      };

      const counts = await this.prisma.user_event_roles.count({ where });

      const users = await this.prisma.user_event_roles.findMany({
        take,
        skip,
        orderBy: buildOrderBy(
          query.sort_by,
          query.sort_dir,
          EVENT_USER_SORTABLE,
          { user: { full_name: `asc` } },
        ) as Prisma.user_event_rolesOrderByWithRelationInput,
        where,
        include: {
          user: { omit: { password: true } },
          event: true,
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
        },
      });

      // A8 — attach dynamic registration answers (keyed by event_id + user_id)
      // so committee/owner can view the custom-form values each visitor filled.
      // Labels are resolved from `event_registration_fields` so the UI can show
      // human-readable field names instead of raw `field_key`s.
      const fieldDefs = await this.prisma.event_registration_fields.findMany({
        where: { event_id },
        select: { field_key: true, label: true },
      });
      const labelByKey = new Map(
        fieldDefs.map((f) => [f.field_key, f.label ?? f.field_key]),
      );
      const userAnswers = await this.prisma.registration_answers.findMany({
        where: {
          event_id,
          user_id: { in: users.map((u) => u.user_id) },
        },
        select: {
          user_id: true,
          field_key: true,
          value: true,
        },
      });
      const answerMap = new Map<
        string,
        { field_key: string; label: string; value: string }[]
      >();
      for (const a of userAnswers) {
        const list = answerMap.get(a.user_id) ?? [];
        list.push({
          field_key: a.field_key,
          label: labelByKey.get(a.field_key) ?? a.field_key,
          value: a.value,
        });
        answerMap.set(a.user_id, list);
      }
      const usersWithAnswers = users.map((u) => ({
        ...u,
        registrationAnswers: answerMap.get(u.user_id) ?? [],
      }));

      return {
        success: true,
        message: `Event user has retrieved`,
        data: usersWithAnswers,
        meta: { page, quantity, counts },
      };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async update(
    id: string,
    updateEventUserDto: UpdateEventUserDto,
    userId: string,
  ) {
    try {
      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: { uuid: id },
      });
      if (!findEventUser) {
        throw new NotFoundException(`User Event doesn't exists`);
      }

      const findExistingOwner = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: findEventUser.event_id,
          user_id: userId,
          role: { in: [`OWNER`, `COMMITTEE`] },
          status: `APPROVED`,
        },
      });
      if (!findExistingOwner) {
        throw new ConflictException(
          `Sorry, only approved owner/commitee of event can update this user role`,
        );
      }

      const { status, role } = updateEventUserDto;
      const updateEventUser = await this.prisma.user_event_roles.update({
        where: { uuid: id },
        data: {
          role: role ?? findEventUser.role,
          status: status ?? findEventUser.status,
          updated_by: userId,
        },
      });

      /** delete row if rejected */
      if (status && status === `REJECTED`) {
        await this.prisma.user_event_roles.delete({ where: { uuid: id } });
      }

      if (findEventUser.role === `TENANT`) {
        /** delete row if rejected */
        if (status && status === `REJECTED`) {
          await this.prisma.tenant_members.deleteMany({
            where: { user_id: findEventUser.user_id },
          });
        }
        if (status && status === `APPROVED`) {
          await this.prisma.tenant_members.updateMany({
            where: { user_id: findEventUser.user_id },
            data: { status },
          });
        }
      }

      if (status === `APPROVED` && findEventUser.status !== `APPROVED`) {
        this.sendParticipantTicketEmail(
          findEventUser.event_id,
          findEventUser.user_id,
        ).catch((err) =>
          console.error('Failed auto-sending ticket email upon approval:', err),
        );
      }

      return {
        success: true,
        message: `Event user has updated successfully`,
        data: updateEventUser,
      };

    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async remove(id: string, userId: string) {
    try {
      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: { uuid: id },
      });
      if (!findEventUser) {
        throw new NotFoundException(`User Event doesn't exists`);
      }

      const findExistingOwner = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: findEventUser.event_id,
          user_id: userId,
          role: `OWNER`,
        },
      });
      if (!findExistingOwner) {
        throw new ConflictException(
          `Sorry, only owner of event can remove this user role`,
        );
      }

      const removeEventUser = await this.prisma.user_event_roles.delete({
        where: { uuid: id },
      });

      return {
        success: true,
        message: `Event user has removed successfully`,
        data: removeEventUser,
      };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  /** Bulk import participants/visitors into an event */
  async bulkImportEventUsers(
    event_id: string,
    currentUserId: string,
    dto: BulkImportEventUsersDto,
  ) {
    try {
      const event = await this.prisma.events.findUnique({
        where: { uuid: event_id },
      });
      if (!event) throw new NotFoundException('Event tidak ditemukan');

      // Verify permission: SUPERADMIN or APPROVED OWNER/COMMITTEE
      const currentUser = await this.prisma.users.findUnique({
        where: { uuid: currentUserId },
      });
      if (currentUser?.role !== 'SUPERADMIN') {
        const isOrganizer = await this.prisma.user_event_roles.findFirst({
          where: {
            event_id,
            user_id: currentUserId,
            status: 'APPROVED',
            role: { in: ['OWNER', 'COMMITTEE'] },
          },
        });
        if (!isOrganizer) {
          throw new ForbiddenException(
            'Hanya Owner atau Panitia yang dapat mengimpor peserta event.',
          );
        }
      }

      const defaultPasswordHash = await this.bcrypt.hashPassword('pass1234');
      const results = {
        total: dto.users.length,
        created: 0,
        enrolled: 0,
        skipped: 0,
        details: [] as Array<{
          email: string;
          status: 'CREATED_AND_ENROLLED' | 'ENROLLED' | 'SKIPPED';
          reason?: string;
        }>,
      };

      for (const item of dto.users) {
        if (!item.email || !item.full_name) {
          results.skipped++;
          results.details.push({
            email: item.email || '(unknown)',
            status: 'SKIPPED',
            reason: 'Nama atau email kosong',
          });
          continue;
        }

        const email = item.email.toLowerCase().trim();
        let targetUser = await this.prisma.users.findUnique({
          where: { email },
        });

        let isNewUser = false;
        if (!targetUser) {
          targetUser = await this.prisma.users.create({
            data: {
              full_name: item.full_name,
              email,
              phone: item.phone || '',
              organization: item.organization || '',
              password: defaultPasswordHash,
              is_active: true,
              verify_at: new Date(),
              role: 'USER',
            },
          });
          isNewUser = true;
          results.created++;
        }

        // Check if user is already enrolled in this event
        const existingEventRole = await this.prisma.user_event_roles.findFirst({
          where: { event_id, user_id: targetUser.uuid },
        });

        const targetRole = item.role || 'VISITOR';

        if (existingEventRole) {
          await this.prisma.user_event_roles.update({
            where: { uuid: existingEventRole.uuid },
            data: {
              status: 'APPROVED',
              role: targetRole,
              updated_by: currentUserId,
              verify_at: existingEventRole.verify_at || new Date(),
            },
          });
        } else {
          await this.prisma.user_event_roles.create({
            data: {
              event_id,
              user_id: targetUser.uuid,
              role: targetRole,
              status: 'APPROVED',
              created_by: currentUserId,
              updated_by: currentUserId,
              verify_at: new Date(),
            },
          });
        }

        results.enrolled++;
        results.details.push({
          email,
          status: isNewUser ? 'CREATED_AND_ENROLLED' : 'ENROLLED',
        });
      }

      return {
        status: true,
        message: `Import peserta berhasil: ${results.enrolled} peserta didaftarkan ke event.`,
        data: results,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        `Gagal import peserta event. ${error}`,
      );
    }
  }

  /**
   * Generates participant QR and sends full registration & e-ticket email
   */
  async sendParticipantTicketEmail(
    eventId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const event = await this.prisma.events.findFirst({
        where: { uuid: eventId },
      });
      if (!event) return false;

      const user = await this.prisma.users.findFirst({
        where: { uuid: userId },
      });
      if (!user || !user.email) return false;

      const roleRecord = await this.prisma.user_event_roles.findFirst({
        where: { event_id: eventId, user_id: userId },
      });

      const ticket = await this.prisma.tickets.findFirst({
        where: {
          event_id: eventId,
          user_id: userId,
          status: { not: 'CANCELLED' },
        },
        include: { ticket_type: true },
      });

      const fields = await this.prisma.event_registration_fields.findMany({
        where: { event_id: eventId },
        orderBy: [{ position: 'asc' }, { created_at: 'asc' }],
      });

      const answers = await this.prisma.registration_answers.findMany({
        where: { event_id: eventId, user_id: userId },
      });

      const formattedAnswers = fields
        .map((f) => ({
          label: f.label ?? f.field_key,
          value: answers.find((a) => a.field_key === f.field_key)?.value ?? '',
        }))
        .filter((a) => a.value && a.value.trim().length > 0);

      const codeData = `mexpo:${eventId}:${userId}`;
      const qrBuffer = await QRCode.toBuffer(codeData, {
        width: 300,
        margin: 2,
        type: 'png',
      });

      const dateFormatted =
        event.start_date && event.end_date
          ? `${new Date(event.start_date).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })} - ${new Date(event.end_date).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}`
          : undefined;

      const emailHtml = buildRegistrationTicketEmailHtml({
        eventName: event.name,
        eventDate: dateFormatted,
        eventLocation: event.location ?? undefined,
        userName: user.full_name,
        userEmail: user.email,
        userPhone: user.phone ?? undefined,
        userOrganization: user.organization ?? undefined,
        ticketName: ticket?.ticket_type?.name ?? undefined,
        paymentMethod: ticket?.payment_method ?? undefined,
        paymentReference: ticket?.payment_reference ?? undefined,
        paymentStatus: roleRecord?.status ?? ticket?.status ?? undefined,
        loginUrl: `${this.configService.get<string>('PUBLIC_FRONTEND_URL')}/auth`,
        answers: formattedAnswers,
        qrCid: 'ticket-qr',
      });

      await this.mailer.sendMail(
        user.email,
        `[Mexpo] E-Tiket & Registrasi: ${event.name}`,
        emailHtml,
        [
          {
            filename: 'ticket-qr.png',
            content: qrBuffer,
            cid: 'ticket-qr',
            contentType: 'image/png',
          },
        ],
      );

      return true;
    } catch (err) {
      console.error(
        `Failed to send ticket email to user ${userId} for event ${eventId}:`,
        err,
      );
      return false;
    }
  }

  async resendTicket(
    eventId: string,
    targetUserId: string,
    requesterId: string,
  ) {
    try {
      const requester = await this.prisma.users.findFirst({
        where: { uuid: requesterId },
      });
      const isSuperAdmin = requester?.role === 'SUPERADMIN';

      if (!isSuperAdmin) {
        const ownerOrCommittee = await this.prisma.user_event_roles.findFirst({
          where: {
            event_id: eventId,
            user_id: requesterId,
            role: { in: ['OWNER', 'COMMITTEE'] },
            status: 'APPROVED',
          },
        });
        if (!ownerOrCommittee) {
          throw new ForbiddenException(
            'Hanya panitia atau pemilik event yang dapat mengirim ulang tiket',
          );
        }
      }

      const success = await this.sendParticipantTicketEmail(
        eventId,
        targetUserId,
      );
      if (!success) {
        throw new BadRequestException(
          'Gagal mengirim email tiket. Pastikan email pengguna valid.',
        );
      }

      return {
        status: true,
        message: 'Email tiket & QR berhasil dikirim ulang ke peserta.',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        `Gagal mengirim ulang tiket. ${error}`,
      );
    }
  }

  async broadcastTickets(
    eventId: string,
    requesterId: string,
    dto: BroadcastTicketsDto,
  ) {
    try {
      const requester = await this.prisma.users.findFirst({
        where: { uuid: requesterId },
      });
      const isSuperAdmin = requester?.role === 'SUPERADMIN';

      if (!isSuperAdmin) {
        const ownerOrCommittee = await this.prisma.user_event_roles.findFirst({
          where: {
            event_id: eventId,
            user_id: requesterId,
            role: { in: ['OWNER', 'COMMITTEE'] },
            status: 'APPROVED',
          },
        });
        if (!ownerOrCommittee) {
          throw new ForbiddenException(
            'Hanya panitia atau pemilik event yang dapat melakukan broadcast tiket',
          );
        }
      }

      const status = dto.status ?? 'APPROVED';
      const role = dto.role ?? 'VISITOR';

      const participants = await this.prisma.user_event_roles.findMany({
        where: {
          event_id: eventId,
          status,
          role,
        },
        include: {
          user: { select: { uuid: true, email: true, full_name: true } },
        },
      });

      if (participants.length === 0) {
        return {
          status: true,
          message: 'Tidak ada peserta yang sesuai dengan kriteria filter.',
          data: { total: 0, sent: 0, failed: 0 },
        };
      }

      let sentCount = 0;
      let failedCount = 0;

      // Process in chunks of 5 with slight delays
      const chunkSize = 5;
      for (let i = 0; i < participants.length; i += chunkSize) {
        const chunk = participants.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map(async (p) => {
            const ok = await this.sendParticipantTicketEmail(
              eventId,
              p.user_id,
            );
            if (ok) sentCount++;
            else failedCount++;
          }),
        );
        if (i + chunkSize < participants.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      return {
        status: true,
        message: `Broadcast tiket selesai. ${sentCount} terkirim, ${failedCount} gagal.`,
        data: {
          total: participants.length,
          sent: sentCount,
          failed: failedCount,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        `Gagal melakukan broadcast tiket. ${error}`,
      );
    }
  }
}

