import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventRundownDto } from './dto/create-event-rundown.dto';
import { UpdateEventRundownDto } from './dto/update-event-rundown.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryEventRundownDto } from './dto/query-event-rundown.dto';
import { AddSpeakerRundownDto } from './dto/add-speaker-rundown.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class EventRundownsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(
    event_id: string,
    createEventRundownDto: CreateEventRundownDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) {
        return {
          success: false,
          message: `Event doesn't exists`,
        };
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
          `Sorry, you can't add rundown for ${findEvent.name}`,
        );
      }

      const { description, start_time, end_time, title } =
        createEventRundownDto;
      if (start_time > end_time) {
        return {
          success: false,
          messsage: `Start time can be greater than end time`,
        };
      }
      const newRundown = await this.prisma.event_rundown.create({
        data: {
          event_id,
          start_time,
          end_time,
          title,
          description,
          created_by: userId,
          updated_by: userId,
        },
      });

      return {
        success: true,
        message: `New rundown at ${findEvent.name} has been created`,
        data: newRundown,
      };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async findAll(
    event_id: string,
    query: QueryEventRundownDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) {
        return {
          success: false,
          message: `Event doesn't exists`,
        };
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
          `Sorry, you can't get rundown for ${findEvent.name}`,
        );
      }

      const { page, quantity, search } = query;
      const take = quantity || undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const counts = await this.prisma.event_rundown.count({
        where: {
          event_id,
          OR: [
            { title: { contains: search ?? `` } },
            { description: { contains: search ?? `` } },
          ],
        },
      });

      const rundowns = await this.prisma.event_rundown.findMany({
        take,
        skip,
        orderBy: { start_time: `asc` },
        include: {
          eventRundownSpeakers: { include: { event_speaker: true } },
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
        },
        where: {
          event_id,
          OR: [
            { title: { contains: search ?? `` } },
            { description: { contains: search ?? `` } },
          ],
        },
      });

      return {
        success: true,
        message: `Rundown of ${findEvent.name} has retrieved`,
        data: rundowns,
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

  async findOne(id: string, userId: string, role?: UserRole) {
    try {
      const findRundown = await this.prisma.event_rundown.findFirst({
        where: { uuid: id },
        include: {
          eventRundownSpeakers: { include: { event_speaker: true } },
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
        },
      });
      if (!findRundown) {
        throw new NotFoundException(`Rundown doesn't exists`);
      }

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: findRundown.event_id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });
      if (!findEventUser && role !== `SUPERADMIN`) {
        throw new ForbiddenException(`Sorry, you can't get this rundown`);
      }

      return {
        success: true,
        message: `Rundown has retrieved`,
        data: findRundown,
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
    updateEventRundownDto: UpdateEventRundownDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const findRundown = await this.prisma.event_rundown.findFirst({
        where: { uuid: id },
        include: { event: true },
      });
      if (!findRundown) {
        return {
          success: false,
          message: `Rundown doesn't exists`,
        };
      }

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: findRundown.event_id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });
      if (!findEventUser && role !== `SUPERADMIN`) {
        throw new ForbiddenException(
          `Sorry, you can't edit rundown for ${findRundown.event.name}`,
        );
      }

      const { title, description, start_time, end_time } =
        updateEventRundownDto;
      if (start_time && start_time > (end_time || findRundown.end_time)) {
        return {
          success: false,
          message: `Start time can be greater than end time`,
        };
      }

      if (end_time && end_time < (start_time || findRundown.start_time)) {
        return {
          success: false,
          message: `End time can be less than start time`,
        };
      }

      const updateRundown = await this.prisma.event_rundown.update({
        where: { uuid: id },
        data: {
          title: title ?? findRundown.title,
          description: description ?? findRundown.description,
          start_time: start_time ?? findRundown.start_time,
          end_time: end_time ?? findRundown.end_time,
          updated_by: userId,
        },
      });

      return {
        success: true,
        message: `Rundown has updated successfully`,
        data: updateRundown,
      };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async remove(id: string, userId: string, role?: UserRole) {
    try {
      const findRundown = await this.prisma.event_rundown.findFirst({
        where: { uuid: id },
      });
      if (!findRundown) {
        return {
          success: false,
          message: `Rundown doesn't exists`,
        };
      }

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: findRundown.event_id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });
      if (!findEventUser && role !== `SUPERADMIN`) {
        throw new ForbiddenException(`Sorry, you can't remove this rundown`);
      }

      const dropRundown = await this.prisma.event_rundown.delete({
        where: { uuid: id },
      });
      return {
        success: true,
        message: `Rundown has removed successfully`,
        data: dropRundown,
      };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async addSpeaker(
    addSpeakerEventDto: AddSpeakerRundownDto,
    rundown_id: string,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const findRundown = await this.prisma.event_rundown.findFirst({
        where: { uuid: rundown_id },
        include: { event: true },
      });
      if (!findRundown) {
        throw new NotFoundException(`Rundown doesn't exists`);
      }

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: findRundown.event_id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });
      if (!findEventUser && role !== `SUPERADMIN`) {
        throw new ForbiddenException(
          `Sorry, you can't add speaker for ${findRundown.event.name}`,
        );
      }
      const { speaker_id } = addSpeakerEventDto;
      const findSpeaker = await this.prisma.event_speakers.findFirst({
        where: { uuid: speaker_id },
      });
      if (!findSpeaker) {
        throw new NotFoundException(`Speaker doesn't exists`);
      }

      const findExistingSpeaker =
        await this.prisma.event_rundown_speaker.findFirst({
          where: { speaker_id, rundown_id },
        });
      if (findExistingSpeaker) {
        throw new ConflictException(`Speaker already set at this rundown`);
      }

      const newRundownSpeaker = await this.prisma.event_rundown_speaker.create({
        data: {
          speaker_id,
          rundown_id,
          created_by: userId,
          updated_by: userId,
        },
      });

      return {
        success: true,
        message: `New speaker for this rundown has created`,
        data: newRundownSpeaker,
      };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async dropRundownSpeaker(id: string, userId: string, role?: UserRole) {
    try {
      const findRundownSpeaker =
        await this.prisma.event_rundown_speaker.findFirst({
          where: { uuid: id },
          include: { event_rundown: true },
        });
      if (!findRundownSpeaker) {
        throw new NotFoundException(`Data doesn't exists`);
      }

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: findRundownSpeaker.event_rundown.event_id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });
      if (!findEventUser && role !== `SUPERADMIN`) {
        throw new ForbiddenException(
          `Sorry, you can't remove speaker this rundown`,
        );
      }

      const dropRundownSpeaker = await this.prisma.event_rundown_speaker.delete(
        { where: { uuid: id } },
      );
      return {
        success: true,
        message: `Speaker for this rundown has removed`,
        data: dropRundownSpeaker,
      };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }
}
