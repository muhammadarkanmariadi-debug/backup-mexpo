import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Check X-API-Key header or Authorization: Bearer <key>
    const apiKeyHeader = request.headers['x-api-key'] as string;
    const authHeader = request.headers.authorization;

    let providedKey = '';
    if (apiKeyHeader) {
      providedKey = apiKeyHeader.trim();
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      providedKey = authHeader.substring(7).trim();
    }

    if (!providedKey) {
      throw new UnauthorizedException('Missing X-API-Key or Bearer API key');
    }

    const validKey =
      this.configService.get<string>('MEXPO_INTEGRATION_API_KEY') ||
      this.configService.get<string>('INTEGRATION_API_KEY') ||
      'mexpo_live_default_secret_key';

    if (providedKey !== validKey) {
      throw new UnauthorizedException('Invalid integration API key');
    }

    return true;
  }
}
