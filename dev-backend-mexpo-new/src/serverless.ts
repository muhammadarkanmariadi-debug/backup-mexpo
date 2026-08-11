/**
 * Vercel Serverless entry point.
 *
 * Vercel invokes a single exported handler per request. We bootstrap the
 * NestJS app once (cold start) and re-use it across warm invocations.
 * The underlying Express instance is extracted and wrapped as a standard
 * Node.js HTTP request handler that Vercel can call.
 */
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { prismaModelsToOpenApiSchemas } from './helper/swagger-schema';
import express from 'express';
import type { Request, Response } from 'express';

const server = express();

let isReady = false;

async function bootstrap() {
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
  isReady = true;
}

// Start bootstrap immediately (runs during cold start)
const bootstrapPromise = bootstrap();

// Vercel calls this handler for every request
export default async function handler(req: Request, res: Response) {
  if (!isReady) {
    await bootstrapPromise;
  }
  server(req, res);
}
