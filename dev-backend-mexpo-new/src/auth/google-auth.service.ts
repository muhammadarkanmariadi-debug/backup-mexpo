import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { BcryptService } from '../bcrypt/bcrypt.service';

/**
 * Google sign-in via Google Identity Services (GIS) id_token.
 *
 * Security contract:
 * - The id_token is ALWAYS verified with `OAuth2Client.verifyIdToken` (signature,
 *   expiry, `aud` against GOOGLE_CLIENT_ID, issuer). Never trust a raw token.
 * - `email_verified === true` is required — it is Google's proof of ownership.
 * - Account linking is idempotent: look up by the stable Google `sub`
 *   (`users.google_id`) first, then by email. A matching existing account is
 *   activated, marked verified and **synced** with Google's name/photo, so a
 *   Google login never creates a duplicate of a manually-registered account.
 */
@Injectable()
export class GoogleAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcrypt: BcryptService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getClientId(): string {
    return this.configService.get<string>(`GOOGLE_CLIENT_ID`) ?? ``;
  }

  async googleAuth(credential: string) {
    try {
      const clientId = this.getClientId();
      if (!clientId) {
        throw new InternalServerErrorException(
          `GOOGLE_CLIENT_ID is not configured`,
        );
      }

      let payload: GoogleIdTokenPayload | undefined;
      try {
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: clientId,
        });
        payload = ticket.getPayload();
      } catch {
        throw new UnauthorizedException(`Google token is invalid or expired`);
      }
      if (!payload) {
        throw new UnauthorizedException(`Google token is invalid or expired`);
      }
      if (!payload.email || payload.email_verified !== true) {
        throw new BadRequestException(`Google account email is not verified`);
      }

      const email = payload.email.toLowerCase();
      const googleId = payload.sub ?? ``;

      // 1) Already-linked account (stable Google subject id).
      let existing = googleId
        ? await this.prisma.users.findFirst({ where: { google_id: googleId } })
        : null;
      // 2) Otherwise match by email so a pre-existing manual account is linked
      //    instead of creating a duplicate.
      if (!existing) {
        existing = await this.prisma.users.findFirst({ where: { email } });
      }

      let user: GoogleAuthedUser | null = null;
      let isNew = false;
      if (existing) {
        // Google proves ownership of the email → activate + verify, persist the
        // link (google_id), and sync the profile (name/photo) onto the account.
        user = await this.prisma.users.update({
          where: { uuid: existing.uuid },
          data: {
            google_id: existing.google_id || googleId || null,
            full_name: payload.name ? payload.name : existing.full_name,
            photo: payload.picture ? payload.picture : existing.photo,
            is_active: true,
            verify_at: existing.verify_at ?? new Date(),
          },
          omit: { password: true, google_id: true },
        });
      } else {
        isNew = true;
        // Random unusable password — the account can only be accessed via Google.
        const randomPassword = await this.bcrypt.hashPassword(
          this.bcrypt.createRandomPassword(),
        );
        user = await this.prisma.users.create({
          data: {
            email,
            full_name: payload.name || email,
            photo: payload.picture ?? ``,
            google_id: googleId || null,
            password: randomPassword,
            is_active: true,
            verify_at: new Date(),
          },
          omit: { password: true, google_id: true },
        });
      }

      const token = this.jwtService.sign({
        uuid: user.uuid,
        role: user.role,
      });
      return {
        success: true,
        message: `Google authentication successful`,
        token,
        role: user.role,
        is_new: isNew,
        user,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }
}

/** Subset of the verified Google id_token payload we rely on. */
type GoogleIdTokenPayload = {
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  /** Stable Google account identifier — persisted as users.google_id. */
  sub?: string;
};

/** Minimal shape of the (password-omitted) user we return after auth. */
type GoogleAuthedUser = { uuid: string; role: string };
