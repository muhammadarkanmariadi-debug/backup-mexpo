import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: configService.get<string>(`MAIL_HOST`),
      port: parseInt(configService.get<string>(`MAIL_PORT`) || '587', 10),
      secure: configService.get<string>(`MAIL_SECURE`) === 'true',
      auth: {
        user: configService.get<string>(`MAIL_USER`),
        pass: configService.get<string>(`MAIL_PASSWORD`),
      },
    });
  }

  async sendMail(target: string, subject: string, html: string) {
    await this.transporter.sendMail({
      from: `"Mexpo" <${this.configService.get<string>(`MAIL_USER`)}>`,
      to: target,
      subject,
      html,
    });
  }
}
