import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSouvenirDto } from './dto/create-souvenir.dto';
import { PrismaService } from '../prisma/prisma.service';
import { QuerySouvenirDto } from './dto/query-souvenir.dto';
import { assertEventFeature } from '../events/event-features';
import {
  evaluateSouvenirEligibility,
  type SouvenirRules,
} from './souvenir-rules';
import { RedeemSouvenirDto } from './dto/redeem-souvenir.dto';
import { VoucherCodeDto } from './dto/voucher-code.dto';
import { generateVoucherCode, normalizeVoucherCode } from './voucher-code';
import * as QRCode from 'qrcode';
import { S3Service } from '../s3/s3.service';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserRole } from '@prisma/client';

const CATALOG_BUCKET = `expo-project-souvenir`;

@Injectable()
export class SouvenirsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}

  /** Uploads a catalog item photo; returns its public URL (owner/committee/superadmin). */
  async uploadCatalogImage(
    event_id: string,
    userId: string,
    role: UserRole | undefined,
    file?: Express.Multer.File,
  ) {
    try {
      if (!file) throw new BadRequestException(`File gambar wajib diisi`);
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
        select: { uuid: true, name: true },
      });
      if (!findEvent) throw new NotFoundException(`Event doesn't exists`);
      if (role !== `SUPERADMIN`) {
        const manager = await this.prisma.user_event_roles.findFirst({
          where: {
            event_id,
            user_id: userId,
            status: `APPROVED`,
            role: { in: [`COMMITTEE`, `OWNER`] },
          },
        });
        if (!manager) {
          throw new ForbiddenException(
            `Sorry, you can't manage souvenirs for ${findEvent.name}`,
          );
        }
      }
      const filename = `${Date.now()}-${file.originalname}`;
      await this.s3Service.upload(
        CATALOG_BUCKET,
        filename,
        file.buffer,
        file.mimetype,
      );
      return {
        success: true,
        message: `Foto souvenir diunggah`,
        data: {
          url: `${this.configService.get<string>(`MINIO_ENDPOINT`)}/${CATALOG_BUCKET}/${filename}`,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were worng: ${error}`);
    }
  }
  /**
   * Counter (committee/owner) hands a souvenir to a visitor.
   * Same one-per-event rule as a visitor's own redemption.
   */
  async create(
    event_id: string,
    createSouvenirDto: CreateSouvenirDto,
    userId: string,
  ) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) throw new NotFoundException(`Event doesn't exists`);
      // A2 — souvenir feature must be enabled for this event.
      await assertEventFeature(this.prisma, event_id, 'souvenir');
      const { user_id } = createSouvenirDto;
      const findCommitee = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id,
          user_id: userId,
          status: `APPROVED`,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });
      if (!findCommitee)
        throw new ForbiddenException(`You are not allow to give souvenirs`);
      const findUserEvent = await this.prisma.user_event_roles.findFirst({
        where: { user_id, event_id, status: `APPROVED` },
      });
      if (!findUserEvent)
        throw new ForbiddenException(
          `You are not registered at ${findEvent.name}`,
        );
      // The counter gives the item right now, so it is collected immediately.
      return await this.grant(
        findEvent,
        user_id,
        createSouvenirDto.tier_id,
        userId,
        true,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were worng: ${error}`);
    }
  }

  /** A visitor redeems their own points for one catalog item. */
  async redeem(event_id: string, dto: RedeemSouvenirDto, userId: string) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) throw new NotFoundException(`Event doesn't exists`);
      await assertEventFeature(this.prisma, event_id, 'souvenir');
      await this.assertEventMember(event_id, userId, findEvent.name);
      const rules = (findEvent.souvenir_rules ?? {}) as {
        usePointSystem?: boolean;
      };
      if (rules.usePointSystem !== true) {
        throw new ConflictException(
          `Event ini belum memakai sistem poin souvenir`,
        );
      }
      // Self-redemption: the item is collected later by scanning the voucher QR.
      return await this.grant(findEvent, userId, dto.tier_id, userId, false);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were worng: ${error}`);
    }
  }

  /** Approved member of the event (any role) — needed to see/redeem own points. */
  private async assertEventMember(
    event_id: string,
    userId: string,
    eventName: string,
  ) {
    const member = await this.prisma.user_event_roles.findFirst({
      where: { event_id, user_id: userId, status: `APPROVED` },
    });
    if (!member) {
      throw new ForbiddenException(
        `Kamu belum terdaftar di ${eventName} atau pendaftaranmu belum disetujui`,
      );
    }
  }

  /**
   * The single redemption path. One souvenir per account per event: the
   * existing-redemption check, the point/stock evaluation and the insert run in
   * one Serializable transaction, so double clicks and two counters redeeming
   * the last unit at once can neither double-spend points nor oversell stock.
   */
  private async grant(
    event: { uuid: string; name: string; souvenir_rules: unknown },
    user_id: string,
    tier_id: string | undefined,
    actorId: string,
    handedOver: boolean,
  ) {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const existing = await tx.souvenirs.findFirst({
            where: { event_id: event.uuid, user_id },
          });
          if (existing) {
            throw new ConflictException(
              `Souvenir sudah ditukar${existing.souvenir_name ? ` (${existing.souvenir_name})` : ``}. Setiap akun hanya bisa menukar satu souvenir per event.`,
            );
          }

          const eligibility = await evaluateSouvenirEligibility(
            tx,
            event,
            user_id,
          );
          if (!eligibility.eligible) {
            throw new ForbiddenException(
              `Souvenir belum bisa diklaim: ${eligibility.reasons.join(', ')}`,
            );
          }

          let souvenirName = `Standard Souvenir`;
          let pointsEarned = 0;
          let pointsSpent = 0;
          let tierId: string | null = null;
          if (eligibility.usePointSystem) {
            const selected = tier_id
              ? eligibility.eligibleTiers.find((t) => t.id === tier_id)
              : eligibility.recommendedTier;
            if (!selected) {
              const requested = eligibility.tiers.find((t) => t.id === tier_id);
              if (requested?.soldOut) {
                throw new ConflictException(
                  `Item ${requested.name} tidak tersedia (stok habis)`,
                );
              }
              if (tier_id && !requested) {
                throw new NotFoundException(`Item souvenir tidak ditemukan`);
              }
              throw new ForbiddenException(
                `Poin kurang untuk item yang dipilih (sisa ${eligibility.availablePoints} poin)`,
              );
            }
            tierId = selected.id;
            souvenirName = selected.name;
            pointsEarned = eligibility.totalPoints;
            pointsSpent = selected.minPoints;
          }

          // Unique voucher code for the redemption QR (retry on the unlikely clash).
          let code = generateVoucherCode();
          for (let i = 0; i < 5; i++) {
            const clash = await tx.souvenirs.findFirst({ where: { code } });
            if (!clash) break;
            code = generateVoucherCode();
          }

          const record = await tx.souvenirs.create({
            data: {
              user_id,
              event_id: event.uuid,
              souvenir_name: souvenirName,
              tier_id: tierId,
              points_earned: pointsEarned,
              points_spent: pointsSpent,
              code,
              collected_at: handedOver ? new Date() : null,
              collected_by: handedOver ? actorId : null,
              created_by: actorId,
              updated_by: actorId,
            },
          });
          return {
            success: true,
            message: eligibility.usePointSystem
              ? `${souvenirName} berhasil ditukar. Sisa poin: ${eligibility.availablePoints - pointsSpent}.${handedOver ? `` : ` Tunjukkan QR penukaran di tempat penukaran untuk mengambilnya.`}`
              : `New Souvernir has given to visitor`,
            data: record,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      // Concurrent redemption lost the serialization race.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === `P2034`
      ) {
        throw new ConflictException(
          `Permintaan bersamaan terdeteksi, silakan coba lagi`,
        );
      }
      throw error;
    }
  }

  /**
   * The caller's own souvenir overview: point balance + history, the catalog
   * with per-item state, how to earn points, and their redemption (if any).
   */
  async findMine(event_id: string, userId: string) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) throw new NotFoundException(`Event doesn't exists`);
      await assertEventFeature(this.prisma, event_id, 'souvenir');
      await this.assertEventMember(event_id, userId, findEvent.name);

      const rules = (findEvent.souvenir_rules ?? {}) as SouvenirRules;
      if (rules.usePointSystem !== true) {
        return {
          success: true,
          message: `Event ini belum memakai sistem poin souvenir`,
          data: { enabled: false },
        };
      }

      const eligibility = await evaluateSouvenirEligibility(
        this.prisma,
        findEvent,
        userId,
      );
      const redeemedRow = await this.prisma.souvenirs.findFirst({
        where: { event_id, user_id: userId },
        orderBy: { created_at: `desc` },
      });
      const redeemedTier = redeemedRow?.tier_id
        ? eligibility.tiers.find((t) => t.id === redeemedRow.tier_id)
        : undefined;

      type ItemState = 'REDEEMABLE' | 'LOCKED' | 'UNAVAILABLE' | 'REDEEMED';
      const items = eligibility.tiers.map((t) => {
        let state: ItemState = `REDEEMABLE`;
        if (redeemedRow && redeemedRow.tier_id === t.id) state = `REDEEMED`;
        else if (t.soldOut) state = `UNAVAILABLE`;
        else if (!t.unlocked) state = `LOCKED`;
        return {
          id: t.id,
          name: t.name,
          description: t.description ?? ``,
          image: t.image ?? ``,
          points: t.minPoints,
          remaining: t.remaining,
          missingPoints: t.missingPoints,
          state,
        };
      });

      return {
        success: true,
        message: `Souvenir overview retrieved`,
        data: {
          enabled: true,
          totalPoints: eligibility.totalPoints,
          spentPoints: eligibility.spentPoints,
          availablePoints: eligibility.availablePoints,
          ledger: eligibility.ledger,
          earnRules: this.describeEarnRules(rules),
          items,
          // One souvenir per account per event.
          canRedeem: !redeemedRow,
          redeemed: redeemedRow
            ? {
                name: redeemedRow.souvenir_name,
                image: redeemedTier?.image ?? ``,
                pointsSpent: redeemedRow.points_spent,
                at: redeemedRow.created_at,
                // Voucher QR the visitor shows at the counter. Redemptions made
                // before vouchers existed have no code (they were handed over).
                code: redeemedRow.code,
                qr: redeemedRow.code
                  ? await QRCode.toDataURL(redeemedRow.code, {
                      margin: 1,
                      width: 360,
                    })
                  : null,
                status: redeemedRow.collected_at ? `COLLECTED` : `READY`,
                collectedAt: redeemedRow.collected_at,
              }
            : null,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were worng: ${error}`);
    }
  }

  /** Human-readable "how to earn points" list for the visitor. */
  private describeEarnRules(rules: SouvenirRules) {
    const booth = rules.boothVisitPoint;
    const seminar = rules.seminarPoint;
    const tx = rules.transactionPoint;
    const rules_: {
      source: 'BOOTH' | 'SEMINAR' | 'TRANSACTION';
      title: string;
      description: string;
    }[] = [];
    if (booth?.enabled && booth.pointsPerVisit > 0) {
      rules_.push({
        source: `BOOTH`,
        title: `Kunjungi booth tenant`,
        description: `+${booth.pointsPerVisit} poin setiap kali kamu berkunjung ke booth dan di-scan QR-mu`,
      });
    }
    if (seminar?.enabled && seminar.pointsPerSeminar > 0) {
      rules_.push({
        source: `SEMINAR`,
        title: `Ikuti lokakarya / seminar`,
        description: `+${seminar.pointsPerSeminar} poin untuk setiap lokakarya yang kamu daftar`,
      });
    }
    if (tx?.enabled) {
      const parts: string[] = [];
      if ((tx.pointsPerTransaction ?? 0) > 0) {
        parts.push(`+${tx.pointsPerTransaction} poin setiap transaksi`);
      }
      if ((tx.amountStep ?? 0) > 0 && (tx.pointsPerAmountStep ?? 0) > 0) {
        parts.push(
          `+${tx.pointsPerAmountStep} poin untuk setiap kelipatan Rp${(tx.amountStep ?? 0).toLocaleString('id-ID')}`,
        );
      }
      if (parts.length > 0) {
        rules_.push({
          source: `TRANSACTION`,
          title: `Belanja di booth tenant`,
          description: `${parts.join(', ')}. Tunjukkan QR-mu saat membayar`,
        });
      }
    }
    return rules_;
  }

  /**
   * A6/B7 — eligibility check for the souvenir counter UI (no grant).
   * Returns whether the visitor is eligible + reasons + already-claimed state.
   */
  async check(
    event_id: string,
    createSouvenirDto: CreateSouvenirDto,
    userId: string,
  ) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) throw new NotFoundException(`Event doesn't exists`);
      await assertEventFeature(this.prisma, event_id, 'souvenir');
      const { user_id } = createSouvenirDto;

      const findCommitee = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id,
          user_id: userId,
          status: `APPROVED`,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });
      if (!findCommitee)
        throw new ForbiddenException(`You are not allow to check souvenirs`);

      const user = await this.prisma.users.findFirst({
        where: { uuid: user_id },
        select: { uuid: true, full_name: true, email: true, photo: true },
      });
      if (!user) throw new NotFoundException(`User doesn't exists`);

      const eligibility = await evaluateSouvenirEligibility(
        this.prisma,
        findEvent,
        user_id,
      );
      const claims = await this.prisma.souvenirs.findMany({
        where: { event_id, user_id },
        orderBy: { created_at: `desc` },
      });
      const claimed = claims[0];
      // One souvenir per account per event, in every mode.
      const alreadyClaimed = !!claimed;

      return {
        success: true,
        message: `Eligibility checked`,
        data: {
          user,
          usePointSystem: eligibility.usePointSystem,
          eligible: eligibility.eligible,
          reasons: eligibility.reasons,
          boothVisits: eligibility.data.boothVisits,
          seminarCount: eligibility.data.seminarCount,
          joinedSeminar: eligibility.data.joinedSeminar,
          transactionCount: eligibility.data.transactionCount,
          transactionTotal: eligibility.data.transactionTotal,
          totalPoints: eligibility.totalPoints,
          spentPoints: eligibility.spentPoints,
          availablePoints: eligibility.availablePoints,
          pointBreakdown: eligibility.pointBreakdown,
          tiers: eligibility.tiers,
          eligibleTiers: eligibility.eligibleTiers,
          recommendedTier: eligibility.recommendedTier,
          alreadyClaimed,
          claimedCount: claims.length,
          claims: claims.map((c) => ({
            souvenir_name: c.souvenir_name,
            points_spent: c.points_spent,
            claimed_at: c.created_at,
          })),
          claimedSouvenir: claimed
            ? {
                id: claimed.id,
                code: claimed.code,
                status: claimed.collected_at ? `COLLECTED` : `READY`,
                collected_at: claimed.collected_at,
                souvenir_name: claimed.souvenir_name,
                points_earned: claimed.points_earned,
                claimed_at: claimed.created_at,
              }
            : null,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were worng: ${error}`);
    }
  }

  async findAll(event_id: string, query: QuerySouvenirDto, userId: string) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) throw new NotFoundException(`Event doesn't exists`);
      const findCommitee = await this.prisma.user_event_roles.findFirst({
        where: {
          event_id,
          user_id: userId,
          status: `APPROVED`,
          role: { in: [`COMMITTEE`, `OWNER`] },
        },
      });
      if (!findCommitee)
        throw new ForbiddenException(`You are not allow to give souvenirs`);
      const { page, quantity, search } = query;
      const take = quantity ?? undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const counts = await this.prisma.souvenirs.count({
        where: {
          event_id,
          OR: [{ users: { full_name: { contains: search ?? `` } } }],
        },
      });

      const souvenirs = await this.prisma.souvenirs.findMany({
        skip,
        take,
        orderBy: { created_at: `desc` },
        where: {
          event_id,
          OR: [{ users: { full_name: { contains: search ?? `` } } }],
        },
        include: {
          users: { omit: { password: true } },
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
        },
      });

      return {
        success: true,
        message: `Souvenir has been retrieved`,
        data: souvenirs,
        meta: { counts, page, quantity },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were worng: ${error}`);
    }
  }

  /**
   * Counter: look up a redemption by the voucher QR the visitor shows.
   * Event managers and superadmins only.
   */
  async resolveVoucher(
    event_id: string,
    dto: VoucherCodeDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const { row, event } = await this.findVoucher(
        event_id,
        dto.code,
        userId,
        role,
      );
      const catalog = (
        (event.souvenir_rules ?? {}) as SouvenirRules
      ).tiers?.find((t) => t.id === row.tier_id);
      return {
        success: true,
        message: `Voucher found`,
        data: {
          id: row.id,
          code: row.code,
          status: row.collected_at ? `COLLECTED` : `READY`,
          collectedAt: row.collected_at,
          redeemedAt: row.created_at,
          item: {
            name: row.souvenir_name,
            image: catalog?.image ?? ``,
            points: row.points_spent,
          },
          user: {
            uuid: row.users.uuid,
            full_name: row.users.full_name,
            email: row.users.email,
            photo: row.users.photo,
          },
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were worng: ${error}`);
    }
  }

  /**
   * Counter: hand the item over. Atomic — scanning the same voucher twice (or
   * two counters at once) hands it over exactly once.
   */
  async collect(
    event_id: string,
    dto: VoucherCodeDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const { row } = await this.findVoucher(event_id, dto.code, userId, role);
      const claimed = await this.prisma.souvenirs.updateMany({
        where: { id: row.id, collected_at: null },
        data: {
          collected_at: new Date(),
          collected_by: userId,
          updated_by: userId,
        },
      });
      if (claimed.count === 0) {
        const latest = await this.prisma.souvenirs.findFirst({
          where: { id: row.id },
          select: { collected_at: true },
        });
        throw new ConflictException(
          `Souvenir ini sudah diserahkan${latest?.collected_at ? ` pada ${latest.collected_at.toISOString()}` : ``}`,
        );
      }
      return {
        success: true,
        message: `${row.souvenir_name} diserahkan kepada ${row.users.full_name}`,
        data: { id: row.id, status: `COLLECTED` },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were worng: ${error}`);
    }
  }

  /** Shared lookup for resolveVoucher/collect: manager check + code → redemption. */
  private async findVoucher(
    event_id: string,
    rawCode: string,
    userId: string,
    role?: UserRole,
  ) {
    const event = await this.prisma.events.findFirst({
      where: { uuid: event_id },
    });
    if (!event) throw new NotFoundException(`Event doesn't exists`);
    await assertEventFeature(this.prisma, event_id, 'souvenir');
    if (!(await this.isEventManager(event_id, userId, role))) {
      throw new ForbiddenException(
        `You are not allowed to hand over souvenirs for ${event.name}`,
      );
    }
    const code = normalizeVoucherCode(rawCode);
    if (!code)
      throw new BadRequestException(`Format kode penukaran tidak valid`);
    const row = await this.prisma.souvenirs.findFirst({
      where: { code, event_id },
      include: { users: { omit: { password: true } } },
    });
    if (!row)
      throw new NotFoundException(
        `Kode penukaran tidak ditemukan di event ini`,
      );
    return { row, event };
  }

  /** Superadmin or an approved OWNER/COMMITTEE of the event. */
  private async isEventManager(
    event_id: string,
    userId: string,
    role?: UserRole,
  ): Promise<boolean> {
    if (role === `SUPERADMIN`) return true;
    const manager = await this.prisma.user_event_roles.findFirst({
      where: {
        event_id,
        user_id: userId,
        status: `APPROVED`,
        role: { in: [`COMMITTEE`, `OWNER`] },
      },
    });
    return !!manager;
  }

  /**
   * One redemption. Visible to its owner and to the event's managers only: it
   * carries the redeemer's profile, so it must not be readable by any visitor.
   */
  async findOne(id: number, userId: string, role?: UserRole) {
    try {
      const findSouvenirs = await this.prisma.souvenirs.findFirst({
        where: { id },
        include: {
          users: { omit: { password: true } },
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
        },
      });

      if (!findSouvenirs)
        throw new NotFoundException(`Souvenir doesn't exists`);
      if (
        findSouvenirs.user_id !== userId &&
        !(await this.isEventManager(findSouvenirs.event_id, userId, role))
      ) {
        throw new ForbiddenException(
          `You are not allowed to view this souvenir`,
        );
      }
      return {
        success: true,
        message: `Souvenir has been retrieved`,
        data: findSouvenirs,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were worng: ${error}`);
    }
  }

  /**
   * Cancels a redemption (frees the visitor's one-per-event slot and the item's
   * stock). Event managers and superadmins only — never the redeemer, or the
   * one-souvenir-per-account rule could be undone by deleting one's own row.
   */
  async remove(id: number, userId: string, role?: UserRole) {
    try {
      const findSouvenirs = await this.prisma.souvenirs.findFirst({
        where: { id },
        include: {
          users: { omit: { password: true } },
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
        },
      });

      if (!findSouvenirs)
        throw new NotFoundException(`Souvenir doesn't exists`);
      if (!(await this.isEventManager(findSouvenirs.event_id, userId, role))) {
        throw new ForbiddenException(
          `You are not allowed to remove this souvenir`,
        );
      }
      const dropSouvenir = await this.prisma.souvenirs.delete({
        where: { id },
      });
      return {
        success: true,
        message: `Souvenir has been removed`,
        data: dropSouvenir,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were worng: ${error}`);
    }
  }
}
