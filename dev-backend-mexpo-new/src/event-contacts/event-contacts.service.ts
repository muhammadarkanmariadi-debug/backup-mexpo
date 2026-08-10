import {
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventContactDto } from './dto/create-event-contact.dto';
import { UpdateEventContactDto } from './dto/update-event-contact.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryEventContactDto } from './dto/query-event-contact.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class EventContactsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(
    event_id: string,
    createEventContactDto: CreateEventContactDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const findExistingEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findExistingEvent) {
        throw new NotFoundException(`Event doesn't exists`);
      }

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });
      if (!findEventUser && role !== `SUPERADMIN`) {
        throw new ForbiddenException(
          `Sorry, you can't add contact list for ${findExistingEvent.name}`,
        );
      }

      const { name, email, phone_number } = createEventContactDto;
      const createContact = await this.prisma.event_contact.create({
        data: {
          name,
          email,
          phone_number,
          created_by: userId,
          updated_by: userId,
          event_id,
        },
      });
      return {
        success: true,
        message: `Contact list for ${findExistingEvent.name} created`,
        data: createContact,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async findAll(
    event_id: string,
    query: QueryEventContactDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const findExistingEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findExistingEvent) {
        throw new NotFoundException(`Event doesn't exists`);
      }

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });
      if (!findEventUser && role !== `SUPERADMIN`) {
        throw new ForbiddenException(
          `Sorry, you can't add contact list for ${findExistingEvent.name}`,
        );
      }

      const { page, quantity, search } = query;
      const take = quantity || undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const counts = await this.prisma.event_contact.count({
        where: {
          event_id,
          OR: [
            { name: { contains: search || '' } },
            { email: { contains: search || '' } },
          ],
        },
      });

      const contacts = await this.prisma.event_contact.findMany({
        skip,
        take,
        orderBy: { name: `asc` },
        where: {
          event_id,
          OR: [
            { name: { contains: search || '' } },
            { email: { contains: search || '' } },
          ],
        },
      });

      return {
        success: true,
        message: `Contact for this events has retrieved`,
        data: contacts,
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
      const contact = await this.prisma.event_contact.findFirst({
        where: { uuid: id },
      });
      if (!contact) {
        throw new NotFoundException(`Contact list doesn't exists`);
      }
      return {
        success: true,
        message: `Contact list has found`,
        data: contact,
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
    updateEventContactDto: UpdateEventContactDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const contact = await this.prisma.event_contact.findFirst({
        where: { uuid: id },
        include: { event: true },
      });
      if (!contact) {
        throw new NotFoundException(`Contact list doesn't exists`);
      }

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: contact.event_id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });
      if (!findEventUser && role !== `SUPERADMIN`) {
        throw new ForbiddenException(
          `Sorry, you can't edit contact list for ${contact.event.name}`,
        );
      }

      const { name, email, phone_number } = updateEventContactDto;
      const updateContact = await this.prisma.event_contact.update({
        where: { uuid: id },
        data: {
          name: name ?? contact.name,
          email: email ?? contact.email,
          phone_number: phone_number ?? contact.phone_number,
          updated_by: userId,
        },
      });

      return {
        success: true,
        message: `Contact list has updated`,
        data: updateContact,
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
      const contact = await this.prisma.event_contact.findFirst({
        where: { uuid: id },
        include: { event: true },
      });
      if (!contact) {
        throw new NotFoundException(`Contact list doesn't exists`);
      }

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: contact.event_id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });
      if (!findEventUser && role !== `SUPERADMIN`) {
        throw new ForbiddenException(
          `Sorry, you can't remove contact list for ${contact.event.name}`,
        );
      }

      const dropContact = await this.prisma.event_contact.delete({
        where: { uuid: id },
      });

      return {
        success: true,
        message: `Contact list has removed`,
        data: dropContact,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }
}
