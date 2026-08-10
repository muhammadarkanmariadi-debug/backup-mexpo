import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTenantCategoryDto } from './dto/create-tenant-category.dto';
import { UpdateTenantCategoryDto } from './dto/update-tenant-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryTenantCategoryDto } from './dto/query-tenant-category.dto';

@Injectable()
export class TenantCategoriesService {
  constructor(private readonly prisma: PrismaService) {}
  async create(
    createTenantCategoryDto: CreateTenantCategoryDto,
    userId: string,
  ) {
    try {
      const { name } = createTenantCategoryDto;
      const findExistingName = await this.prisma.tenant_categories.findFirst({
        where: { name },
      });
      if (findExistingName)
        throw new ConflictException(`Category '${name}' already exists`);
      const newCategory = await this.prisma.tenant_categories.create({
        data: { name, created_by: userId, updated_by: userId },
      });
      return {
        success: true,
        message: `New tenant category has created`,
        data: newCategory,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async findAll(queryTenantCategoryDto: QueryTenantCategoryDto) {
    try {
      const { page, quantity, search } = queryTenantCategoryDto;
      const take = quantity ?? undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const counts = await this.prisma.tenant_categories.count({
        where: {
          OR: [{ name: { contains: search ?? `` } }],
        },
      });

      const categories = await this.prisma.tenant_categories.findMany({
        skip,
        take,
        orderBy: { name: `asc` },
        where: {
          OR: [{ name: { contains: search ?? `` } }],
        },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
        },
      });

      return {
        success: true,
        message: `Categories has retrieved successfully`,
        data: categories,
        meta: { page, quantity, counts },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async findOne(id: string) {
    try {
      const findCategory = await this.prisma.tenant_categories.findFirst({
        where: { uuid: id },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
        },
      });
      if (!findCategory) throw new NotFoundException(`Category doesn't exists`);
      return {
        success: true,
        message: `Category has retrieved successfully`,
        data: findCategory,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async update(id: string, updateTenantCategoryDto: UpdateTenantCategoryDto) {
    try {
      const findCategory = await this.prisma.tenant_categories.findFirst({
        where: { uuid: id },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
        },
      });
      if (!findCategory) throw new NotFoundException(`Category doesn't exists`);
      const { name } = updateTenantCategoryDto;
      const updateCategory = await this.prisma.tenant_categories.update({
        where: { uuid: id },
        data: { name: name ?? findCategory.name },
      });
      return {
        success: true,
        message: `Category has updated successfully`,
        data: updateCategory,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }

  async remove(id: string) {
    try {
      const findCategory = await this.prisma.tenant_categories.findFirst({
        where: { uuid: id },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
        },
      });
      if (!findCategory) throw new NotFoundException(`Category doesn't exists`);

      const removeCategory = await this.prisma.tenant_categories.delete({
        where: { uuid: id },
      });
      return {
        success: true,
        message: `Category has removed successfully`,
        data: removeCategory,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong: ${error}`);
    }
  }
}
