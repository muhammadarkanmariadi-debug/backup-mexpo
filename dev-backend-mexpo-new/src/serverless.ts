/**
 * Vercel Serverless entry point.
 *
 * Vercel invokes this exported handler per request. The NestJS app is
 * bootstrapped once on cold start; warm invocations reuse the underlying
 * Express instance.
 *
 * Crash hardening:
 *  - The module-level bootstrap promise has a .catch(), so a failure (e.g.
 *    missing env var, DB down) does NOT become an unhandled promise rejection
 *    that kills the Lambda process.
 *  - If bootstrap fails, the handler returns a readable 500 JSON with the
 *    error message instead of crashing.
 *
 * NOTE: this file is NOT used by the long-running host (VPS/PM2/Render/
 * Railway) — that runs `dist/src/main.js`. Both paths coexist.
 */
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { prismaModelsToOpenApiSchemas } from './helper/swagger-schema';
import express from 'express';
import type { Request, Response } from 'express';

const server = express();

let appReady = false;
let bootError: Error | null = null;

/**
 * Env vars the app fails-fast on at boot. If one is missing, NestJS aborts the
 * process with process.exit(1) (killing a serverless function). We check these
 * BEFORE calling NestFactory.create so a misconfigured Vercel project returns a
 * readable 500 instead of crashing.
 */
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];

function missingRequiredEnv(): string[] {
  return REQUIRED_ENV.filter((key) => !process.env[key]);
}

async function bootstrap(): Promise<void> {
  try {
    const missing = missingRequiredEnv();
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}. ` +
          `Set them in the Vercel project (Settings -> Environment Variables) ` +
          `and redeploy. See .env.example for the full list.`,
      );
    }
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    app.enableCors();

    // ── Swagger / OpenAPI docs ─────────────────────────────────────────────
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Mexpo API')
      .setDescription(
        `Backend API for the Mexpo event platform. Auth: **Bearer JWT** for
logged-in endpoints, **Basic auth** for \`public-api\` / \`reports\` /
user-creation & reset endpoints. Pagination uses \`?page=\` + \`?quantity=\`
(+ \`?search=\`); sorting uses \`?sort_by=\` + \`?sort_dir=asc|desc\`.

The **database schema** is included as Swagger components under
\`components.schemas.*\` (Prisma models → JSON Schema). See
\`dev-backend-mexpo-new/docs/Mexpo-API-and-Backend-Design.docx\` for the full
design & user-flow docs.`,
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addBasicAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    document.components = {
      schemas: {
        ...(document.components?.schemas ?? {}),
        ...prismaModelsToOpenApiSchemas(),
      },
    } as never;

    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    await app.init();
    appReady = true;
    console.log('[serverless] NestJS app initialized');
  } catch (err) {
    bootError = err instanceof Error ? err : new Error(String(err));
    console.error('[serverless] Bootstrap failed:', err);
    throw bootError;
  }
}

// Kick off bootstrap during cold start. The .catch() swallows the rejection so
// the process never crashes from an unhandled rejection; the error is surfaced
// by the handler below as a readable 500.
const coldStart = bootstrap().catch(() => {
  /* handled via bootError */
});

function sendError(res: Response, status: number, message: string) {
  const body = JSON.stringify({ status: false, message });
  // Vercel passes RAW Node req/res to the handler (not Express-augmented),
  // so never rely on res.status().json() here — use plain Node methods.
  if (typeof (res as unknown as { status?: unknown }).status !== 'function') {
    res.statusCode = status;
    res.setHeader('content-type', 'application/json');
    res.end(body);
    return;
  }
  (res as Response).status(status).json({ status: false, message });
}

function bootErrorMessage(): string | null {
  return bootError ? bootError.message : null;
}

/**
 * NestJS quirk: when a dynamic module factory throws (e.g. JwtModule when
 * JWT_SECRET is missing), `NestFactory.create` can hang forever instead of
 * rejecting. On serverless this would time out / crash the function, so we
 * race bootstrap against a hard timeout and surface a readable error.
 * Keep it well under Vercel Hobby's 10s function limit.
 */
const BOOTSTRAP_TIMEOUT_MS = 8000;

function withBootstrapTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(
        new Error(
          'Server initialization timed out. This usually means an environment ' +
            'variable is missing in the Vercel project (DATABASE_URL, JWT_SECRET, ' +
            'BASIC_AUTH_USERNAME/PASSWORD, PUBLIC_FRONTEND_URL, MAIL_*, MINIO_*). ' +
            'Set them under Project Settings -> Environment Variables and redeploy.',
        ),
      );
    }, BOOTSTRAP_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Vercel calls this handler for every request. */
export default async function handler(req: Request, res: Response) {
  try {
    if (!appReady) {
      const err = bootErrorMessage();
      if (err) {
        sendError(res, 500, `Server failed to initialize: ${err}`);
        return;
      }
      try {
        await withBootstrapTimeout(coldStart);
      } catch (bootTimeoutErr) {
        bootError =
          bootTimeoutErr instanceof Error
            ? bootTimeoutErr
            : new Error(String(bootTimeoutErr));
        sendError(res, 500, `Server failed to initialize: ${bootError.message}`);
        return;
      }
      if (!appReady) {
        const err2 = bootErrorMessage();
        sendError(
          res,
          500,
          `Server failed to initialize: ${err2 ?? 'unknown error'}`,
        );
        return;
      }
    }
    server(req, res);
  } catch (err) {
    sendError(res, 500, err instanceof Error ? err.message : String(err));
  }
}
