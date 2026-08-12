import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../s3/s3.service';
import { InviteTenantDto } from './dto/invite-tenant.dto';
import { BcryptService } from '../bcrypt/bcrypt.service';
import { MailService } from '../mail/mail.service';
import { QueryTenantDto } from './dto/query-tenant.dto';
import { VerifyTenantDto } from './dto/verify-tenant.dto';
import { UpdateTenantMemberDto } from './dto/update-tenant-member.dto';
import { UserRole } from '@prisma/client';
import { assertEventFeature } from '../events/event-features';
import { isUuid, uniqueSlug } from '../helper/slug';

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
    private readonly bcrypt: BcryptService,
    private readonly mailer: MailService,
  ) {}

  /**
   * A13 — who may manage a tenant's team/verification:
   * SUPERADMIN, event OWNER/COMMITTEE, or the tenant's OWNER member.
   */
  private async assertTenantManager(
    tenant_id: string,
    userId: string,
    role?: UserRole,
  ) {
    if (role === `SUPERADMIN`) return;
    const tenant = await this.prisma.tenants.findFirst({
      where: { uuid: tenant_id },
    });
    if (!tenant) throw new NotFoundException(`Tenant doesn't exists`);

    const eventManager = await this.prisma.user_event_roles.findFirst({
      where: {
        event_id: tenant.event_id,
        user_id: userId,
        status: `APPROVED`,
        role: { in: [`OWNER`, `COMMITTEE`] },
      },
    });
    if (eventManager) return;

    const ownerMember = await this.prisma.tenant_members.findFirst({
      where: { tenant_id, user_id: userId, status: `APPROVED`, role: `OWNER` },
    });
    if (ownerMember) return;

    throw new ForbiddenException(`You are not allowed to manage this tenant`);
  }

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

  async create(
    event_id: string,
    createTenantDto: CreateTenantDto,
    userId: string,
    file?: Express.Multer.File,
    role?: UserRole,
  ) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) throw new NotFoundException(`Event doesn't exists`);
      // A2 — tenant feature must be enabled for this event.
      await assertEventFeature(this.prisma, event_id, 'tenant');

      const findExisitingTenant = await this.prisma.user_event_roles.findFirst({
        where: {
          user_id: userId,
          role: `TENANT`,
          // status: `APPROVED`,
          event_id,
        },
      });
      if (!findExisitingTenant && role != `SUPERADMIN`) {
        throw new ForbiddenException(`You are not allow add tenant`);
      }

      const { description, name, phone, website, email, category_id } =
        createTenantDto;
      const findCategory = await this.prisma.tenant_categories.findFirst({
        where: { uuid: category_id },
      });
      if (!findCategory)
        throw new NotFoundException(`Tenant category doesn't exists`);
      let logo: string = ``;
      if (file) {
        const filename = `${new Date().getTime().toString()}-${file.originalname}`;
        logo = `${this.configService.get<string>(`MINIO_ENDPOINT`)}/expo-project-tenants/${filename}`;
        await this.s3Service.upload(
          `expo-project-tenants`,
          filename,
          file.buffer,
          file.mimetype,
        );
      }

      const newTenant = await this.prisma.tenants.create({
        data: {
          event_id,
          slug: await uniqueSlug(name ?? `tenant`, (s) =>
            this.prisma.tenants.findFirst({ where: { slug: s } }).then(Boolean),
          ),
          name,
          description,
          website,
          phone,
          logo,
          email,
          category_id,
          created_by: userId,
          updated_by: userId,
          tenantMembers: {
            create: {
              user_id: userId,
              created_by: userId,
              updated_by: userId,
              status: `APPROVED`,
              role: `OWNER`,
            },
          },
        },
      });

      return {
        success: true,
        message: `New Tenant registered`,
        data: newTenant,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  /** not recommended */
  async askToBeTenantMember(tenant_id: string, userId: string) {
    try {
      const findTenant = await this.prisma.tenants.findFirst({
        where: { uuid: tenant_id },
      });
      if (!findTenant) throw new NotFoundException(`Tenant doesn't exists`);

      const findEventRoleForTenant =
        await this.prisma.user_event_roles.findFirst({
          where: {
            event_id: findTenant.event_id,
            user_id: userId,
            role: `TENANT`,
            status: `APPROVED`,
          },
        });

      const findExistingMember = await this.prisma.tenant_members.findFirst({
        where: { tenant_id, user_id: userId },
      });

      if (findExistingMember)
        throw new ConflictException(
          `You already as a tenant at ${findTenant.name}`,
        );

      if (!findEventRoleForTenant) {
        await this.prisma.user_event_roles.create({
          data: {
            event_id: findTenant.event_id,
            user_id: userId,
            role: `TENANT`,
            created_by: userId,
            updated_by: userId,
            status: `PENDING`,
          },
        });
      }

      const newTenantMember = await this.prisma.tenant_members.create({
        data: {
          user_id: userId,
          tenant_id,
          status: `PENDING`,
          created_by: userId,
          updated_by: userId,
        },
      });

      return {
        success: true,
        message: `Ask to be a member of tenant has been sent`,
        data: newTenantMember,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async inviteTenantMember(
    tenant_id: string,
    invitationDto: InviteTenantDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const findTenant = await this.prisma.tenants.findFirst({
        where: { uuid: tenant_id },
        include: { event: true },
      });
      if (!findTenant) throw new NotFoundException(`Tenant doesn't exists`);
      // A2 — tenant feature must be enabled for this event.
      await assertEventFeature(this.prisma, findTenant.event_id, 'tenant');

      // A13 — only an OWNER tenant member (or event committee/super admin) may invite staff.
      const findInvitationCreator = await this.prisma.tenant_members.findFirst({
        where: {
          user_id: userId,
          tenant_id,
          status: `APPROVED`,
          role: `OWNER`,
        },
      });

      const findEventCommittee = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: findTenant.event_id,
          status: `APPROVED`,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });

      if (
        !findInvitationCreator &&
        role !== `SUPERADMIN` &&
        !findEventCommittee
      ) {
        throw new ForbiddenException(
          `You are not allow to invite member of tenant`,
        );
      }

      const { email } = invitationDto;
      const findUser = await this.prisma.users.findFirst({
        where: { email },
      });

      if (!findUser) {
        /** create new user if not exists */
        const defaultPassword = this.bcrypt.createRandomPassword();
        const newUser = await this.prisma.users.create({
          data: {
            email,
            full_name: `Member of Tenant ${findTenant.name}`,
            password: await this.bcrypt.hashPassword(defaultPassword),
            is_active: true,
            role: `USER`,
            userEventRoles: {
              create: {
                event_id: findTenant.event_id,
                role: `TENANT`,
                status: `APPROVED`,
                created_by: userId,
                updated_by: userId,
              },
            },
            tenantMembers: {
              create: {
                tenant_id,
                status: `APPROVED`,
                role: `STAFF`,
                created_by: userId,
                updated_by: userId,
              },
            },
          },
        });

        this.mailer
          .sendMail(
            newUser.email,
            'Welcome to Expo Website - Account Information',
            this.newAccountInfoEmailTemplate(
              newUser.full_name,
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

        return {
          success: true,
          message: `New Invitation User has created`,
          data: newUser,
        };
      }

      /** if existing user */
      const findUserRoleMember = await this.prisma.user_event_roles.findFirst({
        where: {
          user_id: findUser.uuid,
          event_id: findTenant.event_id,
        },
      });
      if (findUserRoleMember) {
        if (findUserRoleMember.role !== `TENANT`) {
          throw new ConflictException(
            `This email already registered as ${findUserRoleMember.role}`,
          );
        }
        await this.prisma.user_event_roles.update({
          where: { uuid: findUserRoleMember.uuid },
          data: { status: `APPROVED`, updated_by: userId },
        });
      } else {
        await this.prisma.user_event_roles.create({
          data: {
            event_id: findTenant.event_id,
            user_id: findUser.uuid,
            role: `TENANT`,
            status: `APPROVED`,
            created_by: userId,
            updated_by: userId,
          },
        });
      }
      const findExistingMember = await this.prisma.tenant_members.findFirst({
        where: { tenant_id, user_id: findUser.uuid },
      });

      if (findExistingMember)
        throw new ConflictException(
          `This email already as a tenant at ${findTenant.name}`,
        );
      const newTenantMember = await this.prisma.tenant_members.create({
        data: {
          user_id: findUser.uuid,
          tenant_id,
          status: `APPROVED`,
          created_by: userId,
          updated_by: userId,
        },
      });

      return {
        success: true,
        message: `Invitation to be a member of tenant has been created`,
        data: newTenantMember,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async findAll(
    event_id: string,
    query: QueryTenantDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) throw new NotFoundException(`Event doesn't exists`);

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });

      if (!findEventUser && role != `SUPERADMIN`) {
        throw new ForbiddenException(
          `Sorry, you can't view all tenants of ${findEvent.name}`,
        );
      }

      const { page, quantity, search } = query;

      const take = quantity || undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const counts = await this.prisma.tenants.count({
        where: {
          event_id,
          OR: [
            { name: { contains: search ?? `` } },
            { description: { contains: search ?? `` } },
            { website: { contains: search ?? `` } },
          ],
        },
      });

      const tenants = await this.prisma.tenants.findMany({
        take,
        skip,
        orderBy: { name: `asc` },
        where: {
          event_id,
          OR: [
            { name: { contains: search ?? `` } },
            { description: { contains: search ?? `` } },
            { website: { contains: search ?? `` } },
          ],
        },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
          category: true,
        },
      });

      return {
        success: true,
        message: `Tenants has retrieved`,
        data: tenants,
        meta: { page, quantity, counts },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async findAllMyTenant(
    event_id: string,
    query: QueryTenantDto,
    userId: string,
  ) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) throw new NotFoundException(`Event doesn't exists`);

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id,
          user_id: userId,
          role: `TENANT`,
        },
      });

      if (!findEventUser) {
        throw new ForbiddenException(`Sorry, you have not role: TENANT`);
      }

      const { page, quantity, search } = query;

      const take = quantity || undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const counts = await this.prisma.tenants.count({
        where: {
          event_id,
          tenantMembers: { some: { user_id: userId, status: `APPROVED` } },
          OR: [
            { name: { contains: search ?? `` } },
            { description: { contains: search ?? `` } },
            { website: { contains: search ?? `` } },
          ],
        },
      });

      const tenants = await this.prisma.tenants.findMany({
        take,
        skip,
        orderBy: { name: `asc` },
        where: {
          event_id,
          tenantMembers: { some: { user_id: userId, status: `APPROVED` } },
          OR: [
            { name: { contains: search ?? `` } },
            { description: { contains: search ?? `` } },
            { website: { contains: search ?? `` } },
          ],
        },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
          category: true,
        },
      });

      return {
        success: true,
        message: `Tenants has retrieved`,
        data: tenants,
        meta: { page, quantity, counts },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async findAllMember(tenant_id: string, query: QueryTenantDto) {
    try {
      const findTenant = await this.prisma.tenants.findFirst({
        where: { uuid: tenant_id },
      });
      if (!findTenant) throw new NotFoundException(`Tenant doesn't exists`);

      const { page, quantity, search } = query;

      const take = quantity || undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const counts = await this.prisma.tenant_members.count({
        where: {
          tenant_id,
          OR: [{ user: { full_name: { contains: search ?? '' } } }],
        },
      });

      const tenants = await this.prisma.tenant_members.findMany({
        take,
        skip,
        orderBy: { user: { full_name: `asc` } },
        where: {
          tenant_id,
          OR: [{ user: { full_name: { contains: search ?? '' } } }],
        },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
          user: true,
        },
      });

      return {
        success: true,
        message: `Tenant Members has retrieved`,
        data: tenants,
        meta: { page, quantity, counts },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async findOne(tenant_id: string) {
    try {
      const findTenant = await this.prisma.tenants.findFirst({
        where: isUuid(tenant_id) ? { uuid: tenant_id } : { slug: tenant_id },
        include: {
          editor: { select: { full_name: true } },
          creator: { select: { full_name: true } },
          event: true,
          tenantMembers: { include: { user: true } },
          tenantProducts: true,
          tenantTransactions: true,
          category: true,
        },
      });
      if (!findTenant) throw new NotFoundException(`Tenant doesn't exists`);
      return {
        success: true,
        message: `Tenant was found`,
        data: findTenant,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async update(
    id: string,
    updateTenantDto: UpdateTenantDto,
    userId: string,
    file?: Express.Multer.File,
  ) {
    try {
      const findTenant = await this.prisma.tenants.findFirst({
        where: { uuid: id },
      });
      if (!findTenant) throw new NotFoundException(`Tenant doesn't exists`);

      const {
        description,
        email,
        website,
        name,
        phone,
        booth_number,
        category_id,
      } = updateTenantDto;
      if (category_id) {
        const findCategory = await this.prisma.tenant_categories.findFirst({
          where: { uuid: category_id },
        });
        if (!findCategory)
          throw new NotFoundException(`Tenant category doesn't exists`);
      }
      let fileUrl = findTenant.logo;
      if (file) {
        const oldFileUrl = findTenant.logo;
        if (oldFileUrl) {
          const oldFilename = oldFileUrl.split('/').pop() || '';
          await this.s3Service.delete(`expo-project-tenants`, oldFilename);
        }
        const filename = `${new Date().getTime().toString()}-${file.originalname}`;
        fileUrl = `${this.configService.get<string>(`MINIO_ENDPOINT`)}/expo-project-tenants/${filename}`;
        await this.s3Service.upload(
          `expo-project-tenants`,
          filename,
          file.buffer,
          file.mimetype,
        );
      }

      const updatedTenant = await this.prisma.tenants.update({
        where: { uuid: id },
        data: {
          name: name ?? findTenant.name,
          ...(name !== undefined && name !== findTenant.name
            ? {
                slug: await uniqueSlug(name, (s) =>
                  this.prisma.tenants
                    .findFirst({ where: { slug: s } })
                    .then(Boolean),
                ),
              }
            : {}),
          description: description ?? findTenant.description,
          website: website ?? findTenant.website,
          email: email ?? findTenant.email,
          phone: phone ?? findTenant.phone,
          booth_number: booth_number ?? findTenant.booth_number,
          category_id: category_id ?? findTenant.category_id,
          logo: fileUrl,
        },
      });

      return {
        success: true,
        message: `Tenant have been updated`,
        data: updatedTenant,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async remove(id: string, userId: string, role?: UserRole) {
    try {
      const findTenant = await this.prisma.tenants.findFirst({
        where: { uuid: id },
      });
      if (!findTenant) throw new NotFoundException(`Tenant doesn't exists`);

      const findEventUser = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id: findTenant.event_id,
          user_id: userId,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });

      if (!findEventUser && role !== `SUPERADMIN`) {
        throw new ForbiddenException(
          `Sorry, you can't delete ${findTenant.name}`,
        );
      }
      const oldFileUrl = findTenant.logo;
      if (oldFileUrl !== ``) {
        const oldFilename = oldFileUrl.split('/').pop() || '';
        await this.s3Service.delete(`expo-project-tenants`, oldFilename);
      }

      const dropTenant = await this.prisma.tenants.delete({
        where: { uuid: id },
      });

      return {
        success: true,
        message: `Tenant has been removed`,
        data: dropTenant,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async removeMember(id: string, userId: string, role?: UserRole) {
    try {
      const findTenantMember = await this.prisma.tenant_members.findFirst({
        where: { uuid: id },
        include: { tenant: true },
      });
      if (!findTenantMember)
        throw new NotFoundException(`Tenant Member doesn't exists`);
      await this.assertTenantManager(findTenantMember.tenant_id, userId, role);

      const dropTenantMember = await this.prisma.tenant_members.delete({
        where: { uuid: id },
      });

      await this.prisma.user_event_roles.deleteMany({
        where: {
          user_id: findTenantMember.user_id,
          event_id: findTenantMember.tenant.event_id,
          role: `TENANT`,
        },
      });

      return {
        success: true,
        message: `Tenant Member has been removed`,
        data: dropTenantMember,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async verifyTenant(
    tenant_id: string,
    verifyDto: VerifyTenantDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const findTenant = await this.prisma.tenants.findFirst({
        where: { uuid: tenant_id },
      });
      if (!findTenant) throw new NotFoundException(`Tenant doesn't exists`);
      await this.assertTenantManager(tenant_id, userId, role);
      const { status } = verifyDto;
      // Keep the row on rejection so the decision is auditable (FIX-03).
      // If the owner/committee wants the tenant gone, use DELETE /tenants/:id explicitly.
      const updateTenant = await this.prisma.tenants.update({
        where: { uuid: tenant_id },
        data: { status, updated_by: userId },
      });
      return {
        success: true,
        message: `Tenant status has updated`,
        data: updateTenant,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async verifyMemberTenant(
    id: string,
    verifyDto: VerifyTenantDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const findTenantMember = await this.prisma.tenant_members.findFirst({
        where: { uuid: id },
        include: { tenant: true },
      });
      if (!findTenantMember)
        throw new NotFoundException(`Tenant member doesn't exists`);
      await this.assertTenantManager(findTenantMember.tenant_id, userId, role);
      const { status } = verifyDto;
      // Keep the row on rejection so the decision is auditable (FIX-03).
      // If the owner wants the member gone, use DELETE /tenants/member/:id explicitly.
      const updateTenantMember = await this.prisma.tenant_members.update({
        where: { uuid: id },
        data: { status, updated_by: userId },
      });
      return {
        success: true,
        message: `Tenant member status has updated`,
        data: updateTenantMember,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  /** A13 — change a member's role (OWNER/STAFF). */
  async changeMemberRole(
    id: string,
    dto: UpdateTenantMemberDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const findTenantMember = await this.prisma.tenant_members.findFirst({
        where: { uuid: id },
        include: { tenant: true },
      });
      if (!findTenantMember)
        throw new NotFoundException(`Tenant member doesn't exists`);
      await this.assertTenantManager(findTenantMember.tenant_id, userId, role);

      const updated = await this.prisma.tenant_members.update({
        where: { uuid: id },
        data: { role: dto.role, updated_by: userId },
      });
      return {
        success: true,
        message: `Tenant member role updated`,
        data: updated,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }
}
