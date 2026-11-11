import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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

  async findTopProducts(event_id: string, filter: FilterReportDto) {
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

      const dateWhere = this.buildDateFilter(start_date, end_date);

      const details = await this.prisma.tenant_transaction_details.findMany({
        where: {
          transaction: {
            event_id,
            created_at: dateWhere,
          },
        },
        include: {
          product: {
            include: {
              tenant: {
                select: {
                  uuid: true,
                  name: true,
                  booth_number: true,
                },
              },
            },
          },
          transaction: {
            select: {
              uuid: true,
            },
          },
        },
      });

      const productMap = new Map<
        string,
        {
          uuid: string;
          name: string;
          photo: string;
          price: number;
          tenant_name: string;
          booth_number: string;
          total_qty: number;
          transaction_ids: Set<string>;
          total_revenue: number;
        }
      >();

      for (const d of details) {
        const prod = d.product;
        if (!prod) continue;
        const qty = Number(d.quantity) || 0;
        const unitPrice = Number(d.purchase_price) || Number(prod.price) || 0;
        const rev = qty * unitPrice;

        const existing = productMap.get(prod.uuid);
        if (!existing) {
          productMap.set(prod.uuid, {
            uuid: prod.uuid,
            name: prod.name,
            photo: prod.photo || '',
            price: Number(prod.price) || unitPrice,
            tenant_name: prod.tenant?.name || '-',
            booth_number: prod.tenant?.booth_number || '-',
            total_qty: qty,
            transaction_ids: new Set(
              d.transaction_id ? [d.transaction_id] : [],
            ),
            total_revenue: rev,
          });
        } else {
          existing.total_qty += qty;
          if (d.transaction_id) {
            existing.transaction_ids.add(d.transaction_id);
          }
          existing.total_revenue += rev;
        }
      }

      const results = Array.from(productMap.values())
        .map((item) => ({
          uuid: item.uuid,
          name: item.name,
          photo: item.photo,
          price: item.price,
          tenant_name: item.tenant_name,
          booth_number: item.booth_number,
          total_qty: item.total_qty,
          total_transactions: item.transaction_ids.size,
          total_revenue: item.total_revenue,
        }))
        .sort(
          (a, b) =>
            b.total_qty - a.total_qty || b.total_revenue - a.total_revenue,
        );

      return {
        success: true,
        message: `Top products report retrieved successfully`,
        data: results,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  private generateExportFilename(prefix = 'rekap') {
    const now = new Date();
    const days = [
      'minggu',
      'senin',
      'selasa',
      'rabu',
      'kamis',
      'jumat',
      'sabtu',
    ];
    const months = [
      'januari',
      'februari',
      'maret',
      'april',
      'mei',
      'juni',
      'juli',
      'agustus',
      'september',
      'oktober',
      'november',
      'desember',
    ];
    const dayName = days[now.getDay()];
    const date = String(now.getDate()).padStart(2, '0');
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    return `${prefix} (${dayName}, ${date} ${monthName} ${year}).xlsx`;
  }

  private formatIndonesianDateTime(date: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  private styleTxRow(
    row: ExcelJS.Row,
    index: number,
    border: Partial<ExcelJS.Borders>,
  ) {
    row.height = 22;
    const isZebra = index % 2 === 0;

    row.eachCell((cell, colNumber) => {
      cell.border = border;
      cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };
      if (isZebra) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      }

      if (colNumber === 1 || colNumber === 2 || colNumber === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      } else if (colNumber === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.numFmt = '#,##0';
      } else if (colNumber === 6 || colNumber === 7) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '"Rp "#,##0';
      } else if (colNumber === 8) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 9) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (cell.value === 'Lunas') {
          cell.font = {
            name: 'Segoe UI',
            size: 10,
            bold: true,
            color: { argb: 'FF15803D' },
          };
        } else {
          cell.font = {
            name: 'Segoe UI',
            size: 10,
            bold: true,
            color: { argb: 'FFDC2626' },
          };
        }
      }
    });
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
      const totalTransactions = transactions.reduce(
        (sum, t) => sum + (t._count.tenant_id || 0),
        0,
      );
      const totalAmount = transactions.reduce(
        (sum, t) => sum + (t._sum.amount || 0),
        0,
      );

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Mexpo Platform';
      workbook.created = new Date();

      const borderAll: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };

      const borderHeader: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };

      const borderTotal: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'double', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };

      // ── SHEET 1: RINGKASAN EVENT ───────────────────────────────────────
      const summary = workbook.addWorksheet(`Ringkasan`, {
        views: [{ showGridLines: true }],
      });
      summary.columns = [
        { key: 'metric', width: 34 },
        { key: 'value', width: 28 },
      ];

      const sHeader = summary.addRow(['Metrik', 'Nilai']);
      sHeader.height = 28;
      sHeader.eachCell((cell, colIdx) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E3A8A' },
        };
        cell.font = {
          name: 'Segoe UI',
          size: 11,
          bold: true,
          color: { argb: 'FFFFFFFF' },
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: colIdx === 2 ? 'right' : 'left',
        };
        cell.border = borderHeader;
      });

      const metricsList = [
        { label: 'Event', value: findEvent.name },
        {
          label: 'Total Tenant Terdaftar',
          value: allTenants.length,
          numFmt: '#,##0',
        },
        {
          label: 'Total Visitor Check-in',
          value: totalVisitors,
          numFmt: '#,##0',
        },
        { label: 'Total Transaksi', value: totalTransactions, numFmt: '#,##0' },
        {
          label: 'Total Amount (Rp)',
          value: totalAmount,
          numFmt: '"Rp "#,##0',
        },
      ];

      metricsList.forEach((m, idx) => {
        const r = summary.addRow([m.label, m.value]);
        r.height = 24;
        const isZebra = idx % 2 === 1;
        r.eachCell((cell, colIdx) => {
          cell.border = borderAll;
          cell.font = { name: 'Segoe UI', size: 10 };
          if (isZebra) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' },
            };
          }
          if (colIdx === 1) {
            cell.font = {
              name: 'Segoe UI',
              size: 10,
              bold: true,
              color: { argb: 'FF1E293B' },
            };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          } else {
            if (typeof m.value === 'number') {
              cell.alignment = { vertical: 'middle', horizontal: 'right' };
              if (m.numFmt) cell.numFmt = m.numFmt;
            } else {
              cell.alignment = { vertical: 'middle', horizontal: 'left' };
            }
          }
        });
      });

      // ── SHEET 2: VISITOR PER BOOTH ────────────────────────────────────
      const boothSheet = workbook.addWorksheet(`Visitor per Booth`, {
        views: [{ showGridLines: true }],
      });
      boothSheet.columns = [
        { key: 'no', width: 8 },
        { key: 'name', width: 32 },
        { key: 'booth', width: 16 },
        { key: 'count', width: 20 },
      ];

      const bHeader = boothSheet.addRow([
        'No',
        'Tenant',
        'Booth',
        'Visitor Count',
      ]);
      bHeader.height = 28;
      bHeader.eachCell((c) => {
        c.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E3A8A' },
        };
        c.font = {
          name: 'Segoe UI',
          size: 10,
          bold: true,
          color: { argb: 'FFFFFFFF' },
        };
        c.alignment = { vertical: 'middle', horizontal: 'center' };
        c.border = borderHeader;
      });

      visitedTenants.forEach((t, i) => {
        const c =
          boothVisitors.find((b) => b.tenant_id === t.uuid)?._count.user_id ||
          0;
        const row = boothSheet.addRow([
          i + 1,
          t.name,
          t.booth_number || '-',
          c,
        ]);
        row.height = 22;
        const isZebra = i % 2 === 1;
        row.eachCell((cell, col) => {
          cell.border = borderAll;
          cell.font = { name: 'Segoe UI', size: 10 };
          if (isZebra)
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' },
            };
          if (col === 1 || col === 3)
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          else if (col === 2)
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          else if (col === 4) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = '#,##0';
          }
        });
      });

      // ── SHEET 3: TRANSAKSI PER BOOTH ──────────────────────────────────
      const amountSheet = workbook.addWorksheet(`Transaksi per Booth`, {
        views: [{ showGridLines: true }],
      });
      amountSheet.columns = [
        { key: 'no', width: 8 },
        { key: 'name', width: 32 },
        { key: 'booth', width: 16 },
        { key: 'amount', width: 22 },
        { key: 'count', width: 20 },
      ];

      const aHeader = amountSheet.addRow([
        'No',
        'Tenant',
        'Booth',
        'Amount (Rp)',
        'Jumlah Transaksi',
      ]);
      aHeader.height = 28;
      aHeader.eachCell((c) => {
        c.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E3A8A' },
        };
        c.font = {
          name: 'Segoe UI',
          size: 10,
          bold: true,
          color: { argb: 'FFFFFFFF' },
        };
        c.alignment = { vertical: 'middle', horizontal: 'center' };
        c.border = borderHeader;
      });

      allTenants.forEach((t, i) => {
        const tr = transactions.find((x) => x.tenant_id === t.uuid);
        const amt = tr?._sum.amount || 0;
        const cnt = tr?._count.tenant_id || 0;
        const row = amountSheet.addRow([
          i + 1,
          t.name,
          t.booth_number || '-',
          amt,
          cnt,
        ]);
        row.height = 22;
        const isZebra = i % 2 === 1;
        row.eachCell((cell, col) => {
          cell.border = borderAll;
          cell.font = { name: 'Segoe UI', size: 10 };
          if (isZebra)
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' },
            };
          if (col === 1 || col === 3)
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          else if (col === 2)
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          else if (col === 4) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = '"Rp "#,##0';
          } else if (col === 5) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = '#,##0';
          }
        });
      });

      if (allTenants.length > 0) {
        const totalRowNum = amountSheet.rowCount + 1;
        const totalRow = amountSheet.addRow([
          'TOTAL KESELURUHAN',
          '',
          '',
          totalAmount,
          totalTransactions,
        ]);
        totalRow.height = 26;
        amountSheet.mergeCells(`A${totalRowNum}:C${totalRowNum}`);
        const lCell = totalRow.getCell(1);
        lCell.alignment = { vertical: 'middle', horizontal: 'right' };
        lCell.font = {
          name: 'Segoe UI',
          size: 11,
          bold: true,
          color: { argb: 'FF1E3A8A' },
        };

        const amtCell = totalRow.getCell(4);
        amtCell.alignment = { vertical: 'middle', horizontal: 'right' };
        amtCell.font = {
          name: 'Segoe UI',
          size: 11,
          bold: true,
          color: { argb: 'FF1E3A8A' },
        };
        amtCell.numFmt = '"Rp "#,##0';

        const cntCell = totalRow.getCell(5);
        cntCell.alignment = { vertical: 'middle', horizontal: 'right' };
        cntCell.font = {
          name: 'Segoe UI',
          size: 11,
          bold: true,
          color: { argb: 'FF1E3A8A' },
        };
        cntCell.numFmt = '#,##0';

        totalRow.eachCell({ includeEmpty: true }, (c) => {
          c.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDBEAFE' },
          };
          c.border = borderTotal;
        });
      }

      // ── SHEET 4: PRODUK TERLARIS ──────────────────────────────────────
      const topProductsResult = await this.findTopProducts(event_id, filter);
      const topProducts = topProductsResult.data || [];

      const productSheet = workbook.addWorksheet(`Produk Terlaris`, {
        views: [{ showGridLines: true }],
      });
      productSheet.columns = [
        { key: 'no', width: 8 },
        { key: 'name', width: 32 },
        { key: 'tenant', width: 28 },
        { key: 'booth', width: 14 },
        { key: 'price', width: 18 },
        { key: 'qty', width: 18 },
        { key: 'tx_count', width: 18 },
        { key: 'revenue', width: 22 },
      ];

      const pHeader = productSheet.addRow([
        'No',
        'Nama Produk',
        'Tenant',
        'Booth',
        'Harga Satuan (Rp)',
        'Jumlah Terjual (Qty)',
        'Total Transaksi',
        'Total Omzet (Rp)',
      ]);
      pHeader.height = 28;
      pHeader.eachCell((c) => {
        c.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E3A8A' },
        };
        c.font = {
          name: 'Segoe UI',
          size: 10,
          bold: true,
          color: { argb: 'FFFFFFFF' },
        };
        c.alignment = { vertical: 'middle', horizontal: 'center' };
        c.border = borderHeader;
      });

      let totalProductQty = 0;
      let totalProductRevenue = 0;

      topProducts.forEach((p, i) => {
        totalProductQty += p.total_qty;
        totalProductRevenue += p.total_revenue;
        const row = productSheet.addRow([
          i + 1,
          p.name,
          p.tenant_name,
          p.booth_number || '-',
          p.price,
          p.total_qty,
          p.total_transactions,
          p.total_revenue,
        ]);
        row.height = 22;
        const isZebra = i % 2 === 1;
        row.eachCell((cell, col) => {
          cell.border = borderAll;
          cell.font = { name: 'Segoe UI', size: 10 };
          if (isZebra)
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' },
            };
          if (col === 1 || col === 4) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else if (col === 2 || col === 3) {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          } else if (col === 5 || col === 8) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = '"Rp "#,##0';
          } else if (col === 6 || col === 7) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = '#,##0';
          }
        });
      });

      if (topProducts.length > 0) {
        const totalRow = productSheet.addRow([
          '',
          'TOTAL',
          '',
          '',
          '',
          totalProductQty,
          '',
          totalProductRevenue,
        ]);
        totalRow.height = 24;
        totalRow.getCell(2).alignment = {
          vertical: 'middle',
          horizontal: 'left',
        };
        totalRow.getCell(2).font = {
          name: 'Segoe UI',
          size: 11,
          bold: true,
          color: { argb: 'FF1E3A8A' },
        };
        const qtyCell = totalRow.getCell(6);
        qtyCell.alignment = { vertical: 'middle', horizontal: 'right' };
        qtyCell.font = {
          name: 'Segoe UI',
          size: 11,
          bold: true,
          color: { argb: 'FF1E3A8A' },
        };
        qtyCell.numFmt = '#,##0';

        const revCell = totalRow.getCell(8);
        revCell.alignment = { vertical: 'middle', horizontal: 'right' };
        revCell.font = {
          name: 'Segoe UI',
          size: 11,
          bold: true,
          color: { argb: 'FF1E3A8A' },
        };
        revCell.numFmt = '"Rp "#,##0';

        totalRow.eachCell({ includeEmpty: true }, (c) => {
          c.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDBEAFE' },
          };
          c.border = borderTotal;
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const filename = this.generateExportFilename('rekap');
      return {
        filename,
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
      workbook.creator = 'Mexpo Platform';
      workbook.created = new Date();

      const borderAll: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };

      const borderHeader: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };

      const borderTotal: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'double', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };

      // ── SHEET 1: RINGKASAN ──────────────────────────────────────────────
      const summary = workbook.addWorksheet('Ringkasan', {
        views: [{ showGridLines: true }],
      });

      summary.columns = [
        { key: 'metric', width: 28 },
        { key: 'value', width: 28 },
      ];

      // Table Header Row 1
      const headerRow = summary.addRow(['Metrik', 'Nilai']);
      headerRow.height = 28;
      headerRow.eachCell((cell, colIdx) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E3A8A' },
        };
        cell.font = {
          name: 'Segoe UI',
          size: 11,
          bold: true,
          color: { argb: 'FFFFFFFF' },
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: colIdx === 2 ? 'right' : 'left',
        };
        cell.border = borderHeader;
      });

      const metricsData: Array<{
        label: string;
        value: string | number;
        numFmt?: string;
      }> = [
        { label: 'Tenant', value: tenant.name },
        { label: 'Booth', value: tenant.booth_number || '-' },
        { label: 'Total Booth Visit', value: boothVisits, numFmt: '#,##0' },
        { label: 'Total Transaksi', value: totalTransactions, numFmt: '#,##0' },
        {
          label: 'Total Amount (Rp)',
          value: totalAmount,
          numFmt: '"Rp "#,##0',
        },
      ];

      metricsData.forEach((item, index) => {
        const row = summary.addRow([item.label, item.value]);
        row.height = 24;
        const isZebra = index % 2 === 1;

        row.eachCell((cell, colIdx) => {
          cell.border = borderAll;
          cell.font = { name: 'Segoe UI', size: 10 };
          if (isZebra) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' },
            };
          }
          if (colIdx === 1) {
            cell.font = {
              name: 'Segoe UI',
              size: 10,
              bold: true,
              color: { argb: 'FF1E293B' },
            };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          } else {
            if (typeof item.value === 'number') {
              cell.alignment = { vertical: 'middle', horizontal: 'right' };
              if (item.numFmt) cell.numFmt = item.numFmt;
            } else {
              cell.alignment = { vertical: 'middle', horizontal: 'left' };
            }
          }
        });
      });

      // ── SHEET 2: TRANSAKSI ─────────────────────────────────────────────
      const txSheet = workbook.addWorksheet('Transaksi', {
        views: [{ showGridLines: true }],
      });

      txSheet.columns = [
        { key: 'no', width: 6 },
        { key: 'date', width: 20 },
        { key: 'tx_id', width: 16 },
        { key: 'product', width: 32 },
        { key: 'qty', width: 8 },
        { key: 'price', width: 18 },
        { key: 'subtotal', width: 20 },
        { key: 'method', width: 18 },
        { key: 'status', width: 14 },
      ];

      // Table Header Row
      const txHeaderRow = txSheet.addRow([
        'No',
        'Tanggal',
        'ID Transaksi',
        'Produk',
        'Qty',
        'Harga (Rp)',
        'Subtotal (Rp)',
        'Metode',
        'Status',
      ]);
      txHeaderRow.height = 28;
      txHeaderRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E3A8A' },
        };
        cell.font = {
          name: 'Segoe UI',
          size: 10,
          bold: true,
          color: { argb: 'FFFFFFFF' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = borderHeader;
      });

      let rowIndex = 0;
      let rowNumber = 1;

      transactions.forEach((t) => {
        const details = t.tenantTransactionDetails ?? [];
        const formattedDate = this.formatIndonesianDateTime(
          new Date(t.created_at),
        );
        const txCode = t.uuid ? `#${t.uuid.slice(0, 8).toUpperCase()}` : '-';
        const method = (t.payment_method || '-').toUpperCase();
        const statusText = t.paid ? 'Lunas' : 'Belum';

        if (details.length === 0) {
          rowIndex++;
          const row = txSheet.addRow([
            rowNumber++,
            formattedDate,
            txCode,
            '-',
            0,
            0,
            t.amount,
            method,
            statusText,
          ]);
          this.styleTxRow(row, rowIndex, borderAll);
        } else {
          details.forEach((d) => {
            rowIndex++;
            const prodName = d.product?.name ?? '-';
            const qty = d.quantity || 0;
            const price = d.purchase_price || 0;
            const subtotal = qty * price;

            const row = txSheet.addRow([
              rowNumber++,
              formattedDate,
              txCode,
              prodName,
              qty,
              price,
              subtotal,
              method,
              statusText,
            ]);
            this.styleTxRow(row, rowIndex, borderAll);
          });
        }
      });

      // Total summary row
      if (rowIndex > 0) {
        const totalRowNumber = txSheet.rowCount + 1;
        const totalRow = txSheet.addRow([
          'TOTAL PENJUALAN',
          '',
          '',
          '',
          '',
          '',
          totalAmount,
          '',
          '',
        ]);
        totalRow.height = 26;

        txSheet.mergeCells(`A${totalRowNumber}:F${totalRowNumber}`);
        const totalLabelCell = totalRow.getCell(1);
        totalLabelCell.alignment = { vertical: 'middle', horizontal: 'right' };
        totalLabelCell.font = {
          name: 'Segoe UI',
          size: 11,
          bold: true,
          color: { argb: 'FF1E3A8A' },
        };

        const totalValueCell = totalRow.getCell(7);
        totalValueCell.alignment = { vertical: 'middle', horizontal: 'right' };
        totalValueCell.font = {
          name: 'Segoe UI',
          size: 11,
          bold: true,
          color: { argb: 'FF1E3A8A' },
        };
        totalValueCell.numFmt = '"Rp "#,##0';

        totalRow.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDBEAFE' },
          };
          cell.border = borderTotal;
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const filename = this.generateExportFilename('rekap');
      return {
        filename,
        buffer: Buffer.from(buffer),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }
}
