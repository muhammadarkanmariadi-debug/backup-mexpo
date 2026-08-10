import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterReportDto } from './dto/filter-report.dto';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Builds a Prisma `created_at` filter that supports partial date ranges
   * (from-only or to-only). `end_date` is inclusive (+24h).
   */
  private buildDateFilter(start_date?: Date, end_date?: Date) {
    const filter: { gte?: Date; lte?: Date } = {};
    if (start_date) filter.gte = start_date;
    if (end_date) {
      filter.lte = new Date(end_date.getTime() + 24 * 60 * 60 * 1000);
    }
    return Object.keys(filter).length ? filter : undefined;
  }

  async findBoothVisitor(event_id: string, filter: FilterReportDto) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) throw new NotFoundException(`Event doesn't exists`);

      const { start_date, end_date, page, quantity } = filter;
      if (start_date && end_date) {
        if (start_date > end_date)
          throw new BadRequestException(
            `Start date must be less than End Date`,
          );
      }
      const take = quantity ?? undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;
      const allBoothVisitor = await this.prisma.booth_visits.groupBy({
        by: [`tenant_id`],
        where: {
          event_id,
          created_at: this.buildDateFilter(start_date, end_date),
        },
        _count: { user_id: true },
        orderBy: { _count: { user_id: `desc` } },
      });
      const counts = allBoothVisitor.length;
      const allTenants = await this.prisma.tenants.findMany({
        where: { uuid: { in: allBoothVisitor.map((it) => it.tenant_id) } },
      });
      const allBooth = allTenants
        .map((item) => {
          const findVisitorCount = allBoothVisitor.find(
            (it) => it.tenant_id === item.uuid,
          );
          return {
            ...item,
            counts: findVisitorCount?._count.user_id || 0,
          };
        })
        .sort((a, b) => b.counts - a.counts);
      const findBoothVisitor =
        typeof skip !== `undefined` && typeof take !== `undefined`
          ? allBooth.slice(skip, skip + take)
          : allBooth;
      return {
        success: true,
        message: `Visitor report each tenant has retireved`,
        data: findBoothVisitor,
        meta: { page, quantity, counts },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async findCategoryVisitor(event_id: string, filter: FilterReportDto) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) throw new NotFoundException(`Event doesn't exists`);

      const { start_date, end_date, page, quantity } = filter;
      if (start_date && end_date) {
        if (start_date > end_date)
          throw new BadRequestException(
            `Start date must be less than End Date`,
          );
      }
      const take = quantity ?? undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const tenantVisitor = await this.prisma.booth_visits.groupBy({
        by: [`tenant_id`],
        where: {
          event_id,
          created_at: this.buildDateFilter(start_date, end_date),
        },
        _count: { user_id: true },
      });

      const allTenants = await this.prisma.tenants.findMany({
        where: { uuid: { in: tenantVisitor.map((it) => it.tenant_id) } },
      });
      const allTenantVisitorCount = allTenants.map((it) => {
        const findVisitorCount = tenantVisitor.find(
          (item) => item.tenant_id === it.uuid,
        );
        return {
          ...it,
          count: findVisitorCount?._count.user_id || 0,
        };
      });

      const tenantCategories = await this.prisma.tenant_categories.findMany({
        where: {
          uuid: {
            in: allTenantVisitorCount
              .filter((it) => it.category_id !== null)
              .map((it) => it.category_id!),
          },
        },
      });
      const allCategoriesVisitor = tenantCategories
        .map((category) => {
          const visitorCount = allTenantVisitorCount.filter(
            (item) => item.category_id === category.uuid,
          );
          const totalCount = visitorCount.reduce(
            (count, it) => count + (it?.count || 0),
            0,
          );
          return {
            ...category,
            count: totalCount,
          };
        })
        .sort((a, b) => b.count - a.count);

      const findCategoryVisitor =
        typeof skip !== `undefined` && typeof take !== `undefined`
          ? allCategoriesVisitor.slice(skip, skip + take)
          : allCategoriesVisitor;
      return {
        success: true,
        message: `Visitor report each tenant's category has retireved`,
        data: findCategoryVisitor,
        meta: { page, quantity, counts: allCategoriesVisitor.length },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async findAllEventVisitor(event_id: string, filter: FilterReportDto) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) throw new NotFoundException(`Event doesn't exists`);

      const { start_date, end_date } = filter;
      if (start_date && end_date) {
        if (start_date > end_date)
          throw new BadRequestException(
            `Start date must be less than End Date`,
          );
      }

      const eventVisitor = await this.prisma.log_attendances.count({
        where: {
          event_id,
          created_at: this.buildDateFilter(start_date, end_date),
        },
      });
      return {
        success: true,
        message: `Event has retrieved`,
        data: { ...findEvent, counts: eventVisitor },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async findTransactionEachBooth(event_id: string, filter: FilterReportDto) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) throw new NotFoundException(`Event doesn't exists`);

      const { start_date, end_date, page, quantity } = filter;
      if (start_date && end_date) {
        if (start_date > end_date)
          throw new BadRequestException(
            `Start date must be less than End Date`,
          );
      }
      const take = quantity ?? undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const tenant_transaction = await this.prisma.tenant_transactions.groupBy({
        by: [`tenant_id`],
        where: {
          event_id,
          created_at: this.buildDateFilter(start_date, end_date),
        },
        _sum: { amount: true },
        _count: { tenant_id: true },
      });

      const allTenants = await this.prisma.tenants.findMany({
        where: { event_id, status: `APPROVED` },
      });

      const allTenantAmount = allTenants
        .map((item) => {
          const { uuid } = item;
          const findTransactionAmount = tenant_transaction.find(
            (it) => it.tenant_id === uuid,
          );
          return {
            ...item,
            amount: findTransactionAmount?._sum.amount || 0,
            count_transaction: findTransactionAmount?._count.tenant_id || 0,
          };
        })
        .sort((a, b) => b.amount - a.amount);

      const findTenantsAmount =
        typeof skip !== `undefined` && typeof take !== `undefined`
          ? allTenantAmount.slice(skip, skip + take)
          : allTenantAmount;

      return {
        success: true,
        message: `Tenants amount has retireved`,
        data: findTenantsAmount,
        meta: { counts: allTenantAmount.length, page, quantity },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async findTransactionByCategory(event_id: string, filter: FilterReportDto) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) throw new NotFoundException(`Event doesn't exists`);

      const { start_date, end_date, page, quantity } = filter;
      if (start_date && end_date) {
        if (start_date > end_date)
          throw new BadRequestException(
            `Start date must be less than End Date`,
          );
      }
      const take = quantity ?? undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const tenant_transaction = await this.prisma.tenant_transactions.groupBy({
        by: [`tenant_id`],
        where: {
          event_id,
          created_at: this.buildDateFilter(start_date, end_date),
        },
        _sum: { amount: true },
        _count: { tenant_id: true },
      });

      const allTenants = await this.prisma.tenants.findMany({
        where: { uuid: { in: tenant_transaction.map((it) => it.tenant_id) } },
      });
      const allTenantAmount = allTenants.map((tenant) => {
        const findAmount = tenant_transaction.find(
          (it) => it.tenant_id == tenant.uuid,
        );
        return {
          ...tenant,
          amount: findAmount?._sum.amount || 0,
          count_transaction: findAmount?._count.tenant_id || 0,
        };
      });

      const tenantCategories = await this.prisma.tenant_categories.findMany({
        where: {
          uuid: {
            in: allTenantAmount
              .filter((it) => it.category_id !== null)
              .map((it) => it.category_id!),
          },
        },
      });

      const allCategoriesAmount = tenantCategories
        .map((category) => {
          const findTransactionByCategory = allTenantAmount.filter(
            (it) => it.category_id === category.uuid,
          );
          const totalAmount = findTransactionByCategory.reduce(
            (count, it) => count + it.amount,
            0,
          );
          const countTransaction = findTransactionByCategory.reduce(
            (count, it) => count + it.count_transaction,
            0,
          );
          return {
            ...category,
            amount: totalAmount,
            count_transaction: countTransaction,
          };
        })
        .sort((a, b) => b.amount - a.amount);

      const findCategoriesAmount =
        typeof take !== `undefined` && typeof skip !== `undefined`
          ? allCategoriesAmount.slice(skip, skip + take)
          : allCategoriesAmount;

      return {
        success: true,
        message: `Amount of categories has retrieved`,
        data: findCategoriesAmount,
        meta: { counts: allCategoriesAmount.length, page, quantity },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async findAmountByEvent(event_id: string, filter: FilterReportDto) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) throw new NotFoundException(`Event doesn't exists`);

      const { start_date, end_date } = filter;
      if (start_date && end_date) {
        if (start_date > end_date)
          throw new BadRequestException(
            `Start date must be less than End Date`,
          );
      }

      const allAmount = await this.prisma.tenant_transactions.groupBy({
        by: [`event_id`],
        where: {
          event_id,
          created_at: this.buildDateFilter(start_date, end_date),
        },
        _sum: { amount: true },
      });

      return {
        success: true,
        message: `Amount for this event has retrieved`,
        data: {
          ...findEvent,
          amounts: allAmount.reduce(
            (count, it) => count + (it?._sum?.amount || 0),
            0,
          ),
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  /** A16 — Excel (.xlsx) export of the event's key reports. */
  async exportExcel(event_id: string, filter: FilterReportDto) {
    try {
      const findEvent = await this.prisma.events.findFirst({
        where: { uuid: event_id },
      });
      if (!findEvent) throw new NotFoundException(`Event doesn't exists`);

      const { start_date, end_date } = filter;
      const dateWhere = this.buildDateFilter(start_date, end_date);

      const boothVisitors = await this.prisma.booth_visits.groupBy({
        by: [`tenant_id`],
        where: { event_id, created_at: dateWhere },
        _count: { user_id: true },
        orderBy: { _count: { user_id: `desc` } },
      });
      const visitedTenants = await this.prisma.tenants.findMany({
        where: { uuid: { in: boothVisitors.map((b) => b.tenant_id) } },
      });
      const allTenants = await this.prisma.tenants.findMany({
        where: { event_id, status: `APPROVED` },
      });
      const transactions = await this.prisma.tenant_transactions.groupBy({
        by: [`tenant_id`],
        where: { event_id, created_at: dateWhere },
        _sum: { amount: true },
        _count: { tenant_id: true },
      });
      const totalVisitors = await this.prisma.log_attendances.count({
        where: { event_id, created_at: dateWhere },
      });
      const totalTransactions = transactions.length;
      const totalAmount = transactions.reduce(
        (sum, t) => sum + (t._sum.amount || 0),
        0,
      );

      const workbook = new ExcelJS.Workbook();

      const summary = workbook.addWorksheet(`Ringkasan`);
      summary.columns = [
        { header: `Metrik`, key: `metric`, width: 28 },
        { header: `Nilai`, key: `value`, width: 24 },
      ];
      summary.addRows([
        { metric: `Event`, value: findEvent.name },
        { metric: `Total Visitor Check-in`, value: totalVisitors },
        { metric: `Total Transaksi`, value: totalTransactions },
        { metric: `Total Amount (Rp)`, value: totalAmount },
      ]);

      const boothSheet = workbook.addWorksheet(`Visitor per Booth`);
      boothSheet.columns = [
        { header: `Tenant`, key: `name`, width: 30 },
        { header: `Booth`, key: `booth`, width: 16 },
        { header: `Visitor Count`, key: `count`, width: 15 },
      ];
      visitedTenants.forEach((t) => {
        const c =
          boothVisitors.find((b) => b.tenant_id === t.uuid)?._count.user_id ||
          0;
        boothSheet.addRow({ name: t.name, booth: t.booth_number, count: c });
      });

      const amountSheet = workbook.addWorksheet(`Transaksi per Booth`);
      amountSheet.columns = [
        { header: `Tenant`, key: `name`, width: 30 },
        { header: `Booth`, key: `booth`, width: 16 },
        { header: `Amount (Rp)`, key: `amount`, width: 18 },
        { header: `Jumlah Transaksi`, key: `count`, width: 18 },
      ];
      allTenants.forEach((t) => {
        const tr = transactions.find((x) => x.tenant_id === t.uuid);
        amountSheet.addRow({
          name: t.name,
          booth: t.booth_number,
          amount: tr?._sum.amount || 0,
          count: tr?._count.tenant_id || 0,
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const safeName = findEvent.name.replace(/[^\w-]+/g, `_`).slice(0, 40);
      return {
        filename: `report-${safeName || 'event'}.xlsx`,
        buffer: Buffer.from(buffer),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  /** A16 — tenant-scoped Excel export (only this tenant's rows). */
  async exportTenantExcel(
    event_id: string,
    tenant_id: string,
    filter: FilterReportDto,
  ) {
    try {
      const tenant = await this.prisma.tenants.findFirst({
        where: { uuid: tenant_id, event_id },
      });
      if (!tenant) throw new NotFoundException(`Tenant doesn't exists`);

      const { start_date, end_date } = filter;
      const dateWhere = this.buildDateFilter(start_date, end_date);

      const boothVisits = await this.prisma.booth_visits.count({
        where: { event_id, tenant_id, created_at: dateWhere },
      });
      const transactions = await this.prisma.tenant_transactions.findMany({
        where: { event_id, tenant_id, created_at: dateWhere },
        orderBy: { created_at: `desc` },
        include: {
          tenantTransactionDetails: { include: { product: true } },
        },
      });
      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      const totalTransactions = transactions.length;

      const workbook = new ExcelJS.Workbook();

      const summary = workbook.addWorksheet(`Ringkasan`);
      summary.columns = [
        { header: `Metrik`, key: `metric`, width: 28 },
        { header: `Nilai`, key: `value`, width: 24 },
      ];
      summary.addRows([
        { metric: `Tenant`, value: tenant.name },
        { metric: `Booth`, value: tenant.booth_number || `-` },
        { metric: `Total Booth Visit`, value: boothVisits },
        { metric: `Total Transaksi`, value: totalTransactions },
        { metric: `Total Amount (Rp)`, value: totalAmount },
      ]);

      const txSheet = workbook.addWorksheet(`Transaksi`);
      txSheet.columns = [
        { header: `Tanggal`, key: `date`, width: 22 },
        { header: `Produk`, key: `product`, width: 30 },
        { header: `Qty`, key: `qty`, width: 8 },
        { header: `Harga (Rp)`, key: `price`, width: 16 },
        { header: `Subtotal (Rp)`, key: `subtotal`, width: 18 },
        { header: `Metode`, key: `method`, width: 14 },
        { header: `Status`, key: `status`, width: 14 },
      ];
      transactions.forEach((t) => {
        const details = t.tenantTransactionDetails ?? [];
        if (details.length === 0) {
          txSheet.addRow({
            date: t.created_at.toISOString(),
            product: `-`,
            qty: 0,
            price: 0,
            subtotal: t.amount,
            method: t.payment_method || `-`,
            status: t.paid ? `Lunas` : `Belum`,
          });
        } else {
          details.forEach((d) => {
            txSheet.addRow({
              date: t.created_at.toISOString(),
              product: d.product?.name ?? `-`,
              qty: d.quantity,
              price: d.purchase_price,
              subtotal: d.quantity * d.purchase_price,
              method: t.payment_method || `-`,
              status: t.paid ? `Lunas` : `Belum`,
            });
          });
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const safeName = tenant.name.replace(/[^\w-]+/g, `_`).slice(0, 40);
      return {
        filename: `report-${safeName || 'tenant'}.xlsx`,
        buffer: Buffer.from(buffer),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }
}
