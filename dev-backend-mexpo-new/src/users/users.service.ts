import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { BcryptService } from '../bcrypt/bcrypt.service';
import { UserRole } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { S3Service } from '../s3/s3.service';
import { ConfigService } from '@nestjs/config';
import { QueryUserDto } from './dto/query-user.dto';
import {
  ResetPasswordDto,
  VerifyResetPasswordDto,
} from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { buildOrderBy } from '../helper/sort';
import { Prisma } from '@prisma/client';

const USER_SORTABLE: Record<
  string,
  (dir: 'asc' | 'desc') => Prisma.usersOrderByWithRelationInput
> = {
  full_name: (d) => ({ full_name: d }),
  email: (d) => ({ email: d }),
  created_at: (d) => ({ created_at: d }),
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcrypt: BcryptService,
    private readonly mailer: MailService,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}

  verificationEmailTemplate(name: string, verifyUrl: string): string {
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Email Verification</title>
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
                background-color: #2563eb;
                color: #ffffff;
                padding: 20px;
                text-align: center;
                font-size: 22px;
                font-weight: bold;
              ">
                Verify Your Account
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 30px; color: #333333;">
                <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>

                <p style="font-size: 15px; line-height: 1.6;">
                  Thanks for registering! Please confirm your email address by clicking the button below.
                </p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verifyUrl}" target="_blank" style="
                    background-color: #2563eb;
                    color: #ffffff;
                    text-decoration: none;
                    padding: 14px 28px;
                    border-radius: 6px;
                    font-size: 16px;
                    display: inline-block;
                  ">
                    Verify Email
                  </a>
                </div>

                <p style="font-size: 14px; line-height: 1.6; color: #555;">
                  If the button doesn’t work, copy and paste this link into your browser:
                </p>

                <p style="word-break: break-all; font-size: 13px; color: #2563eb;">
                  ${verifyUrl}
                </p>

                <p style="font-size: 14px; color: #555;">
                  This link will expire in <strong>7 days</strong>.
                </p>

                <p style="font-size: 14px; margin-top: 30px;">
                  Cheers,<br/>
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
                © ${new Date().getFullYear()} Your App. All rights reserved.
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

  resetPasswordEmailTemplate(name: string, resetUrl: string): string {
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Reset Password</title>
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
                background-color: #dc2626;
                color: #ffffff;
                padding: 20px;
                text-align: center;
                font-size: 22px;
                font-weight: bold;
              ">
                Reset Your Password
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 30px; color: #333333;">
                <p style="font-size: 16px;">
                  Hi <strong>${name}</strong>,
                </p>

                <p style="font-size: 15px; line-height: 1.6;">
                  We received a request to reset your password. Click the button below to set a new one.
                </p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" target="_blank" style="
                    background-color: #dc2626;
                    color: #ffffff;
                    text-decoration: none;
                    padding: 14px 28px;
                    border-radius: 6px;
                    font-size: 16px;
                    display: inline-block;
                  ">
                    Reset Password
                  </a>
                </div>

                <p style="font-size: 14px; line-height: 1.6; color: #555;">
                  If the button doesn’t work, copy and paste this link into your browser:
                </p>

                <p style="word-break: break-all; font-size: 13px; color: #dc2626;">
                  ${resetUrl}
                </p>

                <p style="font-size: 14px; color: #555;">
                  ⏱ This link will expire in <strong>one day</strong>.
                </p>

                <div style="
                  background-color: #fef2f2;
                  border-left: 4px solid #dc2626;
                  padding: 12px;
                  margin-top: 25px;
                  font-size: 14px;
                  color: #7f1d1d;
                ">
                  <strong>Didn’t request this?</strong><br/>
                  You can safely ignore this email. Your password will remain unchanged.
                </div>

                <p style="font-size: 14px; margin-top: 30px;">
                  Stay safe,<br/>
                  <strong>Mexpo App Team</strong>
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
                © ${new Date().getFullYear()} Your App. All rights reserved.
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
    createUserDto: CreateUserDto,
    role: UserRole,
    file?: Express.Multer.File,
  ) {
    try {
      const { email, password, full_name, phone, organization } = createUserDto;

      const findExistingUser = await this.prisma.users.findFirst({
        where: { email },
      });
      if (findExistingUser) {
        throw new ConflictException(`User with this email already exists.`);
      }

      const hashedPassword = await this.bcrypt.hashPassword(password);
      let fileUrl = ``;
      if (file) {
        const filename = `${new Date().getTime().toString()}-${file.originalname}`;
        fileUrl = `${this.configService.get<string>(`MINIO_ENDPOINT`)}/${this.configService.get<string>(`MINIO_BUCKET`)}/${filename}`;
        await this.s3Service.upload(
          `expo-project`,
          filename,
          file.buffer,
          file.mimetype,
        );
      }

      const newUser = await this.prisma.users.create({
        data: {
          email,
          password: hashedPassword,
          full_name,
          phone,
          organization,
          photo: fileUrl,
          role,
          verify_at: role === `SUPERADMIN` ? new Date() : undefined,
          is_active: role === `SUPERADMIN` ? true : false,
        },
      });

      if (role !== `SUPERADMIN`) {
        const newVerificationEmail =
          await this.prisma.email_verification.create({
            data: {
              user_id: newUser.uuid,
              expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours from now
            },
          });

        const link = `${this.configService.get<string>(`PUBLIC_FRONTEND_URL`)}/verify-email?token=${newVerificationEmail.uuid}`;

        this.mailer
          .sendMail(
            newUser.email,
            'Welcome to Expo Website - Verify Your Email',
            this.verificationEmailTemplate(full_name, link),
          )
          .then(() => {
            console.log('Verification email sent successfully.');
          })
          .catch((error) => {
            console.error('Error sending verification email:', error);
          });
      }

      return {
        success: true,
        message:
          role === `SUPERADMIN`
            ? 'Superadmin user created successfully.'
            : 'User created successfully. Please check your email to verify your account.',
        data: newUser,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async sendEmailResetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const { email } = resetPasswordDto;
      const findEmail = await this.prisma.users.findFirst({ where: { email } });
      if (!findEmail) {
        throw new NotFoundException(`Email is not registered`);
      }

      const createResetPasswordCode =
        await this.prisma.email_reset_password.create({
          data: {
            user_id: findEmail.uuid,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });

      const link = `${this.configService.get<string>(`PUBLIC_FRONTEND_URL`)}/forgot-passwords/reset-password?token=${createResetPasswordCode.uuid}`;

      this.mailer
        .sendMail(
          email,
          'Expo Website - Reset Account Password',
          this.resetPasswordEmailTemplate(findEmail.full_name, link),
        )
        .then(() => {
          console.log('Reset password email sent successfully.');
        })
        .catch((error) => {
          console.error('Error sending reset password email:', error);
        });

      return {
        success: true,
        message: `Link for reset password has sent to your email`,
        data: createResetPasswordCode,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async verifyResetPassword(verifyResetPassword: VerifyResetPasswordDto) {
    try {
      const { token, password, confirm_password } = verifyResetPassword;
      const findToken = await this.prisma.email_reset_password.findFirst({
        where: { uuid: token },
      });
      if (!findToken) throw new NotFoundException(`Token Code doesn't exists`);
      const currentTime = new Date().getTime();
      if (currentTime > findToken.expiresAt.getTime()) {
        throw new ConflictException(`Token Code has expired`);
      }
      if (password !== confirm_password)
        throw new NotFoundException(`Confirmation password doesn't match`);
      const hashedPassword = await this.bcrypt.hashPassword(password);
      const updateUser = await this.prisma.users.update({
        where: { uuid: findToken.user_id },
        data: { password: hashedPassword },
      });

      await this.prisma.email_reset_password.delete({ where: { uuid: token } });
      return {
        success: true,
        message: `New password has updated to your account`,
        data: updateUser,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    try {
      const { current_password, password, confirm_password } =
        changePasswordDto;
      const findUser = await this.prisma.users.findFirst({
        where: { uuid: id },
      });
      if (!findUser) {
        throw new NotFoundException(`User not found`);
      }

      const isMatch = await this.bcrypt.comparePassword(
        current_password,
        findUser.password,
      );
      if (!isMatch) {
        throw new UnauthorizedException(`Current password is incorrect`);
      }

      if (confirm_password && password !== confirm_password) {
        throw new ConflictException(`Confirmation password doesn't match`);
      }

      const hashedPassword = await this.bcrypt.hashPassword(password);
      const updatedUser = await this.prisma.users.update({
        where: { uuid: id },
        data: { password: hashedPassword },
        omit: { password: true },
      });

      return {
        success: true,
        message: `Password changed successfully.`,
        data: updatedUser,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async changeEmail(id: string, changeEmailDto: ChangeEmailDto) {
    try {
      const { email, current_password } = changeEmailDto;
      const findUser = await this.prisma.users.findFirst({
        where: { uuid: id },
      });
      if (!findUser) {
        throw new NotFoundException(`User not found`);
      }

      const isMatch = await this.bcrypt.comparePassword(
        current_password,
        findUser.password,
      );
      if (!isMatch) {
        throw new UnauthorizedException(`Current password is incorrect`);
      }

      if (email.toLowerCase() === findUser.email.toLowerCase()) {
        throw new ConflictException(`New email is the same as current email`);
      }

      const emailExists = await this.prisma.users.findFirst({
        where: { email },
      });
      if (emailExists) {
        throw new ConflictException(`Email is already used by another account`);
      }

      // Switch to the new address and require re-verification before the
      // account is active again (mirrors the sign-up flow).
      await this.prisma.users.update({
        where: { uuid: id },
        data: { email, verify_at: null, is_active: false },
      });

      await this.prisma.email_verification.deleteMany({
        where: { user_id: id },
      });

      const newVerification = await this.prisma.email_verification.create({
        data: {
          user_id: id,
          expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
        },
      });

      const link = `${this.configService.get<string>(`PUBLIC_FRONTEND_URL`)}/verify-email?token=${newVerification.uuid}`;

      this.mailer
        .sendMail(
          email,
          'Expo Website - Verify Your New Email',
          this.verificationEmailTemplate(findUser.full_name, link),
        )
        .then(() => {
          console.log('Verification email sent successfully.');
        })
        .catch((error) => {
          console.error('Error sending verification email:', error);
        });

      return {
        success: true,
        message: `Email changed. Verification link has been sent to ${email}`,
        data: { email },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async resendVerificationEmail(email: string) {
    try {
      const findEmail = await this.prisma.users.findFirst({
        where: { email },
      });
      if (!findEmail) {
        throw new NotFoundException(`Email is not registered`);
      }
      if (findEmail.verify_at) {
        throw new ConflictException(`Email is already verified`);
      }

      // Invalidate any previous, unexpired verification links for this user.
      await this.prisma.email_verification.deleteMany({
        where: { user_id: findEmail.uuid },
      });

      const newVerification = await this.prisma.email_verification.create({
        data: {
          user_id: findEmail.uuid,
          expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
        },
      });

      const link = `${this.configService.get<string>(`PUBLIC_FRONTEND_URL`)}/verify-email?token=${newVerification.uuid}`;

      this.mailer
        .sendMail(
          email,
          'Expo Website - Resend Verification Email',
          this.verificationEmailTemplate(findEmail.full_name, link),
        )
        .then(() => {
          console.log('Verification email resent successfully.');
        })
        .catch((error) => {
          console.error('Error resending verification email:', error);
        });

      return {
        success: true,
        message: `Verification email has been sent to ${email}`,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async verifyEmail(code: string) {
    try {
      const findVerificationRecord =
        await this.prisma.email_verification.findFirst({
          where: { uuid: code },
        });

      if (!findVerificationRecord) {
        throw new ConflictException(`Invalid verification link or code.`);
      }

      const currentTime = new Date().getTime();
      if (currentTime > findVerificationRecord.expiresAt.getTime()) {
        throw new ConflictException(`Verification link has expired.`);
      }

      await this.prisma.users.update({
        where: { uuid: findVerificationRecord.user_id },
        data: { is_active: true, verify_at: new Date() },
      });

      await this.prisma.email_verification.delete({
        where: { uuid: code },
      });

      return {
        success: true,
        message: 'Email verified successfully.',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async findAll(@Query() query: QueryUserDto, role?: UserRole) {
    try {
      const { page, quantity, search, is_active } = query;
      const take: number | undefined = quantity || undefined;
      const skip: number | undefined =
        page && quantity ? (page - 1) * quantity : undefined;

      const counts = await this.prisma.users.count({
        where: {
          role: role ? role : undefined,
          is_active: is_active !== undefined ? is_active : undefined,
          OR: [
            { full_name: { contains: search || '' } },
            { email: { contains: search || '' } },
            { phone: { contains: search || '' } },
            { organization: { contains: search || '' } },
          ],
        },
      });

      const users = await this.prisma.users.findMany({
        take,
        skip,
        orderBy: buildOrderBy(query.sort_by, query.sort_dir, USER_SORTABLE, {
          full_name: 'asc',
        }) as Prisma.usersOrderByWithRelationInput,
        omit: { password: true },
        where: {
          role: role ? role : undefined,
          is_active: is_active !== undefined ? is_active : undefined,
          OR: [
            { full_name: { contains: search || '' } },
            { email: { contains: search || '' } },
            { phone: { contains: search || '' } },
            { organization: { contains: search || '' } },
          ],
        },
      });

      return {
        success: true,
        message: 'Users retrieved successfully.',
        data: users,
        meta: { counts, page, quantity },
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
      const user = await this.prisma.users.findFirst({
        where: { uuid: id, is_active: true },
        omit: { password: true },
        include: {
          usersBio: true,
        },
      });
      if (!user) {
        throw new NotFoundException(`User not found`);
      }
      return {
        success: true,
        message: 'User retrieved successfully.',
        data: user,
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
    updateUserDto: UpdateUserDto,
    file?: Express.Multer.File,
  ) {
    try {
      const findExistingUser = await this.prisma.users.findFirst({
        where: { uuid: id, is_active: true },
      });
      if (!findExistingUser) {
        throw new NotFoundException(`User not found`);
      }

      const { full_name, phone, organization, password } = updateUserDto;
      let fileUrl = findExistingUser.photo;
      if (file) {
        const oldFileUrl = findExistingUser.photo;
        if (oldFileUrl) {
          const oldFilename = oldFileUrl.split('/').pop() || '';
          await this.s3Service.delete(`expo-project`, oldFilename);
        }
        const filename = `${new Date().getTime().toString()}-${file.originalname}`;
        fileUrl = `${this.configService.get<string>(`MINIO_ENDPOINT`)}/${this.configService.get<string>(`MINIO_BUCKET`)}/${filename}`;
        await this.s3Service.upload(
          `expo-project`,
          filename,
          file.buffer,
          file.mimetype,
        );
      }

      let hashedPassword = findExistingUser.password;
      if (password) {
        hashedPassword = await this.bcrypt.hashPassword(password);
      }

      const updatedUser = await this.prisma.users.update({
        where: { uuid: id },
        data: {
          full_name,
          phone,
          organization,
          password: hashedPassword,
          photo: fileUrl,
        },
      });

      return {
        success: true,
        message: 'User updated successfully.',
        data: updatedUser,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async remove(id: string) {
    try {
      const findExistingUser = await this.prisma.users.findFirst({
        where: { uuid: id, is_active: true },
      });
      if (!findExistingUser) {
        throw new NotFoundException(`User not found`);
      }

      const oldFileUrl = findExistingUser.photo;
      if (oldFileUrl !== ``) {
        const oldFilename = oldFileUrl.split('/').pop() || '';
        await this.s3Service.delete(`expo-project`, oldFilename);
      }

      const deletedUser = await this.prisma.users.update({
        where: { uuid: id },
        data: { is_active: false },
      });

      return {
        success: true,
        message: 'User deleted successfully.',
        data: deletedUser,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }
}
