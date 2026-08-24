import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Prisma, TransactionStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { assertEventFeature } from '../events/event-features';
import {
  CheckoutDto,
  QueryTransactionDto,
  RefundTransactionDto,
  SettleDto,
  UpdatePayoutDto,
} from './dto/payments.dto';
import { MidtransService } from './midtrans.service';

const BUCKET = `expo-project-payment`;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly midtrans: MidtransService,
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
  ) {}

  // ───────────────────────────── Auth helpers ─────────────────────────────

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
        `You are not allowed to manage payments for this event`,
      );
    }
  }

  private async assertVisitor(event_id: string, userId: string) {
    const visitor = await this.prisma.user_event_roles.findFirst({
      where: {
        event_id,
        user_id: userId,
        role: `VISITOR`,
        status: `APPROVED`,
      },
    });
    if (!visitor) {
      throw new ForbiddenException(
        `You must register to this event before paying for a ticket`,
      );
    }
  }

  private async assertAccess(
    event_id: string,
    ownerId: string,
    userId: string,
    role?: UserRole,
  ) {
    if (role === `SUPERADMIN`) return;
    if (userId === ownerId) return;
    await this.assertManager(event_id, userId, role);
  }

  // ───────────────────────────── Helpers ─────────────────────────────

  private platformFee(amount: number): number {
    const percent =
      Number(
        this.configService.get<string>(`PAYMENT_PLATFORM_FEE_PERCENT`) ?? `0`,
      ) || 0;
    return Math.round((amount * percent) / 100);
  }

  private paymentExpiryMs(): number {
    const minutes =
      Number(
        this.configService.get<string>(`MIDTRANS_PAYMENT_EXPIRY`) ?? `1440`,
      ) || 1440;
    return minutes * 60_000;
  }

  private orderIdFor(uuid: string): string {
    return `MXP-${uuid.replace(/-/g, ``).toUpperCase()}`;
  }

  private mapMidtransStatus(
    status: string,
    fraud: string,
  ): TransactionStatus | null {
    switch (status) {
      case `capture`:
        if (fraud === `accept`) return `PAID`;
        if (fraud === `reject`) return `FAILED`;
        return null; // challenge → leave unchanged
      case `settlement`:
        return `PAID`;
      case `pending`:
        return null; // no-op
      case `cancel`:
      case `deny`:
        return `FAILED`;
      case `expire`:
        return `EXPIRED`;
      case `refund`:
      case `refund_partial`:
      case `chargeback`:
      case `partial_chargeback`:
        return `REFUNDED`;
      default:
        return null;
    }
  }

  /**
   * Shared payment-intent factory: (re)uses a non-expired PENDING transaction
   * for the ticket, otherwise creates a new PENDING one + Snap token.
   * Used by both the JWT checkout and the public registration flow.
   */
  async createPaymentForTicket(params: {
    eventId: string;
    ticketId: string;
    userId: string;
    ticketName: string;
    eventName: string;
    amount: number;
    customer: { first_name: string; email: string; phone?: string };
    createdBy: string;
  }): Promise<{
    transaction_uuid: string;
    snap_token: string;
    order_id: string;
    amount: number;
    platform_fee: number;
    redirect_url: string;
  }> {
    const existing = await this.prisma.transactions.findFirst({
      where: { ticket_id: params.ticketId, status: `PENDING` },
      orderBy: { created_at: `desc` },
    });
    if (
      existing &&
      existing.expired_at &&
      existing.expired_at.getTime() > Date.now()
    ) {
      return {
        transaction_uuid: existing.uuid,
        snap_token: existing.snap_token,
        order_id: existing.midtrans_order_id,
        amount: existing.amount,
        platform_fee: existing.platform_fee,
        redirect_url: ``,
      };
    }

    const uuid = randomUUID();
    const orderId = this.orderIdFor(uuid);
    const fee = this.platformFee(params.amount);
    const snap = await this.midtrans.createSnapToken({
      orderId,
      grossAmount: params.amount,
      customerDetails: params.customer,
      itemDetails: [
        {
          id: params.ticketId,
          price: params.amount,
          quantity: 1,
          name: `${params.eventName} · ${params.ticketName}`,
        },
      ],
    });

    const created = await this.prisma.transactions.create({
      data: {
        uuid,
        event_id: params.eventId,
        user_id: params.userId,
        ticket_id: params.ticketId,
        midtrans_order_id: orderId,
        amount: params.amount,
        platform_fee: fee,
        status: `PENDING`,
        snap_token: snap.token,
        expired_at: new Date(Date.now() + this.paymentExpiryMs()),
        created_by: params.createdBy,
        updated_by: params.createdBy,
      },
    });

    return {
      transaction_uuid: created.uuid,
      snap_token: created.snap_token,
      order_id: created.midtrans_order_id,
      amount: created.amount,
      platform_fee: created.platform_fee,
      redirect_url: snap.redirect_url,
    };
  }

  // ───────────────────────────── Checkout ─────────────────────────────

  /** JWT visitor path — ensures a ticket then creates the Snap payment intent. */
  async checkout(event_id: string, dto: CheckoutDto, userId: string) {
    try {
      const event = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!event) throw new NotFoundException(`Event doesn't exists`);
      if (event.ticket_mode !== `PAID`) {
        throw new BadRequestException(
          `This event does not require online payment`,
        );
      }
      await assertEventFeature(this.prisma, event_id, `paidTicket`);
      await this.assertVisitor(event_id, userId);

      let ticket = await this.prisma.tickets.findFirst({
        where: {
          event_id,
          user_id: userId,
          status: { not: `CANCELLED` },
        },
        include: { ticket_type: true },
      });
      if (!ticket) {
        if (!dto.ticket_type_id) {
          throw new BadRequestException(
            `ticket_type_id is required when you don't have a ticket yet`,
          );
        }
        const type = await this.prisma.ticket_types.findFirst({
          where: { uuid: dto.ticket_type_id, event_id },
        });
        if (!type) throw new NotFoundException(`Ticket type doesn't exists`);
        ticket = await this.prisma.tickets.create({
          data: {
            event_id,
            user_id: userId,
            ticket_type_id: type.uuid,
            status: `RESERVED`,
            created_by: userId,
            updated_by: userId,
          },
          include: { ticket_type: true },
        });
      }
      if (!ticket.ticket_type) {
        throw new BadRequestException(`Ticket has no price configured`);
      }

      const user = await this.prisma.users.findFirst({
        where: { uuid: userId },
      });
      const result = await this.createPaymentForTicket({
        eventId: event_id,
        ticketId: ticket.uuid,
        userId,
        ticketName: ticket.ticket_type.name,
        eventName: event.name,
        amount: Math.round(ticket.ticket_type.price),
        customer: {
          first_name: user?.full_name ?? `Visitor`,
          email: user?.email ?? ``,
          phone: user?.phone || undefined,
        },
        createdBy: userId,
      });

      return { success: true, message: `Checkout prepared`, data: result };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  // ───────────────────────────── Notification (webhook) ─────────────────────────────

  async handleNotification(payload: Record<string, unknown>) {
    try {
      // Notification fields arrive as string|number (JSON) or string (form).
      const asString = (v: unknown): string =>
        typeof v === `string` || typeof v === `number` ? String(v) : ``;
      const order_id = asString(payload.order_id);
      const status_code = asString(payload.status_code);
      const gross_amount = asString(payload.gross_amount);
      const signature_key = asString(payload.signature_key);
      const transaction_status = asString(payload.transaction_status);
      const payment_type = asString(payload.payment_type);
      const fraud_status = asString(payload.fraud_status);

      if (!order_id || !signature_key) {
        throw new BadRequestException(`Missing order_id or signature_key`);
      }
      if (
        !this.midtrans.verifySignature({
          order_id,
          status_code,
          gross_amount,
          signature_key,
        })
      ) {
        throw new BadRequestException(`Invalid Midtrans signature`);
      }

      const transaction = await this.prisma.transactions.findFirst({
        where: { midtrans_order_id: order_id },
      });
      if (!transaction) throw new NotFoundException(`Transaction not found`);

      // Gross amount must match the stored price (defense in depth).
      if (Number(gross_amount) !== transaction.amount) {
        throw new BadRequestException(`Gross amount mismatch`);
      }

      const mapped = this.mapMidtransStatus(transaction_status, fraud_status);
      if (!mapped || mapped === transaction.status) {
        return {
          success: true,
          message: `No status change`,
          data: { order_id, status: transaction.status },
        };
      }

      const data: Prisma.transactionsUpdateManyMutationInput = {
        status: mapped,
      };
      if (mapped === `PAID`) {
        data.paid_at = transaction.paid_at ?? new Date();
        if (payment_type) data.payment_method = payment_type;
      } else if (mapped === `EXPIRED`) {
        data.expired_at = transaction.expired_at ?? new Date();
      } else if (mapped === `REFUNDED`) {
        data.refunded_at = transaction.refunded_at ?? new Date();
      }

      // Idempotent: only a PENDING row may move to a final state, so repeated
      // webhooks can never overwrite a settled/failed/refunded status.
      const updated = await this.prisma.transactions.updateMany({
        where: { uuid: transaction.uuid, status: `PENDING` },
        data,
      });

      // Mirror the payment into the ticket so QR/check-in flows work as usual.
      if (updated.count > 0 && mapped === `PAID` && transaction.ticket_id) {
        await this.prisma.tickets.updateMany({
          where: { uuid: transaction.ticket_id, status: { not: `PAID` } },
          data: {
            status: `PAID`,
            payment_reference: transaction.midtrans_order_id,
            payment_method: payment_type || `MIDTRANS`,
          },
        });

        // Promote visitor role to APPROVED once payment succeeds
        await this.prisma.user_event_roles.updateMany({
          where: {
            event_id: transaction.event_id,
            user_id: transaction.user_id,
            role: `VISITOR`,
            status: `PENDING`,
          },
          data: {
            status: `APPROVED`,
            verify_at: new Date(),
          },
        });
      }

      return {
        success: true,
        message: `Notification processed`,
        data: { order_id, status: mapped },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  // ───────────────────────────── Transaction reads ─────────────────────────────

  async findMy(event_id: string, userId: string) {
    try {
      const now = new Date();
      await this.prisma.transactions.updateMany({
        where: {
          event_id,
          user_id: userId,
          status: `PENDING`,
          expired_at: { lt: now },
        },
        data: { status: `EXPIRED` },
      });
      const data = await this.prisma.transactions.findMany({
        where: { event_id, user_id: userId },
        include: { ticket: { include: { ticket_type: true } } },
        orderBy: { created_at: `desc` },
      });
      return { success: true, message: `Your transactions retrieved`, data };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async findOne(id: string, userId: string, role?: UserRole) {
    try {
      const transaction = await this.prisma.transactions.findFirst({
        where: { uuid: id },
        include: {
          ticket: { include: { ticket_type: true } },
          user: { omit: { password: true } },
          event: true,
        },
      });
      if (!transaction)
        throw new NotFoundException(`Transaction doesn't exists`);

      // Lazy expiry — mark stale PENDING transactions EXPIRED on read.
      if (
        transaction.status === `PENDING` &&
        transaction.expired_at &&
        transaction.expired_at.getTime() < Date.now()
      ) {
        await this.prisma.transactions.updateMany({
          where: { uuid: transaction.uuid, status: `PENDING` },
          data: { status: `EXPIRED` },
        });
        transaction.status = `EXPIRED`;
      }

      await this.assertAccess(
        transaction.event_id,
        transaction.user_id,
        userId,
        role,
      );
      return {
        success: true,
        message: `Transaction retrieved`,
        data: transaction,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async findAll(
    event_id: string,
    query: QueryTransactionDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      await this.assertManager(event_id, userId, role);
      const { page, quantity, search } = query;
      const take = quantity ? Number(quantity) : undefined;
      const skip =
        page && quantity ? (Number(page) - 1) * Number(quantity) : undefined;

      const where: Prisma.transactionsWhereInput = {
        event_id,
        ...(search
          ? {
              OR: [
                { midtrans_order_id: { contains: search } },
                { user: { full_name: { contains: search } } },
              ],
            }
          : {}),
      };
      const counts = await this.prisma.transactions.count({ where });
      const data = await this.prisma.transactions.findMany({
        take,
        skip,
        where,
        include: {
          user: { omit: { password: true } },
          ticket: { include: { ticket_type: true } },
        },
        orderBy: { created_at: `desc` },
      });
      return {
        success: true,
        message: `Transactions retrieved`,
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

  // ───────────────────────────── Settlement / payout ─────────────────────────────

  async getSettlementSummary(
    event_id: string,
    userId: string,
    role?: UserRole,
  ) {
    try {
      await this.assertManager(event_id, userId, role);
      const event = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!event) throw new NotFoundException(`Event doesn't exists`);

      const agg = await this.prisma.transactions.aggregate({
        where: { event_id, status: `PAID` },
        _sum: { amount: true, platform_fee: true },
        _count: true,
      });
      const gross = agg._sum.amount ?? 0;
      const fee = agg._sum.platform_fee ?? 0;
      const settlements = await this.prisma.event_settlements.findMany({
        where: { event_id },
        orderBy: { created_at: `desc` },
      });
      const alreadyTransferred = settlements.reduce(
        (sum, s) => sum + s.amount_transferred,
        0,
      );

      return {
        success: true,
        message: `Settlement summary retrieved`,
        data: {
          event_id,
          gross,
          platform_fee: fee,
          net: gross - fee,
          paid_transactions: agg._count,
          already_transferred: alreadyTransferred,
          payout: {
            bank_name: event.payout_bank_name,
            account_number: event.payout_account_number,
            account_holder: event.payout_account_holder,
          },
          payout_status: event.payout_status,
          settled_at: event.settled_at,
          settlements,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async updatePayout(
    event_id: string,
    dto: UpdatePayoutDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const event = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!event) throw new NotFoundException(`Event doesn't exists`);
      await this.assertManager(event_id, userId, role);

      const updated = await this.prisma.events.update({
        where: { uuid: event_id },
        data: {
          payout_bank_name: dto.payout_bank_name ?? event.payout_bank_name,
          payout_account_number:
            dto.payout_account_number ?? event.payout_account_number,
          payout_account_holder:
            dto.payout_account_holder ?? event.payout_account_holder,
          updated_by: userId,
        },
      });
      return {
        success: true,
        message: `Payout account updated`,
        data: updated,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async settle(
    event_id: string,
    dto: SettleDto,
    file: Express.Multer.File | undefined,
    userId: string,
    role?: UserRole,
  ) {
    try {
      if (role !== `SUPERADMIN`) {
        throw new ForbiddenException(
          `Only a super admin can settle event payments`,
        );
      }
      const event = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!event) throw new NotFoundException(`Event doesn't exists`);
      if (event.payout_status === `SETTLED`) {
        throw new ConflictException(`This event has already been settled`);
      }

      const agg = await this.prisma.transactions.aggregate({
        where: { event_id, status: `PAID` },
        _sum: { amount: true, platform_fee: true },
      });
      const net = (agg._sum.amount ?? 0) - (agg._sum.platform_fee ?? 0);
      if (dto.amount_transferred !== net) {
        throw new BadRequestException(
          `amount_transferred must equal the net settlement amount (${net})`,
        );
      }

      let proof = ``;
      if (file) {
        const filename = `${new Date().getTime().toString()}-${file.originalname}`;
        const url = `${this.configService.get<string>(`MINIO_ENDPOINT`)}/${BUCKET}/${filename}`;
        await this.s3Service.upload(
          BUCKET,
          filename,
          file.buffer,
          file.mimetype,
        );
        proof = url;
      }

      const settlement = await this.prisma.$transaction(async (tx) => {
        const created = await tx.event_settlements.create({
          data: {
            event_id,
            amount_transferred: net,
            transferred_by: userId,
            proof_of_transfer: proof,
            note: dto.note ?? ``,
          },
        });
        await tx.events.update({
          where: { uuid: event_id },
          data: {
            payout_status: `SETTLED`,
            settled_at: new Date(),
            updated_by: userId,
          },
        });
        return created;
      });

      return {
        success: true,
        message: `Settlement recorded`,
        data: settlement,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async refund(
    id: string,
    dto: RefundTransactionDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const transaction = await this.prisma.transactions.findFirst({
        where: { uuid: id },
      });
      if (!transaction)
        throw new NotFoundException(`Transaction doesn't exists`);
      await this.assertManager(transaction.event_id, userId, role);

      const updated = await this.prisma.transactions.updateMany({
        where: { uuid: id, status: { in: [`PAID`, `PENDING`] } },
        data: {
          status: `REFUNDED`,
          refund_reason: dto.reason,
          refunded_at: new Date(),
          updated_by: userId,
        },
      });
      if (updated.count === 0) {
        throw new ConflictException(
          `Transaction cannot be refunded from its current status`,
        );
      }
      return {
        success: true,
        message: `Transaction refunded`,
        data: { uuid: id, status: `REFUNDED` },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }
}
