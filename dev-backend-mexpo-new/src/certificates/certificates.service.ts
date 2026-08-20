import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import {
  CreateCertificateTemplateDto,
  UpdateCertificateTemplateDto,
} from './dto/certificate-template.dto';
import { QueryCertificateTemplateDto } from './dto/query-certificate-template.dto';

/**
 * Dynamic certificate fields a template can bind to. Anything else is rejected
 * server-side so a crafted payload can never reference arbitrary data.
 */
export const CERTIFICATE_BINDING_KEYS = [
  `participant_name`,
  `event_name`,
  `workshop_title`,
  `date`,
  `organizer_name`,
  `certificate_number`,
] as const;

/** Konva node classNames the shared renderer understands. */
const ALLOWED_CLASS_NAMES = [
  `Stage`,
  `Layer`,
  `Group`,
  `Text`,
  `Image`,
  `Rect`,
  `Circle`,
  `Ellipse`,
  `Line`,
  `Path`,
  `Star`,
  `Ring`,
  `RegularPolygon`,
];

const BUCKET = `expo-project-certificate`;
const MAX_DIMENSION = 4000;
const MIN_DIMENSION = 200;

type TemplateNode = {
  className?: unknown;
  attrs?: Record<string, unknown>;
  children?: unknown[];
};

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}

  /** Only an APPROVED OWNER/COMMITTEE (or SUPERADMIN) may manage templates. */
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
        `You are not allowed to manage certificate templates for this event`,
      );
    }
  }

  /** A member of the event (any status) or SUPERADMIN may read the active template. */
  private async assertMember(
    event_id: string,
    userId: string,
    role?: UserRole,
  ) {
    if (role === `SUPERADMIN`) return;
    const found = await this.prisma.user_event_roles.findFirst({
      where: { event_id, user_id: userId },
    });
    if (!found) {
      throw new ForbiddenException(
        `You are not a member of this event. Join the event to access its certificates.`,
      );
    }
  }

  private sanitizeNodes(nodes: unknown[]): unknown[] {
    if (!Array.isArray(nodes)) {
      throw new BadRequestException(`template.nodes must be an array`);
    }
    const clean: unknown[] = [];
    for (const raw of nodes) {
      if (raw == null || typeof raw !== `object`) continue;
      const node = raw as TemplateNode;
      const className = node.className;
      if (
        typeof className !== `string` ||
        !ALLOWED_CLASS_NAMES.includes(className)
      ) {
        throw new BadRequestException(
          `Unsupported Konva node className: ${String(className)}`,
        );
      }
      const attrs = { ...(node.attrs ?? {}) };

      // Text nodes may carry the static/dynamic binding (default vs custom value).
      if (className === `Text` && attrs.binding != null) {
        const b = attrs.binding as {
          type?: unknown;
          key?: unknown;
          value?: unknown;
        };
        if (b && b.type === `dynamic`) {
          if (
            typeof b.key !== `string` ||
            !CERTIFICATE_BINDING_KEYS.includes(
              b.key as (typeof CERTIFICATE_BINDING_KEYS)[number],
            )
          ) {
            throw new BadRequestException(
              `Unknown dynamic certificate field: ${String(b.key)}`,
            );
          }
          attrs.binding = { type: `dynamic`, key: b.key };
        } else {
          // Static default value — always normalize to a string.
          attrs.binding = {
            type: `static`,
            value: typeof b?.value === `string` ? b.value : ``,
          };
        }
      }

      const childNodes = Array.isArray(node.children)
        ? this.sanitizeNodes(node.children)
        : undefined;
      clean.push({
        ...node,
        attrs,
        ...(childNodes ? { children: childNodes } : {}),
      });
    }
    return clean;
  }

  /**
   * Structural validation of the Konva envelope before it is persisted.
   * Throws BadRequestException on anything unsupported.
   */
  private sanitizeTemplate(
    template: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!template || typeof template !== `object`) {
      throw new BadRequestException(`template must be a JSON object`);
    }
    if (template.version !== 1) {
      throw new BadRequestException(`Unsupported certificate template version`);
    }
    const { width, height } = template;
    if (
      typeof width !== `number` ||
      typeof height !== `number` ||
      width < MIN_DIMENSION ||
      width > MAX_DIMENSION ||
      height < MIN_DIMENSION ||
      height > MAX_DIMENSION
    ) {
      throw new BadRequestException(
        `template width/height must be numbers within ${MIN_DIMENSION}-${MAX_DIMENSION}`,
      );
    }

    const bg = template.background as
      | { type?: unknown; value?: unknown; url?: unknown }
      | undefined;
    let background: Record<string, unknown> = {
      type: `color`,
      value: `#ffffff`,
    };
    if (bg && bg.type === `image` && typeof bg.url === `string` && bg.url) {
      background = { type: `image`, url: bg.url };
    } else if (bg && typeof bg.value === `string` && bg.value) {
      background = { type: `color`, value: bg.value };
    }

    const nodes = this.sanitizeNodes(
      Array.isArray(template.nodes) ? template.nodes : [],
    );
    return { version: 1, width, height, background, nodes };
  }

  /** Upload a background image to S3 and return its public URL. */
  private async uploadBackground(file: Express.Multer.File): Promise<string> {
    const filename = `${new Date().getTime().toString()}-${file.originalname}`;
    const url = `${this.configService.get<string>(`MINIO_ENDPOINT`)}/${BUCKET}/${filename}`;
    await this.s3Service.upload(BUCKET, filename, file.buffer, file.mimetype);
    return url;
  }

  /** Best-effort removal of a previously uploaded background file. */
  private async deleteBackground(url: string) {
    if (!url) return;
    try {
      const { bucket, key } = this.s3Service.parseS3Url(url);
      if (bucket === BUCKET) await this.s3Service.delete(BUCKET, key);
    } catch {
      // Non-S3/invalid URL — nothing to delete.
    }
  }

  async create(
    event_id: string,
    dto: CreateCertificateTemplateDto,
    file: Express.Multer.File | undefined,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const event = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!event) throw new NotFoundException(`Event doesn't exists`);
      await this.assertManager(event_id, userId, role);

      let template: Record<string, unknown> | undefined;
      if (dto.template != null) {
        template = this.sanitizeTemplate(dto.template);
      }

      // A background image is stored both as the S3 URL column and inside the
      // envelope so the renderer never needs extra lookups.
      let background = ``;
      if (file) {
        background = await this.uploadBackground(file);
        template = template
          ? { ...template, background: { type: `image`, url: background } }
          : {
              version: 1,
              width: 1200,
              height: 840,
              background: { type: `image`, url: background },
              nodes: [],
            };
      }

      const record = await this.prisma.certificate_templates.create({
        data: {
          event_id,
          name: dto.name ?? `Sertifikat`,
          kind: dto.kind ?? `WORKSHOP`,
          template: template ? (template as Prisma.InputJsonValue) : undefined,
          background,
          is_active: dto.is_active ?? true,
          created_by: userId,
          updated_by: userId,
        },
      });
      return {
        success: true,
        message: `Certificate template created`,
        data: record,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async findAll(
    event_id: string,
    query: QueryCertificateTemplateDto,
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
      const take = quantity ? Number(quantity) : undefined;
      const skip =
        page && quantity ? (Number(page) - 1) * Number(quantity) : undefined;

      const counts = await this.prisma.certificate_templates.count({
        where: { event_id },
      });
      const data = await this.prisma.certificate_templates.findMany({
        take,
        skip,
        orderBy: [{ is_active: `desc` }, { created_at: `desc` }],
        where: { event_id },
      });
      return {
        success: true,
        message: `Certificate templates retrieved`,
        data,
        meta: {
          page: page ? Number(page) : undefined,
          quantity: quantity ? Number(quantity) : undefined,
          counts,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  /** The active template used to render certificates for an event (or null). */
  async findActive(event_id: string, userId: string, role?: UserRole) {
    try {
      const event = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!event) throw new NotFoundException(`Event doesn't exists`);
      await this.assertMember(event_id, userId, role);

      const template = await this.prisma.certificate_templates.findFirst({
        where: { event_id, is_active: true },
        orderBy: { created_at: `desc` },
      });
      return {
        success: true,
        message: template
          ? `Active certificate template retrieved`
          : `No active certificate template for this event`,
        data: template,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async update(
    id: string,
    dto: UpdateCertificateTemplateDto,
    file: Express.Multer.File | undefined,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const record = await this.prisma.certificate_templates.findFirst({
        where: { uuid: id },
      });
      if (!record)
        throw new NotFoundException(`Certificate template doesn't exists`);
      await this.assertManager(record.event_id, userId, role);

      let template: Record<string, unknown> | undefined;
      if (dto.template != null) {
        template = this.sanitizeTemplate(dto.template);
      }

      let background = record.background;
      if (file) {
        await this.deleteBackground(background);
        background = await this.uploadBackground(file);
        template = template
          ? { ...template, background: { type: `image`, url: background } }
          : template;
      }

      const updateData: Prisma.certificate_templatesUncheckedUpdateInput = {
        name: dto.name ?? record.name,
        kind: dto.kind ?? record.kind,
        is_active: dto.is_active ?? record.is_active,
        background,
        updated_by: userId,
      };
      if (template) {
        updateData.template = template as Prisma.InputJsonValue;
      }
      const updated = await this.prisma.certificate_templates.update({
        where: { uuid: id },
        data: updateData,
      });
      return {
        success: true,
        message: `Certificate template updated`,
        data: updated,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async remove(id: string, userId: string, role?: UserRole) {
    try {
      const record = await this.prisma.certificate_templates.findFirst({
        where: { uuid: id },
      });
      if (!record)
        throw new NotFoundException(`Certificate template doesn't exists`);
      await this.assertManager(record.event_id, userId, role);

      await this.deleteBackground(record.background);
      const removed = await this.prisma.certificate_templates.delete({
        where: { uuid: id },
      });
      return {
        success: true,
        message: `Certificate template removed`,
        data: removed,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }
}
