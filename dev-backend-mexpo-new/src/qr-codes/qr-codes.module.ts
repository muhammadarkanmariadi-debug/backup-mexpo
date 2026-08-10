import { Module } from '@nestjs/common';
import { QrCodesController } from './qr-codes.controller';
import { QrCodesService } from './qr-codes.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QrCodesController],
  providers: [QrCodesService],
})
export class QrCodesModule {}
