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
import { setupSwaggerUi } from './helper/swagger-ui';
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
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
      // CRITICAL for serverless: the default `abortOnError: true` calls
      // process.exit(1) on any DI/bootstrap failure, which instantly kills
      // the Lambda container -> Vercel "Serverless Function has crashed."
      // With `false`, bootstrap throws instead, so our try/catch can surface
      // a readable 500 JSON to the caller.
      abortOnError: false,
    });
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

    // NOTE: do not use SwaggerModule.setup for the UI — swagger-ui-express
    // serves static assets from node_modules which are not bundled in the
    // serverless function (blank /docs page). setupSwaggerUi serves a
    // self-contained CDN-based page + /docs-json instead.
    setupSwaggerUi(app, document);

    await app.init();
    appReady = true;
    console.log('[serverless] NestJS app initialized');
  } catch (err) {
    bootError = err instanceof Error ? err : new Error(String(err));
    console.error('[serverless] Bootstrap failed:', err);
    throw bootError;
  }
}

// Safety net: never let a stray rejected promise kill the function container.
// With a handler registered, Vercel gets a chance to respond instead of the
// process dying with "Serverless Function has crashed".
process.on('unhandledRejection', (reason) => {
  console.error('[serverless] Unhandled rejection:', reason);
});

let bootPromise: Promise<void> | null = null;

/**
 * Bootstrap is LAZY — it starts on the first request, never at module load.
 * This guarantees a module-load-time failure cannot crash the function before
 * the handler exists. The .catch() swallows the rejection (handled via
 * bootError), so the promise never becomes an unhandled rejection.
 */
function ensureBoot(): Promise<void> {
  if (!bootPromise) {
    bootPromise = bootstrap().catch(() => {
      /* handled via bootError */
    });
  }
  return bootPromise;
}

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
          'Server initialization timed out. Likely causes: the DATABASE_URL in ' +
            'the Vercel project is unreachable, or an environment variable is ' +
            'missing. Check the Supabase connection string (session pooler, port ' +
            '5432, ?sslmode=no-verify) and that JWT_SECRET and the other vars are ' +
            'set under Project Settings -> Environment Variables.',
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
        await withBootstrapTimeout(ensureBoot());
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
