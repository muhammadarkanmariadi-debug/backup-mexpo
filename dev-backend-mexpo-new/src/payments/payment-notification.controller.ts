import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

/**
 * Midtrans webhook — intentionally NO auth guard. Security comes from
 * SHA512 signature verification inside PaymentsService.handleNotification.
 * Supports both application/json and x-www-form-urlencoded bodies.
 */
@ApiTags('Payments')
@Controller()
export class PaymentNotificationController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(`payment/notification`)
  notification(@Body() body: Record<string, unknown>) {
    return this.paymentsService.handleNotification(body ?? {});
  }
}
