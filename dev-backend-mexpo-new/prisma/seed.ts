import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { isMysqlDatabase } from "../src/helper/db-provider";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Add a connection string (mysql:// or postgresql://) to .env");
}
const isMysql = isMysqlDatabase(databaseUrl, process.env.DB_PROVIDER);

const prisma = new PrismaClient({
    adapter: isMysql
        ? new PrismaMariaDb(databaseUrl)
        : new PrismaPg({ connectionString: databaseUrl }),
});

const main = async () => {
    await prisma.$connect()

    await prisma.users.upsert({
        where: { email: `pengunjung1@gmail.com` },
        create: {
            uuid: `3cad522c-3975-49bb-9ee2-97852f9b8220`,
            email: `pengunjung1@gmail.com`,
            full_name: `Pengunjung Satu`,
            phone: `09203820802`,
            password: `$2b$10$iE/K37JeYGp/rSLH9z9Dde4qcu/7NcOF90WMshym7VsoqfYXfrUgu`,
            is_active: true
        },
        update: {
            full_name: `Pengunjung Satu`
        }
    })

    await prisma.users.upsert({
        where: { email: `pengunjung2@gmail.com` },
        create: {
            uuid: `a20a2aa2-555f-4370-8000-d07fc9bd9974`,
            email: `pengunjung2@gmail.com`,
            full_name: `Pengunjung Dua`,
            phone: `09203820802`,
            password: `$2b$10$iE/K37JeYGp/rSLH9z9Dde4qcu/7NcOF90WMshym7VsoqfYXfrUgu`,
            is_active: true
        },
        update: {
            full_name: `Pengunjung Dua`
        }
    })

    await prisma.users.upsert({
        where: { email: `pengunjung3@gmail.com` },
        create: {
            uuid: `5620685e-33a9-49db-ad3b-158baadab6b4`,
            email: `pengunjung3@gmail.com`,
            full_name: `Pengunjung Tiga`,
            phone: `09203820802`,
            password: `$2b$10$iE/K37JeYGp/rSLH9z9Dde4qcu/7NcOF90WMshym7VsoqfYXfrUgu`,
            is_active: true
        },
        update: {
            full_name: `Pengunjung Tiga`
        }
    })

    await prisma.users.upsert({
        where: { email: `pengunjung4@gmail.com` },
        create: {
            uuid: `50f9f6b8-21de-4e34-b9c3-79c03d32c659`,
            email: `pengunjung4@gmail.com`,
            full_name: `Pengunjung Empat`,
            phone: `09203820802`,
            password: `$2b$10$iE/K37JeYGp/rSLH9z9Dde4qcu/7NcOF90WMshym7VsoqfYXfrUgu`,
            is_active: true
        },
        update: {
            full_name: `Pengunjung Empat`
        }
    })

    await prisma.users.upsert({
        where: { email: `pengunjung5@gmail.com` },
        create: {
            uuid: `8dae2abc-aacd-4474-8085-8dfc77d2cf3c`,
            email: `pengunjung5@gmail.com`,
            full_name: `Pengunjung Lima`,
            phone: `09203820802`,
            password: `$2b$10$iE/K37JeYGp/rSLH9z9Dde4qcu/7NcOF90WMshym7VsoqfYXfrUgu`,
            is_active: true
        },
        update: {
            full_name: `Pengunjung Lima`
        }
    })

    await prisma.users.upsert({
        where: { email: `pengunjung6@gmail.com` },
        create: {
            uuid: `e9e624ae-1501-41c0-8323-b413df9e2201`,
            email: `pengunjung6@gmail.com`,
            full_name: `Pengunjung Enam`,
            phone: `09203820802`,
            password: `$2b$10$iE/K37JeYGp/rSLH9z9Dde4qcu/7NcOF90WMshym7VsoqfYXfrUgu`,
            is_active: true
        },
        update: {
            full_name: `Pengunjung Enam`
        }
    })

    await prisma.users.upsert({
        where: { email: `pengunjung7@gmail.com` },
        create: {
            uuid: `24f382ed-49d4-46e1-8fa0-f9a9ac86c795`,
            email: `pengunjung7@gmail.com`,
            full_name: `Pengunjung Tujuh`,
            phone: `09203820802`,
            password: `$2b$10$iE/K37JeYGp/rSLH9z9Dde4qcu/7NcOF90WMshym7VsoqfYXfrUgu`,
            is_active: true
        },
        update: {
            full_name: `Pengunjung Tujuh`
        }
    })

    // user_event_roles references a hardcoded demo event + creator user that
    // are NOT created by this seed. Only seed them when those rows already
    // exist (fresh DBs skip this block); otherwise the FK constraints
    // (event_id, created_by/updated_by) reject the insert.
    const demoEvent = await prisma.events.findUnique({
        where: { uuid: `b63146f1-93a5-4381-8ca8-62a03fa5684e` },
        select: { uuid: true },
    });
    const demoCreator = await prisma.users.findUnique({
        where: { uuid: `9a9eefca-7140-48ce-b6ab-25be292881fc` },
        select: { uuid: true },
    });
    if (demoEvent && demoCreator) {
        await prisma.user_event_roles.createMany({
            skipDuplicates: true,
            data: [
                {
                    uuid: `f7c241a4-9d4d-4c1c-aa81-a9012b540f50`,
                    created_by: `9a9eefca-7140-48ce-b6ab-25be292881fc`,
                    updated_by: `9a9eefca-7140-48ce-b6ab-25be292881fc`,
                    role: `VISITOR`,
                    status: `APPROVED`,
                    event_id: `b63146f1-93a5-4381-8ca8-62a03fa5684e`,
                    user_id: `3cad522c-3975-49bb-9ee2-97852f9b8220`
                },
                {
                    uuid: `5998d1aa-9708-4553-a6c8-b2f30edc8141`,
                    created_by: `9a9eefca-7140-48ce-b6ab-25be292881fc`,
                    updated_by: `9a9eefca-7140-48ce-b6ab-25be292881fc`,
                    role: `VISITOR`,
                    status: `APPROVED`,
                    event_id: `b63146f1-93a5-4381-8ca8-62a03fa5684e`,
                    user_id: `a20a2aa2-555f-4370-8000-d07fc9bd9974`
                },
                {
                    uuid: `ba0f1990-e118-4c49-8a41-1472c6260556`,
                    created_by: `9a9eefca-7140-48ce-b6ab-25be292881fc`,
                    updated_by: `9a9eefca-7140-48ce-b6ab-25be292881fc`,
                    role: `VISITOR`,
                    status: `APPROVED`,
                    event_id: `b63146f1-93a5-4381-8ca8-62a03fa5684e`,
                    user_id: `5620685e-33a9-49db-ad3b-158baadab6b4`
                },
                {
                    uuid: `4f57b465-3615-42f4-92f6-5a34deabed00`,
                    created_by: `9a9eefca-7140-48ce-b6ab-25be292881fc`,
                    updated_by: `9a9eefca-7140-48ce-b6ab-25be292881fc`,
                    role: `VISITOR`,
                    status: `APPROVED`,
                    event_id: `b63146f1-93a5-4381-8ca8-62a03fa5684e`,
                    user_id: `50f9f6b8-21de-4e34-b9c3-79c03d32c659`
                },
                {
                    uuid: `5c04ff4e-6cea-4a7c-8783-96f86a53bfc2`,
                    created_by: `9a9eefca-7140-48ce-b6ab-25be292881fc`,
                    updated_by: `9a9eefca-7140-48ce-b6ab-25be292881fc`,
                    role: `VISITOR`,
                    status: `APPROVED`,
                    event_id: `b63146f1-93a5-4381-8ca8-62a03fa5684e`,
                    user_id: `8dae2abc-aacd-4474-8085-8dfc77d2cf3c`
                },
                {
                    uuid: `68c0353f-bbd5-4785-93d7-da621ad09571`,
                    created_by: `9a9eefca-7140-48ce-b6ab-25be292881fc`,
                    updated_by: `9a9eefca-7140-48ce-b6ab-25be292881fc`,
                    role: `VISITOR`,
                    status: `APPROVED`,
                    event_id: `b63146f1-93a5-4381-8ca8-62a03fa5684e`,
                    user_id: `e9e624ae-1501-41c0-8323-b413df9e2201`
                },
                {
                    uuid: `b5234571-7e35-4110-9a6a-e1408530f335`,
                    created_by: `9a9eefca-7140-48ce-b6ab-25be292881fc`,
                    updated_by: `9a9eefca-7140-48ce-b6ab-25be292881fc`,
                    role: `VISITOR`,
                    status: `APPROVED`,
                    event_id: `b63146f1-93a5-4381-8ca8-62a03fa5684e`,
                    user_id: `24f382ed-49d4-46e1-8fa0-f9a9ac86c795`
                },
            ]
        })
    } else {
        console.warn(
            `Skipping user_event_roles: demo event (b63146f1-93a5-4381-8ca8-62a03fa5684e) ` +
                `or creator user (9a9eefca-7140-48ce-b6ab-25be292881fc) does not exist.`,
        );
    }
}

main()
    .then(() => {
        console.log(`Seeding Finished`);
    })
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })