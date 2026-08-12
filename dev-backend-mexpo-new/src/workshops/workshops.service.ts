import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { PrismaService } from '../prisma/prisma.service';
import { QueryWorkshopDto } from './dto/query-workshop.dto';
import { buildOrderBy } from '../helper/sort';
import { isUuid, uniqueSlug } from '../helper/slug';
import { AddSpeakerWorkshopDto } from './dto/add-speaker-workshop.dto';
import { UserRole } from '@prisma/client';
import { assertEventFeature } from '../events/event-features';
import { Prisma } from '@prisma/client';

const WORKSHOP_SORTABLE: Record<
  string,
  (dir: 'asc' | 'desc') => Prisma.workshopsOrderByWithRelationInput
> = {
  title: (d) => ({ title: d }),
  start_time: (d) => ({ start_time: d }),
  created_at: (d) => ({ created_at: d }),
};

@Injectable()
export class WorkshopsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(
    event_id: string,
    createWorkshopDto: CreateWorkshopDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) {
        throw new NotFoundException(`Event doesn't exists`);
      }
      // A2 — seminar feature must be enabled for this event.
      await assertEventFeature(this.prisma, event_id, 'seminar');

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });
      if (!findEventUser && role !== `SUPERADMIN`) {
        throw new ForbiddenException(
          `Sorry, you can't add workshop for ${findEvent.name}`,
        );
      }

      const {
        description,
        title,
        end_time,
        start_time,
        location,
        is_public,
        quota,
      } = createWorkshopDto;
      if (end_time.getTime() < start_time.getTime()) {
        throw new BadRequestException(
          `End time should not less than start time`,
        );
      }

      if (start_time.getTime() > end_time.getTime()) {
        throw new BadRequestException(
          `Start time should not greater than end time`,
        );
      }

      const createWorkshop = await this.prisma.workshops.create({
        data: {
          event_id,
          slug: await uniqueSlug(title ?? `workshop`, (s) =>
            this.prisma.workshops
              .findFirst({ where: { slug: s } })
              .then(Boolean),
          ),
          title,
          description,
          start_time,
          end_time,
          location,
          is_public,
          quota,
          created_by: userId,
          updated_by: userId,
        },
      });

      return {
        success: true,
        message: `Workshop has been created`,
        data: createWorkshop,
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
    query: QueryWorkshopDto,
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
          `Sorry, you can't get workshop of ${findEvent.name}`,
        );
      }
      const { page, quantity, search } = query;
      const take = quantity || undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const counts = await this.prisma.workshops.count({
        where: {
          event_id,
          OR: [
            { title: { contains: search ?? `` } },
            { description: { contains: search ?? `` } },
            { location: { contains: search ?? `` } },
          ],
        },
      });

      const workshops = await this.prisma.workshops.findMany({
        skip,
        take,
        orderBy: buildOrderBy(
          query.sort_by,
          query.sort_dir,
          WORKSHOP_SORTABLE,
          { title: `asc` },
        ) as Prisma.workshopsOrderByWithRelationInput,
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
          workshopSpeakers: { include: { event_speaker: true } },
        },
        where: {
          event_id,
          OR: [
            { title: { contains: search ?? `` } },
            { description: { contains: search ?? `` } },
            { location: { contains: search ?? `` } },
          ],
        },
      });

      return {
        success: true,
        message: `Workshop has retrieved`,
        data: workshops,
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

  async findOne(id: string) {
    try {
      const findWorkshop = await this.prisma.workshops.findFirst({
        where: isUuid(id) ? { uuid: id } : { slug: id },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
          workshopSpeakers: { include: { event_speaker: true } },
        },
      });

      if (!findWorkshop) {
        throw new NotFoundException(`Workshop doesn't exists`);
      }

      return {
        success: true,
        message: `Workshop has exists`,
        data: findWorkshop,
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
    updateWorkshopDto: UpdateWorkshopDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const findWorkshop = await this.prisma.workshops.findFirst({
        where: {
          uuid: id,
        },
        include: { event: true },
      });

      if (!findWorkshop) {
        throw new NotFoundException(`Workshop doesn't exists`);
      }

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: findWorkshop.event_id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });
      if (!findEventUser && role !== `SUPERADMIN`) {
        throw new ForbiddenException(
          `Sorry, you can't edit workshop for ${findWorkshop.event.name}`,
        );
      }

      const {
        description,
        title,
        location,
        start_time,
        end_time,
        quota,
        is_public,
      } = updateWorkshopDto;
      if (start_time && start_time > (end_time || findWorkshop.end_time)) {
        throw new BadRequestException(
          `Start time can be greater than end time`,
        );
      }

      if (end_time && end_time < (start_time || findWorkshop.start_time)) {
        throw new BadRequestException(`End time can be less than start time`);
      }

      const updateWorkshop = await this.prisma.workshops.update({
        where: { uuid: id },
        data: {
          title: title ?? findWorkshop.title,
          ...(title !== undefined && title !== findWorkshop.title
            ? {
                slug: await uniqueSlug(title, (s) =>
                  this.prisma.workshops
                    .findFirst({ where: { slug: s } })
                    .then(Boolean),
                ),
              }
            : {}),
          description: description ?? findWorkshop.description,
          location: location ?? findWorkshop.location,
          start_time: start_time ?? findWorkshop.start_time,
          end_time: end_time ?? findWorkshop.end_time,
          quota: quota ?? findWorkshop.quota,
          is_public: is_public ?? findWorkshop.is_public,
          updated_by: userId,
        },
      });

      return {
        success: true,
        message: `Workshop has been updated`,
        data: updateWorkshop,
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
      const findWorkshop = await this.prisma.workshops.findFirst({
        where: {
          uuid: id,
        },
      });

      if (!findWorkshop) {
        throw new NotFoundException(`Workshop doesn't exists`);
      }

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: findWorkshop.event_id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });
      if (!findEventUser && role !== `SUPERADMIN`) {
        throw new ForbiddenException(`Sorry, you can't remove this workshop`);
      }

      const dropWorkshop = await this.prisma.workshops.delete({
        where: { uuid: id },
      });
      return {
        success: true,
        message: `Workshop has been removed`,
        data: dropWorkshop,
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
    workshop_id: string,
    addSpeakerWorkshopDto: AddSpeakerWorkshopDto,
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

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: findWorkshop.event_id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });
      if (!findEventUser && role !== `SUPERADMIN`) {
        throw new ForbiddenException(
          `Sorry, you can't add speaker of this workshop`,
        );
      }

      const { speaker_id } = addSpeakerWorkshopDto;
      const findSpeaker = await this.prisma.event_speakers.findFirst({
        where: { uuid: speaker_id },
      });
      if (!findSpeaker) {
        return {
          success: false,
          message: `Speaker doesn't exists`,
        };
      }

      const findExistingSpeaker = await this.prisma.workshop_speaker.findFirst({
        where: { workshop_id, speaker_id },
      });

      if (findExistingSpeaker) {
        throw new ConflictException(`Speaker already set at this workshop`);
      }

      const newWorkshopSpeaker = await this.prisma.workshop_speaker.create({
        data: {
          workshop_id,
          speaker_id,
          created_by: userId,
          updated_by: userId,
        },
      });

      return {
        success: true,
        message: `Speaker has been set at this workshop`,
        data: newWorkshopSpeaker,
      };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async removeSpeaker(id: string, userId: string, role?: UserRole) {
    try {
      const findWorkshopSpeaker = await this.prisma.workshop_speaker.findFirst({
        where: {
          uuid: id,
        },
        include: { workshop: true },
      });

      if (!findWorkshopSpeaker) {
        throw new NotFoundException(`Workshop Speaker doesn't exists`);
      }

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: findWorkshopSpeaker.workshop.event_id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });
      if (!findEventUser && role !== `SUPERADMIN`) {
        throw new ForbiddenException(
          `Sorry, you can't remove speaker of this workshop`,
        );
      }

      const dropWorkshopSpeaker = await this.prisma.workshop_speaker.delete({
        where: { uuid: id },
      });
      return {
        success: true,
        message: `Workshop Speaker has been removed`,
        data: dropWorkshopSpeaker,
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
