import {
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTenantProductDto } from './dto/create-tenant-product.dto';
import { UpdateTenantProductDto } from './dto/update-tenant-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { S3Service } from 'src/s3/s3.service';
import { ConfigService } from '@nestjs/config';
import { QueryTenantProductDto } from './dto/query-tenant-product.dto';
import { UserRole } from '@prisma/client';
import { assertEventFeature } from 'src/events/event-features';

@Injectable()
export class TenantProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {}
  async create(
    tenant_id: string,
    createTenantProductDto: CreateTenantProductDto,
    userId: string,
    file?: Express.Multer.File,
    role?: UserRole,
  ) {
    try {
      const findTenant = await this.prisma.tenants.findFirst({
        where: { uuid: tenant_id },
      });
      if (!findTenant) throw new NotFoundException(`Tenant doesn't exists`);
      // A2 — product feature must be enabled for this event.
      await assertEventFeature(this.prisma, findTenant.event_id, 'product');

      const findTenantMember = await this.prisma.tenant_members.findFirst({
        where: { user_id: userId, tenant_id, status: `APPROVED` },
      });
      if (!findTenantMember && role != `SUPERADMIN`)
        throw new ForbiddenException(`Sorry, you are not allow to add product`);
      let photo: string = ``;
      if (file) {
        const filename = `${new Date().getTime().toString()}-${file.originalname}`;
        photo = `${this.configService.get<string>(`MINIO_ENDPOINT`)}/expo-project-products/${filename}`;
        await this.s3Service.upload(
          `expo-project-products`,
          filename,
          file.buffer,
          file.mimetype,
        );
      }
      const { name, description, price } = createTenantProductDto;
      const newProduct = await this.prisma.tenant_products.create({
        data: {
          name,
          description,
          event_id: findTenant.event_id,
          price,
          photo,
          created_by: userId,
          updated_by: userId,
          tenant_id,
        },
      });
      return {
        success: true,
        message: `New Product has been created`,
        data: newProduct,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async findAll(
    tenant_id: string,
    query: QueryTenantProductDto,
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
          `Sorry, you are not allow to fetch product`,
        );
      const { page, quantity, search } = query;
      const take = quantity ?? undefined;
      const skip = page && quantity ? (page - 1) * quantity : undefined;

      const counts = await this.prisma.tenant_products.count({
        where: {
          tenant_id,
          OR: [
            { name: { contains: search || `` } },
            { description: { contains: search || `` } },
          ],
        },
      });

      const products = await this.prisma.tenant_products.findMany({
        skip,
        take,
        orderBy: { name: `asc` },
        where: {
          tenant_id,
          OR: [
            { name: { contains: search || `` } },
            { description: { contains: search || `` } },
          ],
        },
        include: {
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
        },
      });

      return {
        success: true,
        message: `Tenant Product has retrieved`,
        data: products,
        meta: { page, quantity, counts },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async findOne(id: string) {
    try {
      const findProduct = await this.prisma.tenant_products.findFirst({
        where: { uuid: id },
        include: {
          tenant: true,
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
        },
      });

      if (!findProduct) throw new NotFoundException(`Product doesn't exists`);
      return {
        success: true,
        message: `Tenant product was found`,
        data: findProduct,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async update(
    id: string,
    updateTenantProductDto: UpdateTenantProductDto,
    userId: string,
    file?: Express.Multer.File,
    role?: UserRole,
  ) {
    try {
      const findProduct = await this.prisma.tenant_products.findFirst({
        where: { uuid: id },
        include: {
          tenant: true,
          creator: { select: { full_name: true } },
          editor: { select: { full_name: true } },
        },
      });

      if (!findProduct) throw new NotFoundException(`Product doesn't exists`);
      const findTenantMember = await this.prisma.tenant_members.findFirst({
        where: {
          user_id: userId,
          tenant_id: findProduct.tenant_id,
          status: `APPROVED`,
        },
      });
      if (!findTenantMember && role !== `SUPERADMIN`)
        throw new ForbiddenException(
          `Sorry, you are not allow to edit product`,
        );
      const { description, name, price } = updateTenantProductDto;
      let fileUrl = findProduct.photo;
      if (file) {
        const oldFileUrl = findProduct.photo;
        if (oldFileUrl) {
          const oldFilename = oldFileUrl.split('/').pop() || '';
          await this.s3Service.delete(`expo-project-products`, oldFilename);
        }
        const filename = `${new Date().getTime().toString()}-${file.originalname}`;
        fileUrl = `${this.configService.get<string>(`MINIO_ENDPOINT`)}/expo-project-products/${filename}`;
        await this.s3Service.upload(
          `expo-project-products`,
          filename,
          file.buffer,
          file.mimetype,
        );
      }
      const updateProduct = await this.prisma.tenant_products.update({
        where: { uuid: id },
        data: {
          name: name ?? findProduct.name,
          description: description ?? findProduct.description,
          price: price ?? findProduct.price,
          photo: fileUrl,
          updated_by: userId,
        },
      });
      return {
        success: true,
        message: `Product of tenant has updated`,
        data: updateProduct,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }

  async remove(id: string, userId: string, role?: UserRole) {
    try {
      const findProduct = await this.prisma.tenant_products.findFirst({
        where: { uuid: id },
      });
      if (!findProduct) throw new NotFoundException(`Product doesn't exists`);

      const findTenantMember = await this.prisma.tenant_members.findFirst({
        where: {
          user_id: userId,
          tenant_id: findProduct.tenant_id,
          status: `APPROVED`,
          role: `OWNER`,
        },
      });
      if (!findTenantMember && role !== `SUPERADMIN`)
        throw new ForbiddenException(
          `Only the tenant owner can delete a product`,
        );
      const oldFileUrl = findProduct.photo;
      if (oldFileUrl !== ``) {
        const oldFilename = oldFileUrl.split('/').pop() || '';
        await this.s3Service.delete(`expo-project-products`, oldFilename);
      }

      const dropProduct = await this.prisma.tenant_products.delete({
        where: { uuid: id },
      });
      return {
        success: true,
        message: `Tenant Product has removed`,
        data: dropProduct,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }
}
