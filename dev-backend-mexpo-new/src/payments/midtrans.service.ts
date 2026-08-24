import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

/**
 * Thin Midtrans Snap client — no SDK dependency needed (Node 24 global fetch).
 * Base URL switches between sandbox/production via `MIDTRANS_IS_PRODUCTION`.
 */
export interface SnapCustomerDetails {
  first_name: string;
  email: string;
  phone?: string;
}

export interface SnapItemDetail {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface CreateSnapTokenParams {
  orderId: string;
  grossAmount: number;
  customerDetails: SnapCustomerDetails;
  itemDetails: SnapItemDetail[];
}

export interface SnapTokenResponse {
  token: string;
  redirect_url: string;
}

@Injectable()
export class MidtransService {
  constructor(private readonly configService: ConfigService) {}

  private get serverKey(): string {
    return (
      this.configService.get<string>(`MIDTRANS_SERVER_KEY`) ||
      `SB-Mid-server-dp6l7Q5hwsmvkWsP3-kOc7Jh`
    );
  }

  private get isProduction(): boolean {
    return this.configService.get<string>(`MIDTRANS_IS_PRODUCTION`) === `true`;
  }

  private get is3ds(): boolean {
    return this.configService.get<string>(`MIDTRANS_IS_3DS`) === `true`;
  }

  private get paymentExpiryMinutes(): number {
    const raw = Number(
      this.configService.get<string>(`MIDTRANS_PAYMENT_EXPIRY`) ?? `1440`,
    );
    return Number.isFinite(raw) && raw > 0 ? raw : 1440;
  }

  private get baseUrl(): string {
    return this.isProduction
      ? `https://app.midtrans.com`
      : `https://app.sandbox.midtrans.com`;
  }

  /**
   * POST {base}/snap/v1/transactions with Basic auth (server key).
   * Returns the Snap token the frontend renders with snap.js.
   */
  async createSnapToken(
    params: CreateSnapTokenParams,
  ): Promise<SnapTokenResponse> {
    const body = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: Math.round(params.grossAmount),
      },
      item_details: (params.itemDetails ?? []).map((it) => ({
        id: it.id ? it.id.slice(0, 50) : `item-1`,
        price: Math.round(it.price),
        quantity: it.quantity,
        name: (it.name || `Tiket Event`).slice(0, 50),
      })),
      customer_details: {
        first_name: (params.customerDetails.first_name || `Visitor`).slice(0, 50),
        email: params.customerDetails.email,
        phone: params.customerDetails.phone
          ? params.customerDetails.phone.slice(0, 19)
          : undefined,
      },
      credit_card: { secure: this.is3ds },
      expiry: { unit: `minutes`, duration: this.paymentExpiryMinutes },
    };

    let res: globalThis.Response;
    try {
      res = await fetch(`${this.baseUrl}/snap/v1/transactions`, {
        method: `POST`,
        headers: {
          'Content-Type': `application/json`,
          Accept: `application/json`,
          Authorization: `Basic ${Buffer.from(`${this.serverKey}:`).toString(
            `base64`,
          )}`,
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Midtrans Snap request failed: ${(error as Error).message}`,
      );
    }

    const json = (await res.json().catch(() => ({}))) as {
      token?: string;
      redirect_url?: string;
      error_messages?: unknown;
      status_message?: unknown;
    };

    if (!res.ok || !json.token) {
      throw new BadRequestException(
        `Midtrans Snap token failed (HTTP ${res.status}): ${JSON.stringify(
          json.error_messages ?? json.status_message ?? `unknown error`,
        )}`,
      );
    }
    return { token: json.token, redirect_url: json.redirect_url ?? `` };
  }

  /**
   * SHA512 signature check per Midtrans docs:
   *   sha512(order_id + status_code + gross_amount + ServerKey)
   * Never trust a notification payload without verifying this.
   */
  verifySignature(payload: {
    order_id: string;
    status_code: string;
    gross_amount: string;
    signature_key: string;
  }): boolean {
    const hash = createHash(`sha512`)
      .update(
        `${payload.order_id}${payload.status_code}${payload.gross_amount}${this.serverKey}`,
      )
      .digest(`hex`);
    return hash === payload.signature_key;
  }
}
