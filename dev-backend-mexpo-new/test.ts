import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const t = await prisma.certificate_templates.findMany();
  console.log(JSON.stringify(t, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
