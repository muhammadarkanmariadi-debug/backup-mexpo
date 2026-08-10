import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { prismaModelsToOpenApiSchemas } from './helper/swagger-schema';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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

  // Inject the Prisma models into components.schemas so the DB schema is
  // part of the API documentation (visible via /docs-json and tooling).
  document.components = {
    schemas: {
      ...(document.components?.schemas ?? {}),
      ...prismaModelsToOpenApiSchemas(),
    },
  } as never;

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3500;
  await app.listen(Number(port));
  console.log(`Server run properly on http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/docs`);
}
bootstrap()
  .then(() => console.log(`Server start complete`))
  .catch((error) => console.log(`Server error when running: ${error}`));
