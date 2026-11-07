import {
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
import { evaluateSouvenirEligibility } from './souvenir-rules';

@Injectable()
export class SouvenirsService {
  constructor(private readonly prisma: PrismaService) {}
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

      // A5 — centralized eligibility (minVisitedBooth, joinedSeminar, requireAll).
      const eligibility = await evaluateSouvenirEligibility(
        this.prisma,
        findEvent,
        user_id,
      );
      if (!eligibility.eligible) {
        throw new ForbiddenException(
          `Souvenir belum bisa diklaim: ${eligibility.reasons.join(', ')}`,
        );
      }

      // Standard mode: one souvenir per visitor per event.
      // Point mode: points are a spendable balance — a visitor can redeem
      // repeatedly until the remaining points fall below the cheapest tier.
      let souvenirName = `Standard Souvenir`;
      let pointsEarned = 0;
      let pointsSpent = 0;
      if (eligibility.usePointSystem) {
        const selected = createSouvenirDto.tier_id
          ? eligibility.eligibleTiers.find(
              (t) => t.id === createSouvenirDto.tier_id,
            )
          : eligibility.recommendedTier;
        if (!selected) {
          throw new ForbiddenException(
            `Poin kurang untuk jenis souvenir yang dipilih (sisa ${eligibility.availablePoints} poin)`,
          );
        }
        if (selected.minPoints <= 0) {
          const already = await this.prisma.souvenirs.findFirst({
            where: { event_id, user_id, souvenir_name: selected.name },
          });
          if (already)
            throw new ConflictException(
              `Souvenir gratis ini sudah diambil visitor`,
            );
        }
        souvenirName = selected.name;
        pointsEarned = eligibility.totalPoints;
        pointsSpent = selected.minPoints;
      } else {
        const findExistingSouvenir = await this.prisma.souvenirs.findFirst({
          where: { event_id, user_id },
        });
        if (findExistingSouvenir)
          throw new ConflictException(
            `Visitor sudah mengambil suvenir dan tidak dapat mengambil suvenir lagi`,
          );
      }

      const newSouvenir = await this.prisma.souvenirs.create({
        data: {
          user_id,
          event_id,
          souvenir_name: souvenirName,
          points_earned: pointsEarned,
          points_spent: pointsSpent,
          created_by: userId,
          updated_by: userId,
        },
      });
      return {
        success: true,
        message: eligibility.usePointSystem
          ? `${souvenirName} diberikan. Sisa poin: ${eligibility.availablePoints - pointsSpent}`
          : `New Souvernir has given to visitor`,
        data: newSouvenir,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were worng: ${error}`);
    }
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
      // Point mode allows repeated redemption; only standard mode is one-time.
      const alreadyClaimed = eligibility.usePointSystem ? false : !!claimed;

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

  async findOne(id: number) {
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

  async remove(id: number) {
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
