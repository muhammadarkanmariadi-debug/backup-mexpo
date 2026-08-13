import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventUserDto } from './dto/create-event-user.dto';
import { UpdateEventUserDto } from './dto/update-event-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { EventRole } from '@prisma/client';
import { QueryEventUserDto } from './dto/query-event-user.dto';
import { buildOrderBy } from '../helper/sort';
import { Prisma } from '@prisma/client';

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
  constructor(private readonly prisma: PrismaService) {}
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

      const counts = await this.prisma.user_event_roles.count({
        where: {
          event_id,
          status,
          role,
          OR: [
            {
              user: { full_name: { contains: search ?? `` } },
            },
          ],
        },
      });

      const users = await this.prisma.user_event_roles.findMany({
        take,
        skip,
        orderBy: buildOrderBy(
          query.sort_by,
          query.sort_dir,
          EVENT_USER_SORTABLE,
          { user: { full_name: `asc` } },
        ) as Prisma.user_event_rolesOrderByWithRelationInput,
        where: {
          event_id,
          status,
          role,
          OR: [
            {
              user: { full_name: { contains: search ?? `` } },
            },
          ],
        },
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
}
