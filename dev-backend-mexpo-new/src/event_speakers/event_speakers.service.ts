import {
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventSpeakerDto } from './dto/create-event_speaker.dto';
import { UpdateEventSpeakerDto } from './dto/update-event_speaker.dto';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { ConfigService } from '@nestjs/config';
import { QueryEventSpeakerDto } from './dto/query-event-speaker.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class EventSpeakersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}
  async create(
    event_id: string,
    createEventSpeakerDto: CreateEventSpeakerDto,
    userId: string,
    file?: Express.Multer.File,
    role?: UserRole,
  ) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) {
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
          `Sorry, you can't add speaker for ${findEvent.name}`,
        );
      }

      const { name, bio } = createEventSpeakerDto;
      let photo = ``;
      if (file) {
        const filename = `${new Date().getTime().toString()}-${file.originalname}`;
        photo = `${this.configService.get<string>(`MINIO_ENDPOINT`)}/expo-project-speaker/${filename}`;
        await this.s3Service.upload(
          `expo-project-speaker`,
          filename,
          file.buffer,
          file.mimetype,
        );
      }

      const newSpeaker = await this.prisma.event_speakers.create({
        data: {
          name,
          bio,
          photo,
          event_id,
          created_by: userId,
          updated_by: userId,
        },
      });

      return {
        success: true,
        message: `New Speaker at ${findEvent.name} has created`,
        data: newSpeaker,
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
    query: QueryEventSpeakerDto,
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
          `Sorry, you can't get speaker for ${findEvent.name}`,
        );
      }

      const { page, quantity, search } = query;
      const take = quantity || undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const counts = await this.prisma.event_speakers.count({
        where: {
          event_id,
          OR: [
            { name: { contains: search ?? `` } },
            { bio: { contains: search ?? `` } },
          ],
        },
      });

      const speakers = await this.prisma.event_speakers.findMany({
        skip,
        take,
        orderBy: { name: `asc` },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
        },
        where: {
          event_id,
          OR: [
            { name: { contains: search ?? `` } },
            { bio: { contains: search ?? `` } },
          ],
        },
      });

      return {
        success: true,
        message: `Speaker for ${findEvent.name} has retrieved`,
        data: speakers,
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
      const findSpeaker = await this.prisma.event_speakers.findFirst({
        where: { uuid: id },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
          event: true,
        },
      });
      if (!findSpeaker) {
        throw new NotFoundException(`Spekaer doesn't exists`);
      }

      return {
        success: true,
        message: `Speaker has retrieved`,
        data: findSpeaker,
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
    updateEventSpeakerDto: UpdateEventSpeakerDto,
    userId: string,
    file?: Express.Multer.File,
    role?: UserRole,
  ) {
    try {
      const findSpeaker = await this.prisma.event_speakers.findFirst({
        where: { uuid: id },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
          event: true,
        },
      });

      if (!findSpeaker) {
        throw new NotFoundException(`Speaker doesn't exists`);
      }

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: findSpeaker.event_id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });
      if (!findEventUser && role !== `SUPERADMIN`) {
        throw new ForbiddenException(
          `Sorry, you can't edit speaker for ${findSpeaker.event.name}`,
        );
      }

      let fileUrl = findSpeaker.photo;
      if (file) {
        const oldFileUrl = findSpeaker.photo;
        if (oldFileUrl) {
          const oldFilename = oldFileUrl.split('/').pop() || '';
          await this.s3Service.delete(`expo-project-speaker`, oldFilename);
        }
        const filename = `${new Date().getTime().toString()}-${file.originalname}`;
        fileUrl = `${this.configService.get<string>(`MINIO_ENDPOINT`)}/expo-project-speaker/${filename}`;
        await this.s3Service.upload(
          `expo-project-speaker`,
          filename,
          file.buffer,
          file.mimetype,
        );
      }
      const { name, bio } = updateEventSpeakerDto;
      const updateSpeaker = await this.prisma.event_speakers.update({
        where: { uuid: id },
        data: {
          name: name ?? findSpeaker.name,
          bio: bio ?? findSpeaker.bio,
          photo: fileUrl,
          updated_by: userId,
        },
      });

      return {
        success: true,
        message: `Speaker has been updated`,
        data: updateSpeaker,
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
      const findSpeaker = await this.prisma.event_speakers.findFirst({
        where: { uuid: id },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
          event: true,
        },
      });

      if (!findSpeaker) {
        throw new NotFoundException(`Speaker doesn't exists`);
      }

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: findSpeaker.event_id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });
      if (!findEventUser && role !== `SUPERADMIN`) {
        throw new ForbiddenException(
          `Sorry, you can't remove speaker for ${findSpeaker.event.name}`,
        );
      }
      const oldFileUrl = findSpeaker.photo;
      if (oldFileUrl) {
        const oldFilename = oldFileUrl.split('/').pop() || '';
        await this.s3Service.delete(`expo-project-speaker`, oldFilename);
      }

      const dropSpeaker = await this.prisma.event_speakers.delete({
        where: { uuid: id },
      });

      return {
        success: true,
        message: `Speaker has been removed`,
        data: dropSpeaker,
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
