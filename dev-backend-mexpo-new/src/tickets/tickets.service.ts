import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { assertEventFeature } from '../events/event-features';
import {
  CreateTicketTypeDto,
  UpdateTicketTypeDto,
} from './dto/ticket-type.dto';
import { BuyTicketDto, UpdateTicketDto } from './dto/ticket.dto';
import { QueryTicketDto } from './dto/query-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertManager(
    event_id: string,
    userId: string,
    role?: UserRole,
  ) {
    if (role === `SUPERADMIN`) return;
    const found = await this.prisma.user_event_roles.findFirst({
      where: {
        event_id,
        user_id: userId,
        status: `APPROVED`,
        role: { in: [`OWNER`, `COMMITTEE`] },
      },
    });
    if (!found) {
      throw new ForbiddenException(
        `You are not allowed to manage tickets for this event`,
      );
    }
  }

  // ─────────────────────────── Ticket types (owner) ───────────────────────────

  async createTicketType(
    event_id: string,
    dto: CreateTicketTypeDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const event = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!event) throw new NotFoundException(`Event doesn't exists`);
      await this.assertManager(event_id, userId, role);
      if (event.ticket_mode !== `PAID`) {
        throw new ConflictException(
          `Ticket types are only available for paid events`,
        );
      }
      await assertEventFeature(this.prisma, event_id, 'paidTicket');

      const type = await this.prisma.ticket_types.create({
        data: {
          event_id,
          name: dto.name,
          price: dto.price,
          created_by: userId,
          updated_by: userId,
        },
      });
      return { success: true, message: `Ticket type created`, data: type };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async findAllTicketTypes(
    event_id: string,
    query: QueryTicketDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const event = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!event) throw new NotFoundException(`Event doesn't exists`);
      const isManager =
        role === `SUPERADMIN` ||
        (await this.assertManagerSafe(event_id, userId, role));
      // Only managers can see draft events' types; public visitors need the event published.
      if (!isManager && event.status !== `PUBLISHED`) {
        throw new ForbiddenException(`This event is not published`);
      }

      const { page, quantity, search } = query;
      const take = quantity ?? undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;
      const where = { event_id, name: { contains: search ?? `` } };

      const counts = await this.prisma.ticket_types.count({ where });
      const data = await this.prisma.ticket_types.findMany({
        take,
        skip,
        orderBy: { price: `asc` },
        where,
      });
      return {
        success: true,
        message: `Ticket types retrieved`,
        data,
        meta: { page, quantity, counts },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async updateTicketType(
    id: string,
    dto: UpdateTicketTypeDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const type = await this.prisma.ticket_types.findFirst({
        where: { uuid: id },
      });
      if (!type) throw new NotFoundException(`Ticket type doesn't exists`);
      await this.assertManager(type.event_id, userId, role);

      const updated = await this.prisma.ticket_types.update({
        where: { uuid: id },
        data: {
          name: dto.name ?? type.name,
          price: dto.price ?? type.price,
          updated_by: userId,
        },
      });
      return { success: true, message: `Ticket type updated`, data: updated };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async removeTicketType(id: string, userId: string, role?: UserRole) {
    try {
      const type = await this.prisma.ticket_types.findFirst({
        where: { uuid: id },
      });
      if (!type) throw new NotFoundException(`Ticket type doesn't exists`);
      await this.assertManager(type.event_id, userId, role);

      const removed = await this.prisma.ticket_types.delete({
        where: { uuid: id },
      });
      return { success: true, message: `Ticket type removed`, data: removed };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  // ─────────────────────────────────── Tickets ───────────────────────────────────

  /** Logged-in visitor buys/confirms a ticket (must already be an APPROVED visitor). */
  async buy(event_id: string, dto: BuyTicketDto, userId: string) {
    try {
      const event = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!event) throw new NotFoundException(`Event doesn't exists`);

      const visitor = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id,
          user_id: userId,
          role: `VISITOR`,
          status: `APPROVED`,
        },
      });
      if (!visitor) {
        throw new ForbiddenException(`You must register to this event first`);
      }

      const existing = await this.prisma.tickets.findFirst({
        where: { event_id, user_id: userId, status: { not: `CANCELLED` } },
      });

      if (event.ticket_mode === `PAID`) {
        await assertEventFeature(this.prisma, event_id, 'paidTicket');
        if (!dto.ticket_type_id) {
          throw new BadRequestException(
            `ticket_type_id is required for paid events`,
          );
        }
        const type = await this.prisma.ticket_types.findFirst({
          where: { uuid: dto.ticket_type_id, event_id },
        });
        if (!type) throw new NotFoundException(`Ticket type doesn't exists`);

        if (existing) {
          const updated = await this.prisma.tickets.update({
            where: { uuid: existing.uuid },
            data: {
              ticket_type_id: type.uuid,
              payment_reference:
                dto.payment_reference ?? existing.payment_reference,
              payment_method: dto.payment_method ?? existing.payment_method,
              status: dto.payment_reference ? `PAID` : existing.status,
              updated_by: userId,
            },
          });
          return { success: true, message: `Ticket updated`, data: updated };
        }

        const ticket = await this.prisma.tickets.create({
          data: {
            event_id,
            user_id: userId,
            ticket_type_id: type.uuid,
            payment_reference: dto.payment_reference ?? ``,
            payment_method: dto.payment_method ?? ``,
            status: dto.payment_reference ? `PAID` : `RESERVED`,
            created_by: userId,
            updated_by: userId,
          },
        });
        return { success: true, message: `Ticket created`, data: ticket };
      }

      // FREE event → free ticket (already paid).
      if (existing) {
        return {
          success: true,
          message: `You already have a ticket`,
          data: existing,
        };
      }
      const ticket = await this.prisma.tickets.create({
        data: {
          event_id,
          user_id: userId,
          status: `PAID`,
          created_by: userId,
          updated_by: userId,
        },
      });
      return { success: true, message: `Free ticket issued`, data: ticket };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async findMy(event_id: string, userId: string) {
    try {
      const tickets = await this.prisma.tickets.findMany({
        where: { event_id, user_id: userId },
        include: { ticket_type: true },
        orderBy: { created_at: `desc` },
      });
      return {
        success: true,
        message: `Your tickets retrieved`,
        data: tickets,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async findAll(
    event_id: string,
    query: QueryTicketDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      await this.assertManager(event_id, userId, role);
      const { page, quantity, search } = query;
      const take = quantity ?? undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;
      const where = {
        event_id,
        user: search ? { full_name: { contains: search } } : undefined,
      };
      const counts = await this.prisma.tickets.count({ where });
      const data = await this.prisma.tickets.findMany({
        take,
        skip,
        orderBy: { created_at: `desc` },
        where,
        include: { user: { omit: { password: true } }, ticket_type: true },
      });
      return {
        success: true,
        message: `Tickets retrieved`,
        data,
        meta: { page, quantity, counts },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async updateTicket(
    id: string,
    dto: UpdateTicketDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const ticket = await this.prisma.tickets.findFirst({
        where: { uuid: id },
      });
      if (!ticket) throw new NotFoundException(`Ticket doesn't exists`);
      await this.assertManager(ticket.event_id, userId, role);

      const updated = await this.prisma.tickets.update({
        where: { uuid: id },
        data: {
          status: dto.status ?? ticket.status,
          payment_reference: dto.payment_reference ?? ticket.payment_reference,
          payment_method: dto.payment_method ?? ticket.payment_method,
          updated_by: userId,
        },
      });
      return { success: true, message: `Ticket updated`, data: updated };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  private async assertManagerSafe(
    event_id: string,
    userId: string,
    role?: UserRole,
  ): Promise<boolean> {
    if (role === `SUPERADMIN`) return true;
    const found = await this.prisma.user_event_roles.findFirst({
      where: {
        event_id,
        user_id: userId,
        status: `APPROVED`,
        role: { in: [`OWNER`, `COMMITTEE`] },
      },
    });
    return !!found;
  }
}
