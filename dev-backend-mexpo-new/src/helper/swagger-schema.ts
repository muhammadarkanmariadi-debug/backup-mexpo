// src/helper/swagger-schema.ts
// Reads `prisma/schema.prisma` and converts every model into an OpenAPI
// JSON-Schema component, so the database schema is part of the Swagger docs
// (see `components.schemas.*` in /docs-json). Enums become string unions;
// relations become array/object placeholders.

import { readFileSync } from 'fs';
import { resolve } from 'path';

const PRISMA_TO_JSON: Record<string, string> = {
  String: 'string',
  Int: 'integer',
  Float: 'number',
  Decimal: 'number',
  Boolean: 'boolean',
  DateTime: 'string',
  Json: 'object',
  BigInt: 'integer',
  Bytes: 'string',
};

/** Extract `enum Name { A B C }` blocks. */
function parseEnums(text: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const re = /enum\s+(\w+)\s*{([^}]*)}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const values = m[2]
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('//'));
    out[m[1]] = values;
  }
  return out;
}

/** Convert a single Prisma model block to an OpenAPI schema. */
function modelToSchema(
  modelName: string,
  body: string,
  enums: Record<string, string[]>,
  allModels: string[],
): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('//') || line.startsWith('@@')) continue;

    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;
    const [field, rawType, ...rest] = parts;
    if (field.startsWith('@')) continue;

    const isList = rawType.endsWith('[]');
    const optional = rawType.endsWith('?') || rawType.includes('?');
    const typeName = rawType.replace('[]', '').replace('?', '');

    const restStr = rest.join(' ');
    const isRelation = restStr.includes('@relation');
    const hasDefault = restStr.includes('@default');

    let schema: Record<string, unknown>;
    if (isRelation || allModels.includes(typeName)) {
      const ref = `#/components/schemas/${typeName}`;
      schema = isList
        ? {
            type: 'array',
            items: { type: 'object', description: `Relation: ${typeName}` },
          }
        : { type: 'object', description: `Relation: ${typeName}` };
      // keep $ref as a hint (some tooling honors it)
      schema.$ref = ref;
    } else if (enums[typeName]) {
      schema = { type: 'string', enum: enums[typeName] };
    } else if (PRISMA_TO_JSON[typeName]) {
      schema = { type: PRISMA_TO_JSON[typeName] };
      if (PRISMA_TO_JSON[typeName] === 'string' && typeName === 'DateTime') {
        schema.format = 'date-time';
      }
    } else {
      schema = { type: 'string', description: `Prisma type: ${typeName}` };
    }

    if (isRelation) schema.description = `Relation to ${typeName}`;
    if (!optional && !hasDefault && !isRelation && isList === false) {
      required.push(field);
    }

    properties[field] = schema;
  }

  return {
    type: 'object',
    description: `Prisma model \`${modelName}\``,
    properties,
    ...(required.length ? { required } : {}),
  };
}

/** Parse the whole Prisma schema into OpenAPI components.schemas entries. */
export function prismaModelsToOpenApiSchemas(): Record<string, unknown> {
  // Try multiple paths: __dirname-relative (works in serverless/Vercel),
  // then process.cwd()-relative (works in traditional deploys).
  const candidates = [
    resolve(__dirname, '..', '..', '..', 'prisma', 'schema.prisma'),  // dist/src/helper -> project root
    resolve(__dirname, '..', '..', 'prisma', 'schema.prisma'),         // fallback
    resolve(process.cwd(), 'prisma', 'schema.prisma'),                 // traditional CWD
  ];
  let text: string | null = null;
  for (const file of candidates) {
    try {
      text = readFileSync(file, 'utf8');
      break;
    } catch {
      // try next candidate
    }
  }
  if (!text) {
    // If schema file is not found at all, return empty schemas
    // (Swagger docs will lack DB schema but the app still works).
    return {};
  }
  const enums = parseEnums(text);

  const modelBlocks: Record<string, string> = {};
  const re = /model\s+(\w+)\s*{([^}]*)}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    modelBlocks[m[1]] = m[2];
  }

  const allModels = Object.keys(modelBlocks);
  const schemas: Record<string, unknown> = {};
  for (const [name, body] of Object.entries(modelBlocks)) {
    schemas[name] = modelToSchema(name, body, enums, allModels);
  }
  return schemas;
}
