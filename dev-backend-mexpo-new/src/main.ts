import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { prismaModelsToOpenApiSchemas } from './helper/swagger-schema';
import { setupSwaggerUi } from './helper/swagger-ui';
import { hasDbConfig } from './helper/db-provider';
import express from 'express';
import type { Request, Response } from 'express';

/**
 * Dual-mode entry point.
 *
 * - Long-running host (VPS / PM2 / Render / Railway): calls `app.listen()`
 *   exactly like a normal NestJS server.
 * - Vercel serverless (the NestJS preset runs `src/main.ts`): `VERCEL=1` is
 *   set, so `listen()` is skipped and the default export is used as the
 *   request handler (lazy bootstrap, no process.exit on DI errors).
 */
const isServerless = process.env.VERCEL === '1';

const server = express();

/** Env vars the app fails-fast on at boot (checked before Nest boots). */
const REQUIRED_ENV = ['JWT_SECRET'];

async function bootstrap() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (!hasDbConfig()) {
    missing.push('DATABASE_URL (or DB_HOST/DB_USER/DB_PASSWORD/DB_NAME)');
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        `Set them in the environment (Vercel: Settings -> Environment Variables) ` +
        `and redeploy. See .env.example for the full list.`,
    );
  }

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
    // Serverless: never call process.exit(1) on DI failure — let the handler
    // return a readable 500. Long-running host keeps the default fail-fast.
    { abortOnError: !isServerless },
  );
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
  // serves static assets from node_modules which are missing in a serverless
  // bundle (blank /docs page). setupSwaggerUi serves a self-contained
  // CDN-based page at /docs plus the /docs-json document.
  setupSwaggerUi(app, document);

  await app.init();
  return app;
}

// ── Serverless handler (Vercel) ──────────────────────────────────────────

let appReady = false;
let bootError: Error | null = null;
let bootPromise: Promise<void> | null = null;

function ensureBoot(): Promise<void> {
  if (!bootPromise) {
    bootPromise = bootstrap()
      .then(() => {
        appReady = true;
        console.log('[serverless] NestJS app initialized');
      })
      .catch((err) => {
        bootError = err instanceof Error ? err : new Error(String(err));
        console.error('[serverless] Bootstrap failed:', err);
      });
  }
  return bootPromise;
}

function sendError(res: Response, status: number, message: string) {
  const body = JSON.stringify({ status: false, message });
  // Vercel passes RAW Node req/res (not Express-augmented).
  if (typeof (res as unknown as { status?: unknown }).status !== 'function') {
    res.statusCode = status;
    res.setHeader('content-type', 'application/json');
    res.end(body);
    return;
  }
  res.status(status).json({ status: false, message });
}

function bootErrorMessage(): string | null {
  return bootError ? bootError.message : null;
}

/** Vercel invokes this for every request when running `src/main.ts`. */
export default async function handler(req: Request, res: Response) {
  try {
    if (!appReady) {
      const err = bootErrorMessage();
      if (err) {
        sendError(res, 500, `Server failed to initialize: ${err}`);
        return;
      }
      await ensureBoot();
      if (!appReady) {
        sendError(
          res,
          500,
          `Server failed to initialize: ${bootErrorMessage() ?? 'unknown error'}`,
        );
        return;
      }
    }
    server(req, res);
  } catch (err) {
    sendError(res, 500, err instanceof Error ? err.message : String(err));
  }
}

// ── Long-running server (VPS / PM2 / Render / Railway) ───────────────────

if (!isServerless) {
  bootstrap()
    .then((app) => {
      const port = process.env.PORT ?? 3500;
      return app.listen(Number(port)).then(() => {
        console.log(`Server run properly on http://localhost:${port}`);
        console.log(`Swagger UI: http://localhost:${port}/docs`);
      });
    })
    .then(() => console.log(`Server start complete`))
    .catch((error) => {
      console.error(`Server error when running: ${error}`);
      process.exit(1);
    });
}
