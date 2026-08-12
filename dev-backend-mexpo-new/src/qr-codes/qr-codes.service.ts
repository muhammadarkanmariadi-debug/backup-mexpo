import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as QRCode from 'qrcode';

/**
 * A4 — QR code system.
 * Every participant has one universal QR per event: `mexpo:<event_id>:<user_id>`.
 * The same code is used for venue check-in, seminar/workshop check-in, tenant
 * booth visits, POS identification and souvenir validation.
 */
@Injectable()
export class QrCodesService {
  constructor(private readonly prisma: PrismaService) {}

  private buildCodeData(eventId: string, userId: string): string {
    return `mexpo:${eventId}:${userId}`;
  }

  /** Returns (and lazily creates) the caller's QR for an event. */
  async getMyQr(eventId: string, userId: string) {
    try {
      const event = await this.prisma.events.findFirst({
        where: { uuid: eventId },
      });
      if (!event) throw new NotFoundException(`Event doesn't exists`);
      const user = await this.prisma.users.findFirst({
        where: { uuid: userId },
      });
      if (!user) throw new NotFoundException(`User doesn't exists`);

      const codeData = this.buildCodeData(eventId, userId);
      const existing = await this.prisma.qr_codes.findFirst({
        where: { code_data: codeData },
      });
      if (!existing) {
        await this.prisma.qr_codes.create({
          data: { code_data: codeData, event_id: eventId, user_id: userId },
        });
      }

      const image = await QRCode.toDataURL(codeData);
      return {
        success: true,
        message: `QR code generated`,
        data: {
          code_data: codeData,
          image,
          event_id: eventId,
          user_id: userId,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  /** Resolves a scanned code to the participant identity. */
  async resolve(codeData: string) {
    try {
      const found = await this.prisma.qr_codes.findFirst({
        where: { code_data: codeData },
      });
      let eventId = found?.event_id;
      let userId = found?.user_id;

      if (!eventId || !userId) {
        const match = /^mexpo:(.+):(.+)$/.exec(codeData);
        if (!match) {
          throw new BadRequestException(`Invalid QR code`);
        }
        eventId = match[1];
        userId = match[2];
      }

      const event = await this.prisma.events.findFirst({
        where: { uuid: eventId },
      });
      if (!event) throw new NotFoundException(`Event doesn't exists`);

      const user = await this.prisma.users.findFirst({
        where: { uuid: userId },
      });
      if (!user) throw new NotFoundException(`User doesn't exists`);

      return {
        success: true,
        message: `QR resolved`,
        data: {
          event_id: eventId,
          user_id: userId,
          user: {
            uuid: user.uuid,
            full_name: user.full_name,
            email: user.email,
            photo: user.photo,
          },
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }
}
