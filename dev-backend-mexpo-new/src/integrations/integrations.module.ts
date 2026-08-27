import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { WebhookService } from './webhook.service';

@Module({
  controllers: [IntegrationsController],
  providers: [IntegrationsService, WebhookService],
  exports: [IntegrationsService, WebhookService],
})
export class IntegrationsModule {}
