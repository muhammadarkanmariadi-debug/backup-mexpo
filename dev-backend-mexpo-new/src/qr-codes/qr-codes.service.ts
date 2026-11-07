import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as QRCode from 'qrcode';

const SEED_EVENT_MAP: Record<string, string> = {
  '1': 'e872e411-bd56-4c40-b6f0-d46e2a297e2c',
  '2': 'e872e411-bd56-4c40-b6f0-d46e2a297e2d',
  '3': 'e872e411-bd56-4c40-b6f0-d46e2a297e2e',
};

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

  /** Resolves a scanned code (or shorthand / email / user UUID) to the participant identity. */
  async resolve(rawCodeData: string, contextEventId?: string) {
    try {
      let codeData = (rawCodeData ?? '').trim();

      // Unwrap QR generator URLs if someone scanned or pasted a URL containing ?data=...
      if (/^https?:\/\//i.test(codeData)) {
        try {
          const url = new URL(codeData);
          const dataParam = url.searchParams.get('data');
          if (dataParam) codeData = dataParam.trim();
        } catch {
          // ignore malformed URL
        }
      }

      // 1) Direct lookup in qr_codes table (exact code_data or uuid)
      const found = await this.prisma.qr_codes.findFirst({
        where: {
          OR: [
            { code_data: { equals: codeData, mode: 'insensitive' } },
            { uuid: { equals: codeData, mode: 'insensitive' } },
          ],
        },
      });
      let eventId = found?.event_id;
      let userId = found?.user_id;

      // 2) Standard `mexpo:<event_id>:<user_id>` or legacy `mexo:<event_id>:<user_id>`
      if (!eventId || !userId) {
        const match = /^mexp?o:([^:]+):([^:]+)$/i.exec(codeData);
        if (match) {
          const rawEvent = match[1].trim();
          const rawUser = match[2].trim();
          if (
            rawEvent.toLowerCase() === 'sample' ||
            rawUser.toLowerCase() === 'visitor'
          ) {
            // Sample badge QR fallback -> resolve to first visitor in context event or Event 1
            eventId = contextEventId || SEED_EVENT_MAP['1'];
            userId = 'v0000000-0000-0000-0000-000000000001';
          } else {
            eventId = rawEvent;
            userId = rawUser;
          }
        }
      }

      // 3) Shorthand alias: `MEXPO-EV1-VIS-3` or `VIS-3`
      if (!eventId || !userId) {
        const shortMatch = /^(?:MEXPO-)?(?:EV(\d+)-)?VIS-(\d+)$/i.exec(codeData);
        if (shortMatch) {
          const evNum = shortMatch[1] || '1';
          const visNum = shortMatch[2].padStart(12, '0');
          eventId =
            contextEventId || SEED_EVENT_MAP[evNum] || SEED_EVENT_MAP['1'];
          userId = `v0000000-0000-0000-0000-${visNum}`;
        }
      }

      // 4) Direct lookup by user email, UUID, or full_name
      if (!eventId || !userId) {
        const matchedUser = await this.prisma.users.findFirst({
          where: {
            OR: [
              { uuid: codeData },
              { email: { equals: codeData, mode: 'insensitive' } },
              { full_name: { equals: codeData, mode: 'insensitive' } },
            ],
          },
        });
        if (matchedUser) {
          userId = matchedUser.uuid;
          if (contextEventId) {
            eventId = contextEventId;
          } else {
            const roleRecord = await this.prisma.user_event_roles.findFirst({
              where: { user_id: matchedUser.uuid },
              orderBy: { created_at: 'desc' },
            });
            eventId = roleRecord?.event_id || SEED_EVENT_MAP['1'];
          }
        }
      }

      if (!eventId || !userId) {
        throw new BadRequestException(`Invalid QR code`);
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
