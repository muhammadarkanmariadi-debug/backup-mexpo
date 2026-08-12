// scripts/set-db-provider.mjs
//
// Hybrid database support (Option A): pick the DB provider per environment.
//
// Usage:
//   node scripts/set-db-provider.mjs mysql       # switch schema to MySQL + regenerate client
//   node scripts/set-db-provider.mjs postgresql  # switch schema to PostgreSQL + regenerate client
//   DB_PROVIDER=mysql node scripts/set-db-provider.mjs
//
// The generated Prisma client is provider-specific, so the schema datasource
// provider MUST match the target database. This script updates
// prisma/schema.prisma and regenerates the client for that provider.
//
// The runtime app then picks the matching driver adapter automatically from
// DATABASE_URL / DB_PROVIDER (see src/helper/db-provider.ts and
// src/prisma/prisma.service.ts). Migrations are selected per provider via
// prisma.config.ts (prisma/migrations vs prisma/migrations-mysql).
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const schemaPath = resolve(projectRoot, 'prisma/schema.prisma');

const wanted = (process.argv[2] || process.env.DB_PROVIDER || 'postgresql').toLowerCase();

if (wanted !== 'mysql' && wanted !== 'postgresql') {
  console.error(`Unknown provider "${wanted}". Use "mysql" or "postgresql".`);
  process.exit(1);
}

const content = readFileSync(schemaPath, 'utf8');
if (!/provider = "(mysql|postgresql)"/.test(content)) {
  console.error('Could not find the datasource provider line in prisma/schema.prisma');
  process.exit(1);
}

const updated = content.replace(/provider = "(mysql|postgresql)"/, `provider = "${wanted}"`);

if (updated === content) {
  console.log(`Provider is already set to "${wanted}".`);
} else {
  writeFileSync(schemaPath, updated, 'utf8');
  console.log(`Set datasource provider to "${wanted}" in prisma/schema.prisma`);
}

console.log('Regenerating Prisma Client...');
execSync('npx prisma generate', { stdio: 'inherit', cwd: projectRoot });

console.log(
  `Done. Runtime adapter is chosen from DATABASE_URL/DB_PROVIDER: ` +
    `mysql -> @prisma/adapter-mariadb, postgresql -> @prisma/adapter-pg.`,
);
