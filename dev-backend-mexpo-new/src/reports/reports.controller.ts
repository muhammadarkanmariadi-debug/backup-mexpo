import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import FormatValidation from 'src/helper/validation.format';
import { FilterReportDto } from './dto/filter-report.dto';
import { BasicGuard } from 'src/helper/basic-auth';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Reports')
@ApiBasicAuth()
@Controller('reports')
@UseGuards(BasicGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get(`export/:event_id/tenant/:tenant_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  async exportTenantExcel(
    @Param(`event_id`) event_id: string,
    @Param(`tenant_id`) tenant_id: string,
    @Query() query: FilterReportDto,
    @Res() res: Response,
  ) {
    const result = await this.reportsService.exportTenantExcel(
      event_id,
      tenant_id,
      query,
    );
    res.setHeader(
      `Content-Type`,
      `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,
    );
    res.setHeader(
      `Content-Disposition`,
      `attachment; filename="${result.filename}"`,
    );
    res.send(result.buffer);
  }

  @Get(`export/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  async exportExcel(
    @Param(`event_id`) event_id: string,
    @Query() query: FilterReportDto,
    @Res() res: Response,
  ) {
    const result = await this.reportsService.exportExcel(event_id, query);
    res.setHeader(
      `Content-Type`,
      `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,
    );
    res.setHeader(
      `Content-Disposition`,
      `attachment; filename="${result.filename}"`,
    );
    res.send(result.buffer);
  }

  @Get(`/booth/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findBothVisitor(
    @Param(`event_id`) event_id: string,
    @Query() query: FilterReportDto,
  ) {
    return this.reportsService.findBoothVisitor(event_id, query);
  }

  @Get(`/category/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findCategoryVisitor(
    @Param(`event_id`) event_id: string,
    @Query() query: FilterReportDto,
  ) {
    return this.reportsService.findCategoryVisitor(event_id, query);
  }

  @Get(`/visitor/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAllEventVisitor(
    @Param(`event_id`) event_id: string,
    @Query() query: FilterReportDto,
  ) {
    return this.reportsService.findAllEventVisitor(event_id, query);
  }

  @Get(`/amount/booth/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findTransactionEachBooth(
    @Param(`event_id`) event_id: string,
    @Query() query: FilterReportDto,
  ) {
    return this.reportsService.findTransactionEachBooth(event_id, query);
  }

  @Get(`/amount/category/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findTransactionByCategory(
    @Param(`event_id`) event_id: string,
    @Query() query: FilterReportDto,
  ) {
    return this.reportsService.findTransactionByCategory(event_id, query);
  }

  @Get(`/amount/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAmountByEvent(
    @Param(`event_id`) event_id: string,
    @Query() query: FilterReportDto,
  ) {
    return this.reportsService.findAmountByEvent(event_id, query);
  }
}
