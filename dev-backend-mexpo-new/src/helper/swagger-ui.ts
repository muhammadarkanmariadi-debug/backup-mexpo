/**
 * Self-contained Swagger UI setup.
 *
 * `swagger-ui-express` serves its UI assets (HTML/CSS/JS) from
 * `node_modules/swagger-ui-dist` as static files. In a serverless bundle
 * (Vercel) those static files are not packaged, so `/docs` returns an empty
 * page (or hangs). Instead we serve a self-contained HTML page that loads
 * Swagger UI from a CDN and points at the local `/docs-json` endpoint — no
 * static assets required, works in both the long-running server and the
 * bundled serverless function.
 */
import type { INestApplication } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import type { Request, Response } from 'express';

const SWAGGER_UI_VERSION = '5.32.8';

const SWAGGER_UI_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mexpo API - Swagger UI</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
    #swagger-ui { max-width: 1460px; margin: 0 auto; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: './docs-json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        displayRequestDuration: true,
        persistAuthorization: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset,
        ],
        layout: 'BaseLayout',
      });
    };
  </script>
</body>
</html>`;

/**
 * Registers:
 *   GET /<path>       -> Swagger UI HTML (CDN assets)
 *   GET /<path>/      -> same
 *   GET /<path>-json  -> the OpenAPI document JSON
 */
export function setupSwaggerUi(
  app: INestApplication,
  document: OpenAPIObject,
  path = 'docs',
): void {
  const adapter = app.getHttpAdapter();

  const serveHtml = (_req: Request, res: Response) => {
    res.type('text/html').send(SWAGGER_UI_HTML);
  };
  const serveJson = (_req: Request, res: Response) => {
    res.json(document);
  };

  adapter.get(`/${path}`, serveHtml);
  adapter.get(`/${path}/`, serveHtml);
  adapter.get(`/${path}-json`, serveJson);
}
