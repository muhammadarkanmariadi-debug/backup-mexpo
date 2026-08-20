import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import FormatValidation from '../helper/validation.format';
import { imageFileFilter } from '../helper/upload.format';
import * as authType from '../auth/auth.types';
import { PaymentsService } from './payments.service';
import {
  CheckoutDto,
  QueryTransactionDto,
  RefundTransactionDto,
  SettleDto,
  UpdatePayoutDto,
} from './dto/payments.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller()
@UseGuards(AuthGuard(`jwt`))
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ── Checkout / transactions (visitor + managers) ──

  @Post(`events/:id/checkout`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  checkout(
    @Param(`id`) id: string,
    @Body() dto: CheckoutDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.paymentsService.checkout(id, dto, request.user.uuid);
  }

  @Get(`transactions/my/:event_id`)
  findMy(
    @Param(`event_id`) event_id: string,
    @Request() request: authType.AuthRequest,
  ) {
    return this.paymentsService.findMy(event_id, request.user.uuid);
  }

  @Get(`transactions/:id`)
  findOne(@Param(`id`) id: string, @Request() request: authType.AuthRequest) {
    return this.paymentsService.findOne(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Get(`events/:id/transactions`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAll(
    @Param(`id`) id: string,
    @Query() query: QueryTransactionDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.paymentsService.findAll(
      id,
      query,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  // ── Settlement / payout ──

  @Get(`events/:id/settlement-summary`)
  settlementSummary(
    @Param(`id`) id: string,
    @Request() request: authType.AuthRequest,
  ) {
    return this.paymentsService.getSettlementSummary(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Put(`events/:id/payout`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  updatePayout(
    @Param(`id`) id: string,
    @Body() dto: UpdatePayoutDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.paymentsService.updatePayout(
      id,
      dto,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Post(`events/:id/settle`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  @UseInterceptors(FileInterceptor(`file`, imageFileFilter))
  settle(
    @Param(`id`) id: string,
    @Body() dto: SettleDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Request() request: authType.AuthRequest,
  ) {
    return this.paymentsService.settle(
      id,
      dto,
      file,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Put(`transactions/:id/refund`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  refund(
    @Param(`id`) id: string,
    @Body() dto: RefundTransactionDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.paymentsService.refund(
      id,
      dto,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }
}
