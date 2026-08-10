import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, UserRole } from '@prisma/client';
import {
  CreateRegistrationFieldDto,
  UpdateRegistrationFieldDto,
} from './dto/registration-field.dto';
import { QueryRegistrationFieldDto } from './dto/query-registration-field.dto';

@Injectable()
export class RegistrationFieldsService {
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
        `You are not allowed to manage registration fields for this event`,
      );
    }
  }

  async create(
    event_id: string,
    dto: CreateRegistrationFieldDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const event = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!event) throw new NotFoundException(`Event doesn't exists`);
      await this.assertManager(event_id, userId, role);

      const existing = await this.prisma.event_registration_fields.findFirst({
        where: { event_id, field_key: dto.field_key },
      });
      if (existing) {
        throw new ConflictException(
          `Field key "${dto.field_key}" already exists for this event`,
        );
      }

      const field = await this.prisma.event_registration_fields.create({
        data: {
          event_id,
          field_key: dto.field_key,
          label: dto.label,
          type: dto.type,
          required: dto.required ?? false,
          options: dto.options ? (dto.options as unknown as object) : undefined,
          condition: dto.condition as unknown as
            | Prisma.InputJsonValue
            | undefined,
          position: dto.position ?? 0,
          created_by: userId,
          updated_by: userId,
        },
      });
      return {
        success: true,
        message: `Registration field created`,
        data: field,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async findAll(
    event_id: string,
    query: QueryRegistrationFieldDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const event = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!event) throw new NotFoundException(`Event doesn't exists`);
      await this.assertManager(event_id, userId, role);

      const { page, quantity } = query;
      const take = quantity ?? undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const counts = await this.prisma.event_registration_fields.count({
        where: { event_id },
      });
      const data = await this.prisma.event_registration_fields.findMany({
        take,
        skip,
        orderBy: [{ position: `asc` }, { created_at: `asc` }],
        where: { event_id },
      });
      return {
        success: true,
        message: `Registration fields retrieved`,
        data,
        meta: { page, quantity, counts },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async update(
    id: string,
    dto: UpdateRegistrationFieldDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const field = await this.prisma.event_registration_fields.findFirst({
        where: { uuid: id },
      });
      if (!field)
        throw new NotFoundException(`Registration field doesn't exists`);
      await this.assertManager(field.event_id, userId, role);

      if (dto.field_key && dto.field_key !== field.field_key) {
        const existing = await this.prisma.event_registration_fields.findFirst({
          where: { event_id: field.event_id, field_key: dto.field_key },
        });
        if (existing) {
          throw new ConflictException(
            `Field key "${dto.field_key}" already exists for this event`,
          );
        }
      }

      const updateData: Prisma.event_registration_fieldsUncheckedUpdateInput = {
        field_key: dto.field_key ?? field.field_key,
        label: dto.label ?? field.label,
        type: dto.type ?? field.type,
        required: dto.required ?? field.required,
        position: dto.position ?? field.position,
        updated_by: userId,
      };
      // Only touch options when the caller actually provides them.
      if (dto.options !== undefined) {
        updateData.options = dto.options as unknown as Prisma.InputJsonValue;
      }
      // Only touch condition when the caller actually provides it.
      if (dto.condition !== undefined) {
        updateData.condition =
          dto.condition as unknown as Prisma.InputJsonValue;
      }
      const updated = await this.prisma.event_registration_fields.update({
        where: { uuid: id },
        data: updateData,
      });
      return {
        success: true,
        message: `Registration field updated`,
        data: updated,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async remove(id: string, userId: string, role?: UserRole) {
    try {
      const field = await this.prisma.event_registration_fields.findFirst({
        where: { uuid: id },
      });
      if (!field)
        throw new NotFoundException(`Registration field doesn't exists`);
      await this.assertManager(field.event_id, userId, role);

      const removed = await this.prisma.event_registration_fields.delete({
        where: { uuid: id },
      });
      return {
        success: true,
        message: `Registration field removed`,
        data: removed,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }
}
