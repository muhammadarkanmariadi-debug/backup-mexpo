import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentNotificationController } from './payment-notification.controller';
import { PaymentsService } from './payments.service';
import { MidtransService } from './midtrans.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController, PaymentNotificationController],
  providers: [PaymentsService, MidtransService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
