import {
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { CreateEventSponsorDto } from './dto/create-event-sponsor.dto';
import { UpdateEventSponsorDto } from './dto/update-event-sponsor.dto';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { ConfigService } from '@nestjs/config';
import { QueryEventSponsorDto } from './dto/query-event-sponsor.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class EventSponsorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}
  async create(
    event_id: string,
    createEventSponsorDto: CreateEventSponsorDto,
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
          `Sorry, you can't add sponsor for ${findEvent.name}`,
        );
      }

      const { level, name } = createEventSponsorDto;
      let photo: string = ``;
      if (file) {
        const filename = `${new Date().getTime().toString()}-${file.originalname}`;
        photo = `${this.configService.get<string>(`MINIO_ENDPOINT`)}/expo-project-sponsor/${filename}`;
        await this.s3Service.upload(
          `expo-project-sponsor`,
          filename,
          file.buffer,
          file.mimetype,
        );
      }

      const newSponsor = await this.prisma.event_sponsors.create({
        data: {
          name,
          level,
          logo: photo,
          created_by: userId,
          updated_by: userId,
          event_id,
        },
      });

      return {
        success: true,
        message: `New sponsor for ${findEvent.name} has been created`,
        data: newSponsor,
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
    @Query() query: QueryEventSponsorDto,
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
          `Sorry, you can't fetch sponsor for ${findEvent.name}`,
        );
      }

      const { page, quantity, search } = query;
      const take = quantity || undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const counts = await this.prisma.event_sponsors.count({
        where: {
          event_id,
          OR: [{ name: { contains: search ?? `` } }],
        },
      });

      const sponsors = await this.prisma.event_sponsors.findMany({
        skip,
        take,
        orderBy: { name: `asc` },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
        },
        where: {
          event_id,
          OR: [{ name: { contains: search ?? `` } }],
        },
      });

      return {
        success: true,
        message: `Sponsor for ${findEvent.name} has retrieved`,
        data: sponsors,
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
      const findSponsor = await this.prisma.event_sponsors.findFirst({
        where: { uuid: id },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
          event: true,
        },
      });
      if (!findSponsor) {
        throw new NotFoundException(`Sponsor doesn't exists`);
      }

      return {
        success: true,
        message: `Sponsor has retrieved`,
        data: findSponsor,
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
    updateEventSponsorDto: UpdateEventSponsorDto,
    userId: string,
    file?: Express.Multer.File,
    role?: UserRole,
  ) {
    try {
      const findSponsor = await this.prisma.event_sponsors.findFirst({
        where: { uuid: id },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
          event: true,
        },
      });

      if (!findSponsor) {
        throw new NotFoundException(`Sponsor doesn't exists`);
      }

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: findSponsor.event_id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
        include: { event: true },
      });
      if (!findEventUser && role !== `SUPERADMIN`) {
        throw new ForbiddenException(
          `Sorry, you can't edit sponsor for ${findSponsor.event.name}`,
        );
      }

      let fileUrl = findSponsor.logo;
      if (file) {
        const oldFileUrl = findSponsor.logo;
        if (oldFileUrl) {
          const oldFilename = oldFileUrl.split('/').pop() || '';
          await this.s3Service.delete(`expo-project-sponsor`, oldFilename);
        }
        const filename = `${new Date().getTime().toString()}-${file.originalname}`;
        fileUrl = `${this.configService.get<string>(`MINIO_ENDPOINT`)}/expo-project-sponsor/${filename}`;
        await this.s3Service.upload(
          `expo-project-sponsor`,
          filename,
          file.buffer,
          file.mimetype,
        );
      }
      const { name, level } = updateEventSponsorDto;
      const updateSponsor = await this.prisma.event_sponsors.update({
        where: { uuid: id },
        data: {
          name: name ?? findSponsor.name,
          level: level ?? findSponsor.level,
          logo: fileUrl,
          updated_by: userId,
        },
      });

      return {
        success: true,
        message: `Sponsor has been updated`,
        data: updateSponsor,
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
      const findSponsor = await this.prisma.event_sponsors.findFirst({
        where: { uuid: id },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
          event: true,
        },
      });

      if (!findSponsor) {
        throw new NotFoundException(`Sponsor doesn't exists`);
      }

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: findSponsor.event_id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
        include: { event: true },
      });
      if (!findEventUser && role !== `SUPERADMIN`) {
        throw new ForbiddenException(
          `Sorry, you can't remove sponsor for ${findSponsor.event.name}`,
        );
      }

      const oldFileUrl = findSponsor.logo;
      if (oldFileUrl) {
        const oldFilename = oldFileUrl.split('/').pop() || '';
        await this.s3Service.delete(`expo-project-sponsor`, oldFilename);
      }

      const dropSponsor = await this.prisma.event_sponsors.delete({
        where: { uuid: id },
      });
      return {
        success: true,
        message: `Sponsor has been removed`,
        data: dropSponsor,
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
