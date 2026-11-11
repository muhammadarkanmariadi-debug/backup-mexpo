import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { ReorderFaqDto } from './dto/reorder-faq.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FaqsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPublic(category?: string) {
    const where: Prisma.faqsWhereInput = {
      is_published: true,
    };

    if (category && category !== 'Semua') {
      where.category = category;
    }

    const items = await this.prisma.faqs.findMany({
      where,
      orderBy: [{ order: 'asc' }, { created_at: 'desc' }],
    });

    // Also get distinct categories
    const categoriesRaw = await this.prisma.faqs.findMany({
      where: { is_published: true },
      select: { category: true },
      distinct: ['category'],
    });

    const categories = [
      'Semua',
      ...categoriesRaw.map((c) => c.category).filter(Boolean),
    ];

    return {
      status: true,
      message: 'Berhasil mengambil daftar FAQ',
      data: items,
      categories: Array.from(new Set(categories)),
    };
  }

  async findAllAdmin(search?: string, category?: string) {
    const where: Prisma.faqsWhereInput = {};

    if (category && category !== 'Semua') {
      where.category = category;
    }

    if (search && search.trim() !== '') {
      const term = search.trim();
      where.OR = [
        { question: { contains: term } },
        { answer: { contains: term } },
        { category: { contains: term } },
      ];
    }

    const items = await this.prisma.faqs.findMany({
      where,
      orderBy: [{ order: 'asc' }, { created_at: 'desc' }],
      include: {
        creator: { select: { uuid: true, full_name: true, email: true } },
        editor: { select: { uuid: true, full_name: true, email: true } },
      },
    });

    const categoriesRaw = await this.prisma.faqs.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    const categories = [
      'Semua',
      ...categoriesRaw.map((c) => c.category).filter(Boolean),
    ];

    return {
      status: true,
      message: 'Berhasil mengambil seluruh daftar FAQ',
      data: items,
      categories: Array.from(new Set(categories)),
    };
  }

  async findOne(uuid: string) {
    const faq = await this.prisma.faqs.findUnique({
      where: { uuid },
      include: {
        creator: { select: { uuid: true, full_name: true, email: true } },
        editor: { select: { uuid: true, full_name: true, email: true } },
      },
    });

    if (!faq) {
      throw new NotFoundException('FAQ tidak ditemukan');
    }

    return {
      status: true,
      data: faq,
    };
  }

  async create(dto: CreateFaqDto, userId: string) {
    // If order is not specified, assign next order number
    let order = dto.order;
    if (order === undefined || order === null) {
      const maxOrder = await this.prisma.faqs.aggregate({
        _max: { order: true },
      });
      order = (maxOrder._max.order ?? -1) + 1;
    }

    const created = await this.prisma.faqs.create({
      data: {
        question: dto.question,
        answer: dto.answer,
        category: dto.category ?? 'Umum',
        order,
        is_published: dto.is_published ?? true,
        created_by: userId,
        updated_by: userId,
      },
    });

    return {
      status: true,
      message: 'FAQ berhasil ditambahkan',
      data: created,
    };
  }

  async update(uuid: string, dto: UpdateFaqDto, userId: string) {
    const existing = await this.prisma.faqs.findUnique({
      where: { uuid },
    });
    if (!existing) {
      throw new NotFoundException('FAQ tidak ditemukan');
    }

    const updated = await this.prisma.faqs.update({
      where: { uuid },
      data: {
        ...(dto.question !== undefined && { question: dto.question }),
        ...(dto.answer !== undefined && { answer: dto.answer }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.is_published !== undefined && {
          is_published: dto.is_published,
        }),
        updated_by: userId,
      },
    });

    return {
      status: true,
      message: 'FAQ berhasil diperbarui',
      data: updated,
    };
  }

  async reorder(dto: ReorderFaqDto, userId: string) {
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.faqs.update({
          where: { uuid: item.uuid },
          data: {
            order: item.order,
            updated_by: userId,
          },
        }),
      ),
    );

    return {
      status: true,
      message: 'Urutan FAQ berhasil disimpan',
    };
  }

  async remove(uuid: string) {
    const existing = await this.prisma.faqs.findUnique({
      where: { uuid },
    });
    if (!existing) {
      throw new NotFoundException('FAQ tidak ditemukan');
    }

    await this.prisma.faqs.delete({
      where: { uuid },
    });

    return {
      status: true,
      message: 'FAQ berhasil dihapus',
    };
  }
}
