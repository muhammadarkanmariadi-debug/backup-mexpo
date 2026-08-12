// prisma/backfill-slugs.ts
// One-off: fill `slug` for existing events / tenants / workshops rows
// (new rows get slugs automatically from the services).
// Usage: npx ts-node --compiler-options {"module":"CommonJS"} prisma/backfill-slugs.ts

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { getDatabaseUrl, isMysqlDatabase } from "../src/helper/db-provider";
import { uniqueSlug } from "../src/helper/slug";

const databaseUrl = getDatabaseUrl();
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Add a connection string (mysql:// or postgresql://) to .env, or set the individual DB_HOST/DB_USER/DB_PASSWORD/DB_NAME parameters",
  );
}
const isMysql = isMysqlDatabase(databaseUrl, process.env.DB_PROVIDER);

const prisma = new PrismaClient({
  adapter: isMysql
    ? new PrismaMariaDb(databaseUrl)
    : new PrismaPg({ connectionString: databaseUrl }),
});

async function backfill<
  T extends { uuid: string; name: string },
>(
  model: any,
  rows: T[],
) {
  let updated = 0;
  for (const row of rows) {
    const slug = await uniqueSlug(
      row.name,
      (s) => model.findFirst({ where: { slug: s } }).then(Boolean),
    );
    await model.update({ where: { uuid: row.uuid }, data: { slug } });
    updated += 1;
  }
  return updated;
}

const main = async () => {
  await prisma.$connect();

  const events = await prisma.events.findMany({
    where: { OR: [{ slug: null }, { slug: "" }] },
    select: { uuid: true, name: true },
  });
  const eventDone = await backfill(prisma.events, events);

  const tenants = await prisma.tenants.findMany({
    where: { OR: [{ slug: null }, { slug: "" }] },
    select: { uuid: true, name: true },
  });
  const tenantDone = await backfill(prisma.tenants, tenants);

  const workshops = await prisma.workshops.findMany({
    where: { OR: [{ slug: null }, { slug: "" }] },
    select: { uuid: true, title: true },
  });
  // workshops use `title`, not `name`.
  const workshopRows = workshops.map((w: { uuid: string; title: string }) => ({
    uuid: w.uuid,
    name: w.title,
  }));
  const workshopDone = await backfill(prisma.workshops, workshopRows);

  console.log(
    `Backfill done: events=${eventDone} tenants=${tenantDone} workshops=${workshopDone}`,
  );
};

main()
  .then(() => console.log(`Backfill Finished`))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });