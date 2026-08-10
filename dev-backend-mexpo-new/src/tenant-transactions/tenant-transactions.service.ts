import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTenantTransactionDto } from './dto/create-tenant-transaction.dto';
import { UpdateTenantTransactionDto } from './dto/update-tenant-transaction.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { S3Service } from 'src/s3/s3.service';
import { ConfigService } from '@nestjs/config';
import { QueryTenantTransactionDto } from './dto/query-tenant-transaction.dto';
import { UserRole } from '@prisma/client';
import { assertEventFeature } from 'src/events/event-features';
import { buildOrderBy } from 'src/helper/sort';
import { Prisma } from '@prisma/client';

const TRANSACTION_SORTABLE: Record<
  string,
  (dir: 'asc' | 'desc') => Prisma.tenant_transactionsOrderByWithRelationInput
> = {
  transaction_date: (d) => ({ transaction_date: d }),
  amount: (d) => ({ amount: d }),
  created_at: (d) => ({ created_at: d }),
};

@Injectable()
export class TenantTransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}
  async create(
    tenant_id: string,
    createTenantTransactionDto: CreateTenantTransactionDto,
    userId: string,
    file?: Express.Multer.File,
    role?: UserRole,
  ) {
    try {
      const findTenant = await this.prisma.tenants.findFirst({
        where: { uuid: tenant_id },
      });
      if (!findTenant) throw new NotFoundException(`Tenant doesn't exists`);
      // A2 — pos feature must be enabled for this event.
      await assertEventFeature(this.prisma, findTenant.event_id, 'pos');

      const findTenantMember = await this.prisma.tenant_members.findFirst({
        where: { user_id: userId, tenant_id, status: `APPROVED` },
      });
      if (!findTenantMember && role !== `SUPERADMIN`)
        throw new ForbiddenException(
          `Sorry, you are not allow to add transaction`,
        );
      let proof: string = ``;
      if (file) {
        const filename = `${new Date().getTime().toString()}-${file.originalname}`;
        proof = `${this.configService.get<string>(`MINIO_ENDPOINT`)}/expo-project-transactions/${filename}`;
        await this.s3Service.upload(
          `expo-project-transactions`,
          filename,
          file.buffer,
          file.mimetype,
        );
      }
      const { detail_transactions, payment_method, paid, visitor_id } =
        createTenantTransactionDto;
      if (visitor_id) {
        const visitorRole = await this.prisma.user_event_roles.findFirst({
          where: {
            user_id: visitor_id,
            event_id: findTenant.event_id,
            role: `VISITOR`,
            status: `APPROVED`,
          },
        });
        if (!visitorRole) {
          throw new BadRequestException(
            `Visitor is not registered as an approved visitor of this event`,
          );
        }
      }
      const checkProducts = await this.prisma.tenant_products.findMany({
        where: {
          uuid: { in: detail_transactions.map((it) => it.product_id) },
          tenant_id,
        },
      });
      if (checkProducts.length !== detail_transactions.length)
        throw new ConflictException(`There are unregistered product`);

      let amount = 0;
      const detailTransactions: {
        product_id: string;
        quantity: number;
        purchase_price: number;
      }[] = [];
      detail_transactions.forEach((it) => {
        const { product_id, quantity } = it;
        const findProduct = checkProducts.find((it) => it.uuid === product_id);
        amount += quantity * (findProduct?.price || 0);
        detailTransactions.push({
          product_id,
          quantity,
          purchase_price: findProduct?.price || 0,
        });
      });

      const newTransactions = await this.prisma.tenant_transactions.create({
        data: {
          amount,
          proof,
          payment_method: payment_method ?? ``,
          paid: paid ?? false,
          visitor_id: visitor_id ?? null,
          event_id: findTenant.event_id,
          tenant_id,
          created_by: userId,
          updated_by: userId,
          tenantTransactionDetails: {
            createMany: {
              skipDuplicates: true,
              data: detailTransactions,
            },
          },
        },
      });
      return {
        success: true,
        message: `New transactions has created`,
        data: newTransactions,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async findAll(
    tenant_id: string,
    query: QueryTenantTransactionDto,
    userId: string,
    role?: UserRole,
  ) {
    try {
      const findTenant = await this.prisma.tenants.findFirst({
        where: { uuid: tenant_id },
      });
      if (!findTenant) throw new NotFoundException(`Tenant doesn't exists`);

      const findTenantMember = await this.prisma.tenant_members.findFirst({
        where: { user_id: userId, tenant_id, status: `APPROVED` },
      });
      if (!findTenantMember && role !== `SUPERADMIN`)
        throw new ForbiddenException(
          `Sorry, you are not allow to fetch transaction`,
        );
      const { page, quantity, search, start_date, end_date } = query;
      const take = quantity ?? undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;
      // Date range filter (end_date inclusive).
      const created_at = {
        ...(start_date ? { gte: start_date } : {}),
        ...(end_date
          ? { lte: new Date(end_date.getTime() + 24 * 60 * 60 * 1000) }
          : {}),
      };
      const whereDate = Object.keys(created_at).length ? created_at : undefined;
      // Search by payment reference or product name (nested detail).
      const whereSearch = search
        ? {
            OR: [
              { payment_reference: { contains: search } },
              {
                tenantTransactionDetails: {
                  some: { product: { name: { contains: search } } },
                },
              },
            ],
          }
        : undefined;

      const counts = await this.prisma.tenant_transactions.count({
        where: {
          tenant_id,
          created_at: whereDate,
          ...whereSearch,
        },
      });

      const transactions = await this.prisma.tenant_transactions.findMany({
        skip,
        take,
        orderBy: buildOrderBy(
          query.sort_by,
          query.sort_dir,
          TRANSACTION_SORTABLE,
          { transaction_date: `desc` },
        ) as Prisma.tenant_transactionsOrderByWithRelationInput,
        where: {
          tenant_id,
          created_at: whereDate,
          ...whereSearch,
        },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
          tenantTransactionDetails: {
            include: { product: true },
          },
        },
      });

      return {
        success: true,
        message: `Transaction of tenant has retrieved`,
        data: transactions,
        meta: { page, quantity, counts },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async findOne(id: string) {
    try {
      const findTransaction = await this.prisma.tenant_transactions.findFirst({
        where: { uuid: id },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
          tenantTransactionDetails: {
            include: { product: true },
          },
        },
      });
      if (!findTransaction)
        throw new NotFoundException(`Transaction doesn't exists`);
      return {
        success: true,
        message: `Transaction of tenant has retrieved`,
        data: findTransaction,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async update(
    id: string,
    updateTenantTransactionDto: UpdateTenantTransactionDto,
    userId: string,
    file?: Express.Multer.File,
    role?: UserRole,
  ) {
    try {
      const findTransaction = await this.prisma.tenant_transactions.findFirst({
        where: { uuid: id },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
        },
      });
      if (!findTransaction)
        throw new NotFoundException(`Transaction doesn't exists`);
      const findTenantMember = await this.prisma.tenant_members.findFirst({
        where: {
          user_id: userId,
          tenant_id: findTransaction.tenant_id,
          status: `APPROVED`,
        },
      });
      if (!findTenantMember && role !== `SUPERADMIN`)
        throw new ForbiddenException(
          `Sorry, you are not allow to update transaction`,
        );
      let proof = findTransaction.proof;
      if (file) {
        const oldFileUrl = findTransaction.proof;
        if (oldFileUrl) {
          const oldFilename = oldFileUrl.split('/').pop() || '';
          await this.s3Service.delete(`expo-project-transactions`, oldFilename);
        }
        const filename = `${new Date().getTime().toString()}-${file.originalname}`;
        proof = `${this.configService.get<string>(`MINIO_ENDPOINT`)}/expo-project-transactions/${filename}`;
        await this.s3Service.upload(
          `expo-project-transactions`,
          filename,
          file.buffer,
          file.mimetype,
        );
      }
      const { detail_transactions, payment_method, paid, visitor_id } =
        updateTenantTransactionDto;
      let amount = findTransaction.amount;
      if (detail_transactions) {
        await this.prisma.tenant_transaction_details.deleteMany({
          where: { transaction_id: id },
        });

        const checkProducts = await this.prisma.tenant_products.findMany({
          where: {
            uuid: { in: detail_transactions.map((it) => it.product_id) },
            tenant_id: findTransaction.tenant_id,
          },
        });
        if (checkProducts.length !== detail_transactions.length)
          throw new ConflictException(`There are unregistered product`);
        amount = 0;
        const detailTransactions: {
          product_id: string;
          quantity: number;
          purchase_price: number;
          transaction_id: string;
        }[] = [];
        detail_transactions.forEach((it) => {
          const { product_id, quantity } = it;
          const findProduct = checkProducts.find(
            (it) => it.uuid === product_id,
          );
          amount += quantity * (findProduct?.price || 0);
          detailTransactions.push({
            product_id,
            quantity,
            purchase_price: findProduct?.price || 0,
            transaction_id: id,
          });
        });

        await this.prisma.tenant_transaction_details.createMany({
          data: detailTransactions,
        });
      }
      const updateTransaction = await this.prisma.tenant_transactions.update({
        where: { uuid: id },
        data: {
          amount,
          proof,
          payment_method: payment_method ?? findTransaction.payment_method,
          paid: paid ?? findTransaction.paid,
          visitor_id: visitor_id ?? findTransaction.visitor_id,
          updated_by: userId,
        },
      });
      return {
        success: true,
        message: `Transaction has been updated`,
        data: updateTransaction,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async remove(id: string, userId: string, role?: UserRole) {
    try {
      const findTransaction = await this.prisma.tenant_transactions.findFirst({
        where: { uuid: id },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
        },
      });
      if (!findTransaction)
        throw new NotFoundException(`Transaction doesn't exists`);
      const findTenantMember = await this.prisma.tenant_members.findFirst({
        where: {
          user_id: userId,
          tenant_id: findTransaction.tenant_id,
          status: `APPROVED`,
          role: `OWNER`,
        },
      });
      if (!findTenantMember && role !== `SUPERADMIN`)
        throw new ForbiddenException(
          `Only the tenant owner can remove a transaction`,
        );
      const oldFileUrl = findTransaction.proof;
      if (oldFileUrl !== ``) {
        const oldFilename = oldFileUrl.split('/').pop() || '';
        await this.s3Service.delete(`expo-project-transactions`, oldFilename);
      }
      await this.prisma.tenant_transaction_details.deleteMany({
        where: { transaction_id: id },
      });
      const dropTransaction = await this.prisma.tenant_transactions.delete({
        where: { uuid: id },
      });

      return {
        success: true,
        message: `Transaction has removed`,
        data: dropTransaction,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }
}
