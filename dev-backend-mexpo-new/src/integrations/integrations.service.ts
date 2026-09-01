import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { isUuid, slugify, uniqueSlug } from '../helper/slug';
import {
  EventRole,
  EventStatus,
  EventVisibility,
  EventType,
  Prisma,
  RegistrationFieldType,
  TicketMode,
} from '@prisma/client';
import { CreateIntegrationEventDto } from './dto/create-integration-event.dto';
import { UpdateIntegrationEventDto } from './dto/update-integration-event.dto';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  private get frontendUrl(): string {
    return (
      this.configService.get<string>('PUBLIC_FRONTEND_URL') ||
      'http://localhost:3000'
    );
  }

  private async getSystemUser(ownerEmail?: string): Promise<string> {
    if (ownerEmail) {
      const existingUser = await this.prisma.users.findFirst({
        where: { email: ownerEmail },
      });
      if (existingUser) return existingUser.uuid;
    }

    const superAdmin = await this.prisma.users.findFirst({
      where: { role: 'SUPERADMIN' },
    });
    if (superAdmin) return superAdmin.uuid;

    const anyUser = await this.prisma.users.findFirst();
    if (anyUser) return anyUser.uuid;

    throw new NotFoundException('No system user found to associate event with');
  }

  async createEvent(dto: CreateIntegrationEventDto) {
    try {
      const systemUserId = await this.getSystemUser(dto.owner_email);

      const slug = dto.slug
        ? slugify(dto.slug)
        : await uniqueSlug(dto.name, (s) =>
          this.prisma.events.findFirst({ where: { slug: s } }).then(Boolean),
        );

      const features: Record<string, unknown> = {
        ...(dto.extra_features || {}),
        integration: {
          source: 'school_website',
          callback_url: dto.callback_url || null,
        },
      };

      const event = await this.prisma.events.create({
        data: {
          slug,
          name: dto.name,
          description: dto.description,
          location: dto.location || 'Online / Campus',
          start_date: new Date(dto.start_date),
          end_date: new Date(dto.end_date),
          registration_start: dto.registration_start
            ? new Date(dto.registration_start)
            : new Date(),
          registration_deadline: dto.registration_deadline
            ? new Date(dto.registration_deadline)
            : new Date(dto.end_date),
          quota: dto.quota ?? 0,
          organizer_name: dto.organizer_name || 'School Administration',
          photo: dto.photo || '',
          visibility: dto.visibility ?? EventVisibility.PRIVATE, // unlisted by default
          status: EventStatus.PUBLISHED, // directly published for partner integration
          event_type: dto.event_type ?? EventType.CAMPUS_SCHOOL,
          ticket_mode: dto.ticket_mode ?? TicketMode.FREE,
          features: features as unknown as Prisma.InputJsonValue,
          created_by: systemUserId,
          updated_by: systemUserId,
          userEventRoles: {
            create: {
              role: EventRole.OWNER,
              status: 'APPROVED',
              user_id: systemUserId,
              created_by: systemUserId,
              updated_by: systemUserId,
            },
          },
        },
      });

      // Create default ticket type
      const isPaid = dto.ticket_mode === TicketMode.PAID;
      const ticketType = await this.prisma.ticket_types.create({
        data: {
          event_id: event.uuid,
          name:
            dto.ticket_name || (isPaid ? 'Paid Trial Pass' : 'Free Trial Pass'),
          price: isPaid ? (dto.ticket_price ?? 0) : 0,
          created_by: systemUserId,
          updated_by: systemUserId,
        },
      });

      // Create custom registration fields if provided
      const customFieldsCreated: unknown[] = [];
      if (dto.custom_fields && dto.custom_fields.length > 0) {
        for (let i = 0; i < dto.custom_fields.length; i++) {
          const field = dto.custom_fields[i];
          const field_key = field.field_key
            ? slugify(field.field_key)
            : slugify(field.label, `field_${i + 1}`);

          const createdField =
            await this.prisma.event_registration_fields.create({
              data: {
                event_id: event.uuid,
                field_key,
                label: field.label,
                type: field.type || RegistrationFieldType.TEXT,
                required: field.required ?? false,
                options: field.options
                  ? (field.options as unknown as Prisma.InputJsonValue)
                  : undefined,
                position: field.position ?? i,
                created_by: systemUserId,
                updated_by: systemUserId,
              },
            });
          customFieldsCreated.push(createdField);
        }
      }

      const eventSlug = event.slug || event.uuid;
      const publicUrl = `${this.frontendUrl}/event/${eventSlug}`;
      const registerUrl = `${this.frontendUrl}/event/${eventSlug}/register`;
      const directRegisterUrl = `${registerUrl}?source=school_website`;
      const dashboardUrl = `${this.frontendUrl}/dashboard/${eventSlug}`;

      return {
        status: true,
        message: 'Event created and synced with Mexpo successfully',
        data: {
          id: event.uuid,
          slug: event.slug,
          name: event.name,
          visibility: event.visibility,
          status: event.status,
          quota: event.quota,
          public_url: publicUrl,
          register_url: registerUrl,
          direct_register_url: directRegisterUrl,
          dashboard_url: dashboardUrl,
          ticket_type: {
            id: ticketType.uuid,
            name: ticketType.name,
            price: ticketType.price,
          },
          custom_fields: customFieldsCreated,
          callback_url: dto.callback_url || null,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to create integrated event: ${error}`,
      );
    }
  }

  async updateEvent(id: string, dto: UpdateIntegrationEventDto) {
    try {
      const event = await this.prisma.events.findFirst({
        where: isUuid(id) ? { uuid: id } : { slug: id },
      });
      if (!event) {
        throw new NotFoundException(`Event ${id} does not exist`);
      }

      const existingFeatures =
        (event.features as Record<string, unknown>) || {};
      const updatedFeatures = {
        ...existingFeatures,
        ...(dto.extra_features || {}),
        integration: {
          ...((existingFeatures.integration as Record<string, unknown>) || {}),
          callback_url:
            dto.callback_url !== undefined
              ? dto.callback_url
              : (existingFeatures.integration as { callback_url?: string })
                ?.callback_url,
        },
      };

      const updated = await this.prisma.events.update({
        where: { uuid: event.uuid },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.description && { description: dto.description }),
          ...(dto.location && { location: dto.location }),
          ...(dto.start_date && { start_date: new Date(dto.start_date) }),
          ...(dto.end_date && { end_date: new Date(dto.end_date) }),
          ...(dto.registration_start && {
            registration_start: new Date(dto.registration_start),
          }),
          ...(dto.registration_deadline && {
            registration_deadline: new Date(dto.registration_deadline),
          }),
          ...(dto.quota !== undefined && { quota: dto.quota }),
          ...(dto.organizer_name && { organizer_name: dto.organizer_name }),
          ...(dto.photo && { photo: dto.photo }),
          ...(dto.visibility && { visibility: dto.visibility }),
          ...(dto.status && { status: dto.status }),
          ...(dto.event_type && { event_type: dto.event_type }),
          ...(dto.ticket_mode && { ticket_mode: dto.ticket_mode }),
          features: updatedFeatures as unknown as Prisma.InputJsonValue,
        },
      });

      const eventSlug = updated.slug || updated.uuid;
      const publicUrl = `${this.frontendUrl}/event/${eventSlug}`;
      const registerUrl = `${this.frontendUrl}/event/${eventSlug}/register`;
      const dashboardUrl = `${this.frontendUrl}/dashboard/${eventSlug}`;

      return {
        status: true,
        message: 'Event updated successfully in Mexpo',
        data: {
          id: updated.uuid,
          slug: updated.slug,
          name: updated.name,
          visibility: updated.visibility,
          status: updated.status,
          quota: updated.quota,
          public_url: publicUrl,
          register_url: registerUrl,
          dashboard_url: dashboardUrl,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update integrated event: ${error}`,
      );
    }
  }

  async deleteEvent(id: string) {
    try {
      const event = await this.prisma.events.findFirst({
        where: isUuid(id) ? { uuid: id } : { slug: id },
      });
      if (!event) {
        throw new NotFoundException(`Event ${id} does not exist`);
      }

      await this.prisma.events.delete({
        where: { uuid: event.uuid },
      });

      return {
        status: true,
        message: `Event ${id} deleted successfully from Mexpo`,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to delete integrated event: ${error}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const event = await this.prisma.events.findFirst({
        where: isUuid(id) ? { uuid: id } : { slug: id },
        include: {
          ticketTypes: true,
          registrationFields: {
            orderBy: [{ position: 'asc' }, { created_at: 'asc' }],
          },
        },
      });
      if (!event) {
        throw new NotFoundException(`Event ${id} not found`);
      }

      const totalRegistrations = await this.prisma.user_event_roles.count({
        where: { event_id: event.uuid, role: 'VISITOR' },
      });

      const approvedRegistrations = await this.prisma.user_event_roles.count({
        where: { event_id: event.uuid, role: 'VISITOR', status: 'APPROVED' },
      });

      const pendingRegistrations = await this.prisma.user_event_roles.count({
        where: { event_id: event.uuid, role: 'VISITOR', status: 'PENDING' },
      });

      const eventSlug = event.slug || event.uuid;
      const dashboardUrl = `${this.frontendUrl}/dashboard/${eventSlug}`;

      return {
        status: true,
        data: {
          ...event,
          total_registered: totalRegistrations,
          approved_registered: approvedRegistrations,
          pending_registered: pendingRegistrations,
          remaining_quota:
            event.quota > 0
              ? Math.max(0, event.quota - approvedRegistrations)
              : null,
          public_url: `${this.frontendUrl}/event/${eventSlug}`,
          register_url: `${this.frontendUrl}/event/${eventSlug}/register`,
          dashboard_url: dashboardUrl,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to fetch integrated event: ${error}`,
      );
    }
  }

  async findAttendees(id: string) {
    try {
      const event = await this.prisma.events.findFirst({
        where: isUuid(id) ? { uuid: id } : { slug: id },
      });
      if (!event) {
        throw new NotFoundException(`Event ${id} not found`);
      }

      const roles = await this.prisma.user_event_roles.findMany({
        where: { event_id: event.uuid, role: 'VISITOR' },
        include: {
          user: {
            include: {
              tickets: {
                where: { event_id: event.uuid },
                include: { ticket_type: true },
              },
              registrationAnswers: {
                where: { event_id: event.uuid },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      const attendees = roles.map((r) => {
        const answersMap: Record<string, string> = {};
        for (const ans of r.user.registrationAnswers) {
          answersMap[ans.field_key] = ans.value;
        }

        const ticket = r.user.tickets[0] || null;

        return {
          user_id: r.user.uuid,
          full_name: r.user.full_name,
          email: r.user.email,
          phone: r.user.phone,
          organization: r.user.organization,
          role_status: r.status,
          registered_at: r.created_at,
          ticket: ticket
            ? {
              id: ticket.uuid,
              name: ticket.ticket_type?.name,
              status: ticket.status,
              payment_method: ticket.payment_method,
              payment_reference: ticket.payment_reference,
            }
            : null,
          custom_answers: answersMap,
        };
      });

      return {
        status: true,
        data: {
          event_id: event.uuid,
          total_attendees: attendees.length,
          attendees,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to fetch attendees: ${error}`,
      );
    }
  }
}
