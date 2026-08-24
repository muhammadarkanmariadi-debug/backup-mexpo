import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryPublicEventDto } from './dto/query-public-api.dto';
import { QueryEventUserDto } from '../event-users/dto/query-event-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { BcryptService } from '../bcrypt/bcrypt.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { EventStatus, EventVisibility, Prisma } from '@prisma/client';
import { isUuid } from '../helper/slug';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class PublicApiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcrypt: BcryptService,
    private readonly mailer: MailService,
    private readonly configService: ConfigService,
    private readonly paymentsService: PaymentsService,
  ) {}

  newAccountInfoEmailTemplate(
    name: string,
    email: string,
    loginUrl: string,
    temporaryPassword?: string,
  ): string {
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Welcome to Your Account</title>
  </head>
  <body style="
    margin: 0;
    padding: 0;
    background-color: #f4f6f8;
    font-family: Arial, Helvetica, sans-serif;
  ">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 40px 10px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="
            max-width: 600px;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          ">
            <!-- Header -->
            <tr>
              <td style="
                background-color: #16a34a;
                color: #ffffff;
                padding: 20px;
                text-align: center;
                font-size: 22px;
                font-weight: bold;
              ">
                Your Account Is Ready 🎉
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 30px; color: #333333;">
                <p style="font-size: 16px;">
                  Hi <strong>${name}</strong>,
                </p>

                <p style="font-size: 15px; line-height: 1.6;">
                  Welcome! Your account has been successfully created. Below are your account details:
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" style="
                  margin: 20px 0;
                  background-color: #f9fafb;
                  border-radius: 6px;
                ">
                  <tr>
                    <td style="padding: 12px; font-size: 14px; color: #555;">
                      <strong>Email</strong>
                    </td>
                    <td style="padding: 12px; font-size: 14px; color: #111;">
                      ${email}
                    </td>
                  </tr>

                  ${
                    temporaryPassword
                      ? `
                  <tr>
                    <td style="padding: 12px; font-size: 14px; color: #555;">
                      <strong>Temporary Password</strong>
                    </td>
                    <td style="padding: 12px; font-size: 14px; color: #111;">
                      ${temporaryPassword}
                    </td>
                  </tr>
                  `
                      : ''
                  }
                </table>

                <p style="font-size: 14px; color: #555;">
                  For security reasons, please change your password after logging in.
                </p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${loginUrl}" target="_blank" style="
                    background-color: #16a34a;
                    color: #ffffff;
                    text-decoration: none;
                    padding: 14px 28px;
                    border-radius: 6px;
                    font-size: 16px;
                    display: inline-block;
                  ">
                    Login to Your Account
                  </a>
                </div>

                <div style="
                  background-color: #ecfdf5;
                  border-left: 4px solid #16a34a;
                  padding: 12px;
                  margin-top: 25px;
                  font-size: 14px;
                  color: #065f46;
                ">
                  If you did not expect this account, please contact our support team immediately.
                </div>

                <p style="font-size: 14px; margin-top: 30px;">
                  Welcome aboard,<br/>
                  <strong>Mexpo Team</strong>
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="
                background-color: #f4f6f8;
                text-align: center;
                padding: 15px;
                font-size: 12px;
                color: #888;
              ">
                © ${new Date().getFullYear()} Mexpo App. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
  }

  async findAll(
    query: QueryPublicEventDto,
    type: 'ACTIVE' | 'UPCOMING' | 'ALL' = 'ALL',
  ) {
    try {
      const { page, quantity, search, event_type } = query;
      const take = quantity ?? undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const where: Prisma.eventsWhereInput = {
        status: EventStatus.PUBLISHED,
        // A7 — private events are not exposed on the public site.
        visibility: EventVisibility.PUBLIC,
        event_type: event_type ?? undefined,
        registration_start:
          type === `ALL`
            ? undefined
            : type === `ACTIVE`
              ? {
                  lte: new Date(),
                }
              : { gte: new Date() },
        end_date: type === `ALL` ? undefined : { gte: new Date() },
        OR: [
          { name: { contains: search ?? `` } },
          { description: { contains: search ?? `` } },
          { organizer_name: { contains: search ?? `` } },
          { location: { contains: search ?? `` } },
        ],
      };

      const counts = await this.prisma.events.count({ where });

      const events = await this.prisma.events.findMany({
        take,
        skip,
        orderBy: { created_at: `desc` },
        where,
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
          workshops: {
            include: {
              workshopBookings: true,
              workshopSpeakers: { include: { event_speaker: true } },
            },
          },
          eventContacts: true,
          eventRundowns: { include: { eventRundownSpeakers: true } },
          eventSpeakers: true,
          eventSponsors: true,
          tenants: { include: { tenantProducts: true, category: true } },
        },
      });

      return {
        success: true,
        message: `Events retrieved successfully`,
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

  async findOne(id: string) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: isUuid(id)
          ? {
              uuid: id,
              status: EventStatus.PUBLISHED,
              visibility: EventVisibility.PUBLIC,
            }
          : {
              slug: id,
              status: EventStatus.PUBLISHED,
              visibility: EventVisibility.PUBLIC,
            },
        include: {
          workshops: {
            include: {
              workshopBookings: true,
              workshopSpeakers: { include: { event_speaker: true } },
            },
          },
          eventContacts: true,
          eventRundowns: { include: { eventRundownSpeakers: true } },
          eventSpeakers: true,
          eventSponsors: true,
          tenants: { include: { tenantProducts: true, category: true } },
        },
      });
      if (!findEvent) {
        throw new NotFoundException(`Events doesn't exists`);
      }

      const event_uuid = findEvent.uuid;
      const count_user_registration = await this.prisma.user_event_roles.count({
        where: { role: `VISITOR`, event_id: event_uuid },
      });
      const count_tenants = await this.prisma.tenants.count({
        where: { event_id: event_uuid, status: `APPROVED` },
      });
      const count_workshops = await this.prisma.workshops.count({
        where: { event_id: event_uuid },
      });

      return {
        success: true,
        message: `Event is exists`,
        data: {
          ...findEvent,
          count_tenants,
          count_user_registration,
          count_workshops,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async findAllUserEvent(event_id: string, query: QueryEventUserDto) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) {
        throw new NotFoundException(`Event is doesn't exists`);
      }

      const { page, quantity, search, status, role } = query;
      const take = quantity ?? undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const counts = await this.prisma.users.count({
        where: {
          role: `USER`,
          userEventRoles: {
            some: {
              event_id,
              status,
              role,
            },
          },
          OR: [
            { full_name: { contains: search ?? `` } },
            { email: { contains: search ?? `` } },
          ],
        },
      });

      const users = await this.prisma.users.findMany({
        take,
        skip,
        orderBy: { full_name: `asc` },
        where: {
          role: `USER`,
          userEventRoles: {
            some: {
              event_id,
              status,
              role,
            },
          },
          OR: [
            { full_name: { contains: search ?? `` } },
            { email: { contains: search ?? `` } },
          ],
        },
        omit: { password: true },
        include: { userEventRoles: true },
      });

      return {
        success: true,
        message: `Event user has retrieved`,
        data: users.map((user) => {
          const { uuid, full_name, email, userEventRoles } = user;
          return {
            uuid,
            full_name,
            email,
            status: userEventRoles.find((uer) => uer.event_id === event_id)
              ?.status,
            role: userEventRoles.find((uer) => uer.event_id === event_id)?.role,
          };
        }),
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

  async registerAsVisitor(event_id: string, createUserDto: CreateUserDto) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) throw new NotFoundException(`Event doesn'texists`);

      // Only PUBLISHED events accept registrations.
      if (findEvent.status !== EventStatus.PUBLISHED) {
        throw new ConflictException(
          `Registration is not available for this event (status: ${findEvent.status})`,
        );
      }

      // Registration window enforcement (FIX-14).
      const now = new Date();
      if (findEvent.registration_start && now < findEvent.registration_start) {
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

      // Quota enforcement (E5) — mirror the visitor self-registration path:
      // registration is rejected once the event's APPROVED VISITOR count
      // reaches `events.quota` (quota 0 = unlimited).
      if (findEvent.quota && findEvent.quota > 0) {
        const registeredCount = await this.prisma.user_event_roles.count({
          where: {
            event_id,
            role: `VISITOR`,
            status: `APPROVED`,
          },
        });
        if (registeredCount >= findEvent.quota) {
          throw new ConflictException(
            `Registration for ${findEvent.name} has reached its quota`,
          );
        }
      }

      const findSuperAdmin = await this.prisma.users.findFirst({
        where: { role: `SUPERADMIN` },
      });
      if (!findSuperAdmin)
        throw new NotFoundException(`Superadmin does not exists`);
      const eventDinas = '05f3af5d-b049-43b2-985f-78d5214b8f56';
      // const eventDinas = '7fbef9fe-a195-4d6a-9f31-2d81076e6719'
      const isBioRequired = eventDinas === event_id ? true : false;
      const {
        full_name,
        email,
        organization,
        phone,
        city,
        role_type,
        destination_country,
        departure_month,
        ticket_type_id,
        payment_reference,
        payment_method,
        answers,
      } = createUserDto;

      const isPaid =
        findEvent.ticket_mode === `PAID` ||
        (findEvent.features as { paidTicket?: boolean })?.paidTicket === true;
      const initialRoleStatus =
        isPaid && !payment_reference ? `PENDING` : `APPROVED`;

      const findExistingEmail = await this.prisma.users.findFirst({
        where: { email },
        include: { userEventRoles: true },
      });

      let visitorUserId: string;
      let responseMessage: string;
      let responseData: unknown;
      if (findExistingEmail) {
        const existingRole = findExistingEmail.userEventRoles.find(
          (it) => it.event_id === event_id,
        );
        const updateUser = await this.prisma.users.update({
          where: { uuid: findExistingEmail.uuid },
          data: {
            full_name: full_name ?? findExistingEmail.full_name,
            organization: organization ?? findExistingEmail.organization,
            phone: phone ?? findExistingEmail.phone,
            userEventRoles: {
              upsert: {
                where: {
                  uuid: existingRole?.uuid || '',
                },
                create: {
                  created_by: findSuperAdmin.uuid,
                  updated_by: findSuperAdmin.uuid,
                  event_id,
                  role: `VISITOR`,
                  status: initialRoleStatus,
                },
                update: {
                  event_id,
                  status:
                    existingRole?.status === `APPROVED`
                      ? `APPROVED`
                      : initialRoleStatus,
                },
              },
            },
          },
          omit: { password: true },
        });
        if (isBioRequired) {
          await this.prisma.users_bio.upsert({
            where: { user_id: findExistingEmail.uuid },
            create: {
              user_id: findExistingEmail.uuid,
              city,
              role_type,
              destination_country,
              departure_month: departure_month,
            },
            update: {
              city,
              role_type,
              destination_country,
              departure_month: departure_month,
            },
          });
        }

        visitorUserId = findExistingEmail.uuid;
        responseMessage =
          isPaid && !payment_reference
            ? `Pendaftaran disimpan. Silakan selesaikan pembayaran tiket Anda.`
            : `You have already registered, enjoy this event`;
        responseData = updateUser;
      } else {
        const defaultPassword = this.bcrypt.createRandomPassword();
        const createUser = await this.prisma.users.create({
          data: {
            full_name,
            phone,
            organization,
            password: await this.bcrypt.hashPassword(defaultPassword),
            email,
            is_active: true,
            userEventRoles: {
              create: {
                event_id,
                role: `VISITOR`,
                status: initialRoleStatus,
                created_by: findSuperAdmin.uuid,
                updated_by: findSuperAdmin.uuid,
              },
            },
            ...(isBioRequired && {
              usersBio: {
                create: {
                  city,
                  role_type,
                  destination_country,
                  departure_month: departure_month,
                },
              },
            }),
          },

          omit: { password: true },
        });

        this.mailer
          .sendMail(
            email,
            'Welcome to Expo Website - Account Information',
            this.newAccountInfoEmailTemplate(
              full_name,
              email,
              `${this.configService.get<string>(`PUBLIC_FRONTEND_URL`)}/auth`,
              defaultPassword,
            ),
          )
          .then(() => {
            console.log('Created account sent successfully.');
          })
          .catch((error) => {
            console.error('Error sending creating account:', error);
          });

        visitorUserId = createUser.uuid;
        responseMessage =
          isPaid && !payment_reference
            ? `Pendaftaran berhasil. Silakan selesaikan pembayaran tiket Anda.`
            : `New Visitor has been registered, check your email to view credential for access system`;
        responseData = createUser;
      }

      // ── A8: validate + store dynamic registration answers ──
      const fields = await this.prisma.event_registration_fields.findMany({
        where: { event_id },
        orderBy: [{ position: `asc` }, { created_at: `asc` }],
      });
      if (fields.length > 0) {
        const answerMap = new Map<string, string>(
          (answers ?? []).map((a) => [a.field_key, a.value ?? ``]),
        );
        for (const field of fields) {
          // A8 — fields with a condition are hidden (and optional) until the
          // trigger field equals the configured value.
          if (field.condition) {
            const cond = field.condition as {
              field_key: string;
              value: string;
            };
            if ((answerMap.get(cond.field_key) ?? ``) !== cond.value) continue;
          }
          const value = answerMap.get(field.field_key) ?? ``;
          if (field.required && !value.trim()) {
            throw new BadRequestException(`Field "${field.label}" is required`);
          }
        }
        await this.prisma.registration_answers.deleteMany({
          where: { event_id, user_id: visitorUserId },
        });
        if (answers && answers.length > 0) {
          await this.prisma.registration_answers.createMany({
            data: answers.map((a) => ({
              event_id,
              user_id: visitorUserId,
              field_key: a.field_key,
              value: a.value ?? ``,
              created_by: findSuperAdmin.uuid,
              updated_by: findSuperAdmin.uuid,
            })),
          });
        }
      }

      // ── A1: issue ticket ──
      const existingTicket = await this.prisma.tickets.findFirst({
        where: {
          event_id,
          user_id: visitorUserId,
          status: { not: `CANCELLED` },
        },
      });
      if (isPaid) {
        const type = ticket_type_id
          ? await this.prisma.ticket_types.findFirst({
              where: { uuid: ticket_type_id, event_id },
            })
          : await this.prisma.ticket_types.findFirst({
              where: { event_id },
              orderBy: { price: `asc` },
            });
        if (type) {
          if (existingTicket) {
            await this.prisma.tickets.update({
              where: { uuid: existingTicket.uuid },
              data: {
                ticket_type_id: type.uuid,
                payment_reference:
                  payment_reference ?? existingTicket.payment_reference,
                payment_method: payment_method ?? existingTicket.payment_method,
                status: payment_reference ? `PAID` : existingTicket.status,
                updated_by: findSuperAdmin.uuid,
              },
            });
          } else {
            await this.prisma.tickets.create({
              data: {
                event_id,
                user_id: visitorUserId,
                ticket_type_id: type.uuid,
                payment_reference: payment_reference ?? ``,
                payment_method: payment_method ?? ``,
                status: payment_reference ? `PAID` : `RESERVED`,
                created_by: findSuperAdmin.uuid,
                updated_by: findSuperAdmin.uuid,
              },
            });
          }
        }
      } else if (!existingTicket) {
        await this.prisma.tickets.create({
          data: {
            event_id,
            user_id: visitorUserId,
            ticket_type_id: null,
            status: `PAID`,
            created_by: findSuperAdmin.uuid,
            updated_by: findSuperAdmin.uuid,
          },
        });
      }

      // ── A1b — payment intent (Midtrans Snap) for paid events ──
      // Create the PENDING transaction + Snap token so the fresh visitor can
      // pay immediately (no login needed to open the Snap popup). Failures are
      // non-blocking — registration still succeeds and the logged-in
      // `POST /events/:id/checkout` can generate the intent later.
      let payment: unknown = null;
      if (isPaid && !payment_reference) {
        const ticket = await this.prisma.tickets.findFirst({
          where: {
            event_id,
            user_id: visitorUserId,
            status: { not: `CANCELLED` },
          },
          include: { ticket_type: true },
        });
        if (ticket?.ticket_type) {
          try {
            payment = await this.paymentsService.createPaymentForTicket({
              eventId: event_id,
              ticketId: ticket.uuid,
              userId: visitorUserId,
              ticketName: ticket.ticket_type.name,
              eventName: findEvent.name,
              amount: Math.round(ticket.ticket_type.price),
              customer: {
                first_name: full_name,
                email,
                phone: phone || undefined,
              },
              createdBy: findSuperAdmin.uuid,
            });
          } catch (error) {
            console.error(
              `Midtrans payment intent failed for ${event_id}:`,
              error,
            );
          }
          responseData = { ...(responseData as object), payment };
        }
      }

      // ── A11 — ticket confirmation email for paid events ──
      if (isPaid && ticket_type_id) {
        const ticketType = await this.prisma.ticket_types.findFirst({
          where: { uuid: ticket_type_id, event_id },
        });
        const frontendUrl =
          this.configService.get<string>(`PUBLIC_FRONTEND_URL`) ?? ``;
        this.mailer
          .sendMail(
            email,
            `[Mexpo] Tiket "${findEvent.name}"`,
            `
              <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;">
                <h2 style="margin:0 0 12px;">Tiket Event Kamu</h2>
                <p>Halo <strong>${full_name}</strong>,</p>
                <p>Kamu terdaftar di <strong>${findEvent.name}</strong>.</p>
                <p>Tiket: <strong>${ticketType?.name ?? `-`}</strong></p>
                <p>Metode pembayaran: ${payment_method ?? `-`} · ${
                  payment_reference
                    ? `Ref: ${payment_reference}`
                    : `Belum ada referensi pembayaran`
                }</p>
                <p>Simpan kode QR kamu untuk check-in saat acara: <a href="${frontendUrl}/auth">Login Mexpo</a></p>
              </div>
            `,
          )
          .then(() => console.log(`Ticket email sent to ${email}`))
          .catch((error) =>
            console.error(`Error sending ticket email: ${error}`),
          );
      }

      return {
        success: true,
        message: responseMessage,
        data: responseData,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  /** A8 — public registration form schema (ordered dynamic fields). */
  async findRegistrationFields(event_id: string) {
    try {
      const event = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!event) throw new NotFoundException(`Event doesn'texists`);

      const fields = await this.prisma.event_registration_fields.findMany({
        where: { event_id },
        orderBy: [{ position: `asc` }, { created_at: `asc` }],
        select: {
          uuid: true,
          field_key: true,
          label: true,
          type: true,
          required: true,
          options: true,
          condition: true,
          position: true,
        },
      });
      return {
        success: true,
        message: `Registration fields retrieved`,
        data: fields,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  /** A1 — public ticket types for a published event. */
  async findTicketTypes(event_id: string) {
    try {
      const event = await this.prisma.events.findFirst({
        where: { uuid: event_id, status: EventStatus.PUBLISHED },
      });
      if (!event) throw new NotFoundException(`Event doesn'texists`);

      const types = await this.prisma.ticket_types.findMany({
        where: { event_id },
        orderBy: { price: `asc` },
        select: {
          uuid: true,
          name: true,
          price: true,
        },
      });
      return {
        success: true,
        message: `Ticket types retrieved`,
        data: types,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }
}
