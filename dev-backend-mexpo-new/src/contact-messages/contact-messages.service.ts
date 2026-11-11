import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { QueryContactMessageDto } from './dto/query-contact-message.dto';
import { ReplyContactMessageDto } from './dto/reply-contact-message.dto';
import { ContactStatus, Prisma } from '@prisma/client';

/** Public contact destination. Env override keeps the operator in control. */
const DEFAULT_CONTACT_DESTINATION_EMAIL = 'tefa@smktelkom-mlg.sch.id';

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

    const created = await this.prisma.contact_message.create({
      data: {
        name: dto.name,
        email: dto.email,
        subject: dto.subject,
        message: dto.message,
        ip_address: ip ?? '',
        status: ContactStatus.UNREAD,
      },
    });

    this.recordSubmission(ip);

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

  async findAll(query: QueryContactMessageDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const quantity = Math.max(1, Number(query.quantity) || 10);
    const skip = (page - 1) * quantity;

    const where: Prisma.contact_messageWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search && query.search.trim() !== '') {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term } },
        { email: { contains: term } },
        { subject: { contains: term } },
        { message: { contains: term } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.contact_message.count({ where }),
      this.prisma.contact_message.findMany({
        where,
        skip,
        take: quantity,
        orderBy: { created_at: 'desc' },
        include: {
          replier: {
            select: {
              uuid: true,
              full_name: true,
              email: true,
              photo: true,
            },
          },
        },
      }),
    ]);

    return {
      status: true,
      message: 'Berhasil mengambil daftar pesan',
      data: items,
      total,
      totalPages: Math.ceil(total / quantity) || 1,
      page,
      quantity,
    };
  }

  async getStats() {
    const [total, unread, read, replied, archived] = await Promise.all([
      this.prisma.contact_message.count(),
      this.prisma.contact_message.count({
        where: { status: ContactStatus.UNREAD },
      }),
      this.prisma.contact_message.count({
        where: { status: ContactStatus.READ },
      }),
      this.prisma.contact_message.count({
        where: { status: ContactStatus.REPLIED },
      }),
      this.prisma.contact_message.count({
        where: { status: ContactStatus.ARCHIVED },
      }),
    ]);

    return {
      status: true,
      data: {
        total,
        unread,
        read,
        replied,
        archived,
      },
    };
  }

  async findOne(uuid: string, autoMarkRead = true) {
    const message = await this.prisma.contact_message.findUnique({
      where: { uuid },
      include: {
        replier: {
          select: {
            uuid: true,
            full_name: true,
            email: true,
            photo: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Pesan tidak ditemukan');
    }

    if (autoMarkRead && message.status === ContactStatus.UNREAD) {
      const updated = await this.prisma.contact_message.update({
        where: { uuid },
        data: { status: ContactStatus.READ },
        include: {
          replier: {
            select: {
              uuid: true,
              full_name: true,
              email: true,
              photo: true,
            },
          },
        },
      });
      return { status: true, data: updated };
    }

    return { status: true, data: message };
  }

  async updateStatus(uuid: string, status: ContactStatus) {
    const existing = await this.prisma.contact_message.findUnique({
      where: { uuid },
    });
    if (!existing) {
      throw new NotFoundException('Pesan tidak ditemukan');
    }

    const updated = await this.prisma.contact_message.update({
      where: { uuid },
      data: { status },
      include: {
        replier: {
          select: {
            uuid: true,
            full_name: true,
            email: true,
            photo: true,
          },
        },
      },
    });

    return {
      status: true,
      message: 'Status pesan berhasil diperbarui',
      data: updated,
    };
  }

  async reply(uuid: string, dto: ReplyContactMessageDto, staffUserId: string) {
    const message = await this.prisma.contact_message.findUnique({
      where: { uuid },
    });
    if (!message) {
      throw new NotFoundException('Pesan tidak ditemukan');
    }

    const staffUser = await this.prisma.users.findUnique({
      where: { uuid: staffUserId },
      select: { full_name: true, email: true },
    });

    // Send email to the visitor who submitted the message
    const replyHtml = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
        <h3 style="color: #3c85f3; margin-top: 0;">Halo ${message.name},</h3>
        <p>Terima kasih telah menghubungi tim Mexpo. Berikut adalah tanggapan kami terkait pesan Anda:</p>
        <div style="background: #f8fafc; border-left: 4px solid #3c85f3; padding: 14px 16px; margin: 16px 0; border-radius: 4px; white-space: pre-wrap;">
          ${dto.reply_message}
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Pesan Anda sebelumnya:</p>
        <blockquote style="font-size: 13px; color: #64748b; margin: 0; padding-left: 12px; border-left: 2px solid #cbd5e1; font-style: italic;">
          "${message.message}"
        </blockquote>
        <br />
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">Salam hangat,<br /><strong>Tim Layanan Mexpo</strong>${
          staffUser?.full_name ? ` (${staffUser.full_name})` : ''
        }</p>
      </div>
    `;

    await this.mailer.sendMail(
      message.email,
      `[Mexpo] Re: ${message.subject}`,
      replyHtml,
    );

    const updated = await this.prisma.contact_message.update({
      where: { uuid },
      data: {
        reply_message: dto.reply_message,
        replied_at: new Date(),
        replied_by: staffUserId,
        status: ContactStatus.REPLIED,
      },
      include: {
        replier: {
          select: {
            uuid: true,
            full_name: true,
            email: true,
            photo: true,
          },
        },
      },
    });

    return {
      status: true,
      message: 'Balasan berhasil dikirim ke pengunjung',
      data: updated,
    };
  }

  async remove(uuid: string) {
    const existing = await this.prisma.contact_message.findUnique({
      where: { uuid },
    });
    if (!existing) {
      throw new NotFoundException('Pesan tidak ditemukan');
    }

    await this.prisma.contact_message.delete({
      where: { uuid },
    });

    return {
      status: true,
      message: 'Pesan berhasil dihapus',
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
