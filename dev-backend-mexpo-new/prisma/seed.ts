import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import { getDatabaseUrl, isMysqlDatabase } from '../src/helper/db-provider';

const databaseUrl = getDatabaseUrl();
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is not set. Add a connection string (mysql:// or postgresql://) to .env',
  );
}
const isMysql = isMysqlDatabase(databaseUrl, process.env.DB_PROVIDER);

const prisma = new PrismaClient({
  adapter: isMysql
    ? new PrismaMariaDb(databaseUrl)
    : new PrismaPg({ connectionString: databaseUrl }),
});

const PASSWORD_HASH =
  '$2b$10$iE/K37JeYGp/rSLH9z9Dde4qcu/7NcOF90WMshym7VsoqfYXfrUgu'; // "password" or "password123" based on previous seeder

// ==========================================
// CONSTANTS & UUIDs
// ==========================================
const UID_SA = 'd9e0f074-b5b5-4b0d-b4b6-a21535496464';
const UID_ORG = 'c4d2932b-9271-4dc7-ba84-3c1d471df797';
const UID_TENANT = 'a9b2b528-9844-428a-bb0a-283dc1ec96a7';
const UID_STAFF = 'f912e752-61d0-44ec-b827-0cfc34a946b5';

const EVENT_ID = 'e872e411-bd56-4c40-b6f0-d46e2a297e2c';

const CAT_FB = 'c3f1e967-0c77-4402-9988-9d2a233b2a2f';
const CAT_EDU = 'e339b4f0-4665-4f05-88db-b95610ec1f2e';
const CAT_TECH = '9f3f4c6e-821f-4b08-9993-9c5950d98418';

const TENANT_1 = 't8f2b528-9844-428a-bb0a-283dc1ec96a7';

const PRODUCT_1 = 'p0000000-0000-0000-0000-000000000001';
const PRODUCT_2 = 'p0000000-0000-0000-0000-000000000002';

const WORKSHOP_1 = 'w912e752-61d0-44ec-b827-0cfc34a946b5';
const SPEAKER_1 = 's912e752-61d0-44ec-b827-0cfc34a946b5';

const TICKET_TYPE_FREE = 'tt000000-0000-0000-0000-000000000001';
const TICKET_TYPE_VIP = 'tt000000-0000-0000-0000-000000000002';

const VISITORS = Array.from({ length: 10 }).map((_, i) => ({
  uuid: `v0000000-0000-0000-0000-00000000000${i === 9 ? 'a' : i + 1}`,
  email: `visitor${i + 1}@mexpo.id`,
  full_name: `Visitor ${i + 1}`,
  phone: `0812000000${i < 10 ? '0' + i : i}`,
}));

const main = async () => {
  await prisma.$connect();
  console.log('Seeding started...');

  // ==========================================
  // PHASE 1: Users & Categories
  // ==========================================
  console.log('Phase 1: Users & Categories');
  await prisma.users.upsert({
    where: { email: 'superadmin@mexpo.id' },
    create: {
      uuid: UID_SA,
      email: 'superadmin@mexpo.id',
      full_name: 'Super Admin',
      phone: '08123456789',
      password: PASSWORD_HASH,
      is_active: true,
      role: 'SUPERADMIN',
    },
    update: { role: 'SUPERADMIN' },
  });
  await prisma.users.upsert({
    where: { email: 'organizer@mexpo.id' },
    create: {
      uuid: UID_ORG,
      email: 'organizer@mexpo.id',
      full_name: 'Event Organizer',
      phone: '08123456789',
      password: PASSWORD_HASH,
      is_active: true,
      role: 'USER',
    },
    update: {},
  });
  await prisma.users.upsert({
    where: { email: 'tenant@mexpo.id' },
    create: {
      uuid: UID_TENANT,
      email: 'tenant@mexpo.id',
      full_name: 'Tenant Owner',
      phone: '08123456789',
      password: PASSWORD_HASH,
      is_active: true,
      role: 'USER',
    },
    update: {},
  });
  await prisma.users.upsert({
    where: { email: 'staff@mexpo.id' },
    create: {
      uuid: UID_STAFF,
      email: 'staff@mexpo.id',
      full_name: 'Tenant Staff',
      phone: '08123456789',
      password: PASSWORD_HASH,
      is_active: true,
      role: 'USER',
    },
    update: {},
  });

  for (const v of VISITORS) {
    await prisma.users.upsert({
      where: { email: v.email },
      create: {
        uuid: v.uuid,
        email: v.email,
        full_name: v.full_name,
        phone: v.phone,
        password: PASSWORD_HASH,
        is_active: true,
        role: 'USER',
      },
      update: {},
    });
  }

  await prisma.tenant_categories.upsert({
    where: { uuid: CAT_FB },
    create: {
      uuid: CAT_FB,
      name: 'Food & Beverage',
      created_by: UID_SA,
      updated_by: UID_SA,
    },
    update: {},
  });
  await prisma.tenant_categories.upsert({
    where: { uuid: CAT_EDU },
    create: {
      uuid: CAT_EDU,
      name: 'Education',
      created_by: UID_SA,
      updated_by: UID_SA,
    },
    update: {},
  });
  await prisma.tenant_categories.upsert({
    where: { uuid: CAT_TECH },
    create: {
      uuid: CAT_TECH,
      name: 'Technology',
      created_by: UID_SA,
      updated_by: UID_SA,
    },
    update: {},
  });

  // ==========================================
  // PHASE 2: Event Core
  // ==========================================
  console.log('Phase 2: Event Core');
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  await prisma.events.upsert({
    where: { uuid: EVENT_ID },
    create: {
      uuid: EVENT_ID,
      name: 'Tech Expo & Career Fair 2026',
      slug: 'tech-expo-career-fair-2026',
      description:
        'Acara pameran teknologi terbesar dan bursa kerja untuk para talenta digital.',
      location: 'Convention Hall, Malang',
      start_date: today,
      end_date: nextMonth,
      registration_deadline: nextMonth,
      registration_start: today,
      organizer_name: 'Tech Community',
      quota: 5000,
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      event_type: 'EXPO',
      ticket_mode: 'PAID',
      features: {
        tenant: true,
        seminar: true,
        souvenir: true,
        product: true,
        pos: true,
        paidTicket: true,
      },
      souvenir_rules: { minVisitedBooth: 3 },
      approved_by: UID_SA,
      created_by: UID_ORG,
      updated_by: UID_ORG,
    },
    update: {
      status: 'PUBLISHED',
      ticket_mode: 'PAID',
      features: {
        tenant: true,
        seminar: true,
        souvenir: true,
        product: true,
        pos: true,
        paidTicket: true,
      },
    },
  });

  // Organizer Role
  await prisma.user_event_roles.upsert({
    where: { uuid: 'ur-org-01' },
    create: {
      uuid: 'ur-org-01',
      event_id: EVENT_ID,
      user_id: UID_ORG,
      role: 'OWNER',
      status: 'APPROVED',
      created_by: UID_ORG,
      updated_by: UID_ORG,
    },
    update: {},
  });

  // Registration Fields
  await prisma.event_registration_fields.upsert({
    where: { uuid: 'reg-f1' },
    create: {
      uuid: 'reg-f1',
      event_id: EVENT_ID,
      field_key: 'instansi',
      label: 'Asal Instansi/Perusahaan',
      type: 'TEXT',
      required: true,
      position: 1,
      created_by: UID_ORG,
      updated_by: UID_ORG,
    },
    update: {},
  });
  await prisma.event_registration_fields.upsert({
    where: { uuid: 'reg-f2' },
    create: {
      uuid: 'reg-f2',
      event_id: EVENT_ID,
      field_key: 'jabatan',
      label: 'Jabatan',
      type: 'TEXT',
      required: false,
      position: 2,
      created_by: UID_ORG,
      updated_by: UID_ORG,
    },
    update: {},
  });

  // Ticket Types
  await prisma.ticket_types.upsert({
    where: { uuid: TICKET_TYPE_FREE },
    create: {
      uuid: TICKET_TYPE_FREE,
      event_id: EVENT_ID,
      name: 'Reguler (Gratis)',
      price: 0,
      created_by: UID_ORG,
      updated_by: UID_ORG,
    },
    update: {},
  });
  await prisma.ticket_types.upsert({
    where: { uuid: TICKET_TYPE_VIP },
    create: {
      uuid: TICKET_TYPE_VIP,
      event_id: EVENT_ID,
      name: 'VIP Access',
      price: 50000,
      created_by: UID_ORG,
      updated_by: UID_ORG,
    },
    update: {},
  });

  // ==========================================
  // PHASE 3: Workshops & Speakers
  // ==========================================
  console.log('Phase 3: Workshops & Speakers');
  await prisma.event_speakers.upsert({
    where: { uuid: SPEAKER_1 },
    create: {
      uuid: SPEAKER_1,
      event_id: EVENT_ID,
      name: 'John Doe',
      bio: 'Tech Lead at GlobalTech',
      created_by: UID_ORG,
      updated_by: UID_ORG,
    },
    update: {},
  });

  await prisma.workshops.upsert({
    where: { uuid: WORKSHOP_1 },
    create: {
      uuid: WORKSHOP_1,
      event_id: EVENT_ID,
      title: 'Masa Depan AI di Industri Kreatif',
      slug: 'masa-depan-ai',
      description: 'Sesi diskusi mendalam mengenai pemanfaatan AI.',
      location: 'Room A',
      start_time: today,
      end_time: new Date(today.getTime() + 7200000),
      quota: 100,
      is_public: true,
      created_by: UID_ORG,
      updated_by: UID_ORG,
    },
    update: {},
  });

  // Link Speaker to Workshop
  const existingWsSpeaker = await prisma.workshop_speaker.findFirst({
    where: { workshop_id: WORKSHOP_1, speaker_id: SPEAKER_1 },
  });
  if (!existingWsSpeaker) {
    await prisma.workshop_speaker.create({
      data: {
        uuid: 'ws-sp-01',
        workshop_id: WORKSHOP_1,
        speaker_id: SPEAKER_1,
        created_by: UID_ORG,
        updated_by: UID_ORG,
      },
    });
  }

  // ==========================================
  // PHASE 4: Tenants
  // ==========================================
  console.log('Phase 4: Tenants & Products');
  await prisma.tenants.upsert({
    where: { uuid: TENANT_1 },
    create: {
      uuid: TENANT_1,
      event_id: EVENT_ID,
      name: 'Kopi Kenangan',
      slug: 'kopi-kenangan',
      description: 'Kopi kekinian',
      email: 'halo@kopikenangan.id',
      booth_number: 'B-01',
      category_id: CAT_FB,
      status: 'APPROVED',
      created_by: UID_TENANT,
      updated_by: UID_TENANT,
    },
    update: {},
  });

  // Tenant Members
  await prisma.user_event_roles.upsert({
    where: { uuid: 'ur-tenant-1' },
    create: {
      uuid: 'ur-tenant-1',
      event_id: EVENT_ID,
      user_id: UID_TENANT,
      role: 'TENANT',
      status: 'APPROVED',
      created_by: UID_ORG,
      updated_by: UID_ORG,
    },
    update: {},
  });
  await prisma.user_event_roles.upsert({
    where: { uuid: 'ur-tenant-2' },
    create: {
      uuid: 'ur-tenant-2',
      event_id: EVENT_ID,
      user_id: UID_STAFF,
      role: 'TENANT',
      status: 'APPROVED',
      created_by: UID_ORG,
      updated_by: UID_ORG,
    },
    update: {},
  });

  await prisma.tenant_members.upsert({
    where: { uuid: 'tm-owner-1' },
    create: {
      uuid: 'tm-owner-1',
      tenant_id: TENANT_1,
      user_id: UID_TENANT,
      role: 'OWNER',
      status: 'APPROVED',
      created_by: UID_TENANT,
      updated_by: UID_TENANT,
    },
    update: {},
  });
  await prisma.tenant_members.upsert({
    where: { uuid: 'tm-staff-1' },
    create: {
      uuid: 'tm-staff-1',
      tenant_id: TENANT_1,
      user_id: UID_STAFF,
      role: 'STAFF',
      status: 'APPROVED',
      created_by: UID_TENANT,
      updated_by: UID_TENANT,
    },
    update: {},
  });

  // Products
  await prisma.tenant_products.upsert({
    where: { uuid: PRODUCT_1 },
    create: {
      uuid: PRODUCT_1,
      tenant_id: TENANT_1,
      event_id: EVENT_ID,
      name: 'Kopi Kenangan Mantan',
      description: 'Es Kopi Susu Gula Aren',
      price: 18000,
      created_by: UID_TENANT,
      updated_by: UID_TENANT,
    },
    update: {},
  });
  await prisma.tenant_products.upsert({
    where: { uuid: PRODUCT_2 },
    create: {
      uuid: PRODUCT_2,
      tenant_id: TENANT_1,
      event_id: EVENT_ID,
      name: 'Roti Coklat',
      description: 'Roti isi coklat lumer',
      price: 12000,
      created_by: UID_TENANT,
      updated_by: UID_TENANT,
    },
    update: {},
  });

  // ==========================================
  // PHASE 5: Activity (Visitors, Tickets, Tx)
  // ==========================================
  console.log('Phase 5: Visitor Activity');
  for (let i = 0; i < VISITORS.length; i++) {
    const v = VISITORS[i];
    const isVIP = i % 3 === 0;

    // Role in event
    await prisma.user_event_roles.upsert({
      where: { uuid: `ur-v-${i}` },
      create: {
        uuid: `ur-v-${i}`,
        event_id: EVENT_ID,
        user_id: v.uuid,
        role: 'VISITOR',
        status: 'APPROVED',
        created_by: v.uuid,
        updated_by: v.uuid,
      },
      update: {},
    });

    // Ticket
    await prisma.tickets.upsert({
      where: { uuid: `tkt-v-${i}` },
      create: {
        uuid: `tkt-v-${i}`,
        event_id: EVENT_ID,
        user_id: v.uuid,
        ticket_type_id: isVIP ? TICKET_TYPE_VIP : TICKET_TYPE_FREE,
        status: 'PAID',
        payment_method: isVIP ? 'QRIS' : 'CASH',
        created_by: v.uuid,
        updated_by: v.uuid,
      },
      update: {},
    });

    // Answer
    const existingAns = await prisma.registration_answers.findFirst({
      where: { event_id: EVENT_ID, user_id: v.uuid, field_key: 'instansi' },
    });
    if (!existingAns) {
      await prisma.registration_answers.create({
        data: {
          uuid: `ans-v-${i}`,
          event_id: EVENT_ID,
          user_id: v.uuid,
          field_key: 'instansi',
          value: `Instansi ${i}`,
          created_by: v.uuid,
          updated_by: v.uuid,
        },
      });
    }

    // QR Code
    await prisma.qr_codes.upsert({
      where: { uuid: `qr-v-${i}` },
      create: {
        uuid: `qr-v-${i}`,
        event_id: EVENT_ID,
        user_id: v.uuid,
        code_data: `mexo:${EVENT_ID}:${v.uuid}`,
      },
      update: {},
    });

    // Attendance (first 5)
    if (i < 5) {
      const existingAtt = await prisma.log_attendances.findFirst({
        where: { event_id: EVENT_ID, user_id: v.uuid },
      });
      if (!existingAtt) {
        await prisma.log_attendances.create({
          data: { uuid: `att-v-${i}`, event_id: EVENT_ID, user_id: v.uuid },
        });
      }
    }

    // Workshop Booking (first 3)
    if (i < 3) {
      const existingBk = await prisma.workshop_bookings.findFirst({
        where: { workshop_id: WORKSHOP_1, user_id: v.uuid },
      });
      if (!existingBk) {
        await prisma.workshop_bookings.create({
          data: {
            uuid: `wb-v-${i}`,
            workshop_id: WORKSHOP_1,
            user_id: v.uuid,
            status: 'CHECKED_IN',
            checkin_at: today,
            created_by: v.uuid,
            updated_by: v.uuid,
          },
        });
      }
    }

    // Transactions & Booth Visits (first 4)
    if (i < 4) {
      const existingBv = await prisma.booth_visits.findFirst({
        where: { event_id: EVENT_ID, tenant_id: TENANT_1, user_id: v.uuid },
      });
      if (!existingBv) {
        await prisma.booth_visits.create({
          data: {
            uuid: `bv-v-${i}`,
            event_id: EVENT_ID,
            tenant_id: TENANT_1,
            user_id: v.uuid,
            created_by: UID_TENANT,
            updated_by: UID_TENANT,
          },
        });
      }

      await prisma.tenant_transactions.upsert({
        where: { uuid: `tx-v-${i}` },
        create: {
          uuid: `tx-v-${i}`,
          event_id: EVENT_ID,
          tenant_id: TENANT_1,
          visitor_id: v.uuid,
          amount: 30000,
          transaction_date: today,
          payment_method: 'QRIS',
          paid: true,
          created_by: UID_TENANT,
          updated_by: UID_TENANT,
        },
        update: {},
      });

      const existingDetails = await prisma.tenant_transaction_details.findFirst(
        { where: { transaction_id: `tx-v-${i}` } },
      );
      if (!existingDetails) {
        await prisma.tenant_transaction_details.create({
          data: {
            transaction_id: `tx-v-${i}`,
            product_id: PRODUCT_1,
            quantity: 1,
            purchase_price: 18000,
          },
        });
        await prisma.tenant_transaction_details.create({
          data: {
            transaction_id: `tx-v-${i}`,
            product_id: PRODUCT_2,
            quantity: 1,
            purchase_price: 12000,
          },
        });
      }
    }
  }
};

main()
  .then(() => {
    console.log(`Seeding Finished Successfully`);
  })
  .catch((error) => {
    console.error('Error during seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
