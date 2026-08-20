import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

/** Public contact destination. Env override keeps the operator in control. */
const DEFAULT_CONTACT_DESTINATION_EMAIL = 'tefa@smktelkom-mlg.sch.id';

// Lightweight anti-spam defaults (in-memory, per IP). Resets on restart and is
// not cluster-safe — acceptable for now; `@nestjs/throttler` is the upgrade.
const RATE_LIMIT_MAX_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class ContactMessagesService {
  private readonly logger = new Logger(ContactMessagesService.name);
  private readonly submitTimestamps = new Map<string, number[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailService,
    private readonly configService: ConfigService,
  ) {}

  private get destinationEmail(): string {
    return (
      this.configService.get<string>('CONTACT_DESTINATION_EMAIL') ??
      DEFAULT_CONTACT_DESTINATION_EMAIL
    );
  }

  async create(dto: CreateContactMessageDto, ip: string) {
    this.assertRateLimit(ip);

    // Persist first — the row is the source of truth for the team, so a
    // message is never lost just because SMTP is down.
    const created = await this.prisma.contact_message.create({
      data: {
        name: dto.name,
        email: dto.email,
        subject: dto.subject,
        message: dto.message,
        ip_address: ip ?? '',
      },
    });

    // Count only successful submissions towards the rate limit.
    this.recordSubmission(ip);

    // Best-effort notification email. Fire-and-forget but log failures —
    // never fail the request after the message was already persisted.
    this.mailer
      .sendMail(
        this.destinationEmail,
        `[Mexpo] ${dto.subject}`,
        this.buildEmailHtml(dto),
      )
      .then(() =>
        this.logger.log(
          `Contact message ${created.uuid} emailed to ${this.destinationEmail}`,
        ),
      )
      .catch((error: unknown) => {
        this.logger.error(
          `Contact message ${created.uuid}: email send failed — message is persisted but was NOT delivered by mail.`,
          error instanceof Error ? error.stack : String(error),
        );
      });

    return {
      status: true,
      message: 'Pesan berhasil dikirim. Terima kasih!',
      data: { uuid: created.uuid },
    };
  }

  private assertRateLimit(ip: string) {
    if (!ip) return;
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    const recent = (this.submitTimestamps.get(ip) ?? []).filter(
      (t) => t > windowStart,
    );
    if (recent.length >= RATE_LIMIT_MAX_PER_WINDOW) {
      throw new HttpException(
        'Terlalu banyak pesan. Silakan coba lagi nanti.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private recordSubmission(ip: string) {
    if (!ip) return;
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;
    const recent = (this.submitTimestamps.get(ip) ?? []).filter(
      (t) => t > windowStart,
    );
    recent.push(now);
    this.submitTimestamps.set(ip, recent);
  }

  private buildEmailHtml(dto: CreateContactMessageDto): string {
    const esc = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const row = (label: string, value: string) =>
      `<p style="margin:4px 0"><strong>${esc(label)}:</strong> ${esc(
        value,
      )}</p>`;

    return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">
        <p style="margin:0 0 12px">Pesan baru dari form kontak Mexpo:</p>
        ${row('Nama', dto.name)}
        ${row('Email', dto.email)}
        ${row('Subjek', dto.subject)}
        <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
        <p style="white-space:pre-wrap;margin:0">${esc(dto.message)}</p>
      </div>`;
  }
}
