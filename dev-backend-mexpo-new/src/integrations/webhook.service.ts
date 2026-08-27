import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';

export interface WebhookRegistrationPayload {
  event: 'registration.created' | 'registration.updated' | 'registration.cancelled';
  timestamp: string;
  data: {
    event_id: string;
    event_slug?: string;
    event_title: string;
    user: {
      uuid: string;
      full_name: string;
      email: string;
      phone?: string;
      organization?: string;
    };
    answers?: Record<string, string>;
    ticket?: {
      ticket_id: string;
      ticket_name?: string;
      ticket_code?: string;
      status: string;
      payment_method?: string;
      payment_reference?: string;
    };
    created_at: string;
  };
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Dispatches a webhook asynchronously with HMAC signature header
   */
  async dispatch(callbackUrl: string, payload: WebhookRegistrationPayload): Promise<boolean> {
    if (!callbackUrl || !callbackUrl.startsWith('http')) {
      return false;
    }

    const secret =
      this.configService.get<string>('MEXPO_WEBHOOK_SECRET') ||
      this.configService.get<string>('MEXPO_INTEGRATION_API_KEY') ||
      'mexpo_secret';

    const bodyString = JSON.stringify(payload);
    const signature = createHmac('sha256', secret).update(bodyString).digest('hex');

    try {
      this.logger.log(`Dispatching webhook to ${callbackUrl} for event ${payload.event}`);

      const response = await fetch(callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mexpo-Webhook/1.0',
          'X-Mexpo-Signature': signature,
          'X-Mexpo-Event': payload.event,
        },
        body: bodyString,
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (!response.ok) {
        this.logger.warn(
          `Webhook delivery to ${callbackUrl} returned status ${response.status}: ${response.statusText}`,
        );
        return false;
      }

      this.logger.log(`Webhook successfully delivered to ${callbackUrl}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to dispatch webhook to ${callbackUrl}: ${error}`);
      return false;
    }
  }
}
