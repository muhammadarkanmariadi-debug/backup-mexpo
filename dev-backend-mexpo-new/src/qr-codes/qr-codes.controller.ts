import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import FormatValidation from 'src/helper/validation.format';
import * as authType from '../auth/auth.types';
import { QrCodesService } from './qr-codes.service';
import { ResolveQrDto } from './dto/resolve-qr.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('QR Codes')
@ApiBearerAuth()
@Controller('qr-codes')
@UseGuards(AuthGuard(`jwt`))
export class QrCodesController {
  constructor(private readonly qrCodesService: QrCodesService) {}

  @Get(`my/:event_id`)
  getMyQr(
    @Param(`event_id`) event_id: string,
    @Request() request: authType.AuthRequest,
  ) {
    return this.qrCodesService.getMyQr(event_id, request.user.uuid);
  }

  @Post(`resolve`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  resolve(@Body() dto: ResolveQrDto) {
    return this.qrCodesService.resolve(dto.code_data);
  }
}
