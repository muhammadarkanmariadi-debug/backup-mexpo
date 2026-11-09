import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';

export interface WebhookRegistrationPayload {
  event:
    | 'registration.created'
    | 'registration.updated'
    | 'registration.cancelled';
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

  private isSafeUrl(urlStr: string): boolean {
    try {
      const parsed = new URL(urlStr);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }
      const hostname = parsed.hostname.toLowerCase();
      // Block localhost, loopback, private IP ranges, link-local, and cloud metadata endpoints
      if (
        hostname === 'localhost' ||
        hostname.endsWith('.localhost') ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname === '0.0.0.0' ||
        hostname === '169.254.169.254' || // AWS / GCP metadata
        hostname === 'metadata.google.internal' ||
        /^10\./.test(hostname) || // 10.0.0.0/8
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) || // 172.16.0.0/12
        /^192\.168\./.test(hostname) || // 192.168.0.0/16
        /^169\.254\./.test(hostname) // Link-local
      ) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Dispatches a webhook asynchronously with HMAC signature header
   */
  async dispatch(
    callbackUrl: string,
    payload: WebhookRegistrationPayload,
  ): Promise<boolean> {
    if (!callbackUrl || !this.isSafeUrl(callbackUrl)) {
      this.logger.warn(`Rejected dispatch to unsafe or invalid webhook URL: ${callbackUrl}`);
      return false;
    }

    const secret =
      this.configService.get<string>('MEXPO_WEBHOOK_SECRET') ||
      this.configService.get<string>('MEXPO_INTEGRATION_API_KEY') ||
      'mexpo_secret';

    const bodyString = JSON.stringify(payload);
    const signature = createHmac('sha256', secret)
      .update(bodyString)
      .digest('hex');

    try {
      this.logger.log(
        `Dispatching webhook to ${callbackUrl} for event ${payload.event}`,
      );

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
      this.logger.error(
        `Failed to dispatch webhook to ${callbackUrl}: ${error}`,
      );
      return false;
    }
  }
}
