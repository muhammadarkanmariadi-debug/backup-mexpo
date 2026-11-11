import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import {
  PrismaClient,
  EventRole,
  USER_EVENT_STATUS,
  TenantStatus,
  TenantMemberRole,
  SponsorLevel,
  BookingStatus,
  TicketStatus,
  ContactStatus,
  RoleType,
} from '@prisma/client';
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

// Default password hash for all seed users: "password123"
const PASSWORD_HASH =
  '$2b$10$fpSAK3SwVy0iluLTlALbUO374jadtHLP8vXMzJAXOGzWaIKbQ8dMS';

// Static IDs
const EVENT_1_ID = 'e872e411-bd56-4c40-b6f0-d46e2a297e2c'; // Flagship Tech Expo
const EVENT_2_ID = 'e872e411-bd56-4c40-b6f0-d46e2a297e2d'; // National Seminar & AI Workshop
const EVENT_3_ID = 'e872e411-bd56-4c40-b6f0-d46e2a297e2e'; // Digital Marketplace & Creative Fest

const CAT_FB = 'c3f1e967-0c77-4402-9988-9d2a233b2a2f';
const CAT_TECH = '9f3f4c6e-821f-4b08-9993-9c5950d98418';
const CAT_EDU = 'e339b4f0-4665-4f05-88db-b95610ec1f2e';
const CAT_MERCH = 'd449b4f0-4665-4f05-88db-b95610ec1f2f';

const TENANT_1_ID = 't8f2b528-9844-428a-bb0a-283dc1ec96a7';
const TENANT_2_ID = 't8f2b528-9844-428a-bb0a-283dc1ec96a8';
const TENANT_3_ID = 't8f2b528-9844-428a-bb0a-283dc1ec96a9';
const TENANT_4_ID = 't8f2b528-9844-428a-bb0a-283dc1ec96aa';
const TENANT_5_ID = 't8f2b528-9844-428a-bb0a-283dc1ec96ab';
const TENANT_6_ID = 't8f2b528-9844-428a-bb0a-283dc1ec96ac';

const SPK_1 = 's0000000-0000-0000-0000-000000000001';
const SPK_2 = 's0000000-0000-0000-0000-000000000002';
const SPK_3 = 's0000000-0000-0000-0000-000000000003';
const SPK_4 = 's0000000-0000-0000-0000-000000000004';

const WS_1 = 'w0000000-0000-0000-0000-000000000001';
const WS_2 = 'w0000000-0000-0000-0000-000000000002';
const WS_3 = 'w0000000-0000-0000-0000-000000000003';

const RAW_VISITORS = [
  { uuid: 'v0000000-0000-0000-0000-000000000001', email: 'visitor1@mexpo.id', full_name: 'Andi Pratama', phone: '081211110001', org: 'SMK Telkom Malang', roleType: RoleType.PARTICIPANT },
  { uuid: 'v0000000-0000-0000-0000-000000000002', email: 'visitor2@mexpo.id', full_name: 'Bella Safitri', phone: '081211110002', org: 'Universitas Brawijaya', roleType: RoleType.PARTICIPANT },
  { uuid: 'v0000000-0000-0000-0000-000000000003', email: 'visitor3@mexpo.id', full_name: 'Citra Kirana', phone: '081211110003', org: 'Tech Nusantara Ltd', roleType: RoleType.PARTICIPANT },
  { uuid: 'v0000000-0000-0000-0000-000000000004', email: 'visitor4@mexpo.id', full_name: 'Doni Setiawan', phone: '081211110004', org: 'Inovasi Digital Studio', roleType: RoleType.PARTICIPANT },
  { uuid: 'v0000000-0000-0000-0000-000000000005', email: 'visitor5@mexpo.id', full_name: 'Eka Saputra', phone: '081211110005', org: 'Politeknik Negeri Malang', roleType: RoleType.PARTICIPANT },
  { uuid: 'v0000000-0000-0000-0000-000000000006', email: 'visitor6@mexpo.id', full_name: 'Fani Rahmawati', phone: '081211110006', org: 'Freelance Designer', roleType: RoleType.PARTICIPANT },
  { uuid: 'v0000000-0000-0000-0000-000000000007', email: 'visitor7@mexpo.id', full_name: 'Gilang Ramadhan', phone: '081211110007', org: 'Startup Malang Hub', roleType: RoleType.PARTICIPANT },
  { uuid: 'v0000000-0000-0000-0000-000000000008', email: 'visitor8@mexpo.id', full_name: 'Hana Pertiwi', phone: '081211110008', org: 'SMK Telkom Malang', roleType: RoleType.PARTICIPANT },
  { uuid: 'v0000000-0000-0000-0000-000000000009', email: 'visitor9@mexpo.id', full_name: 'Indra Gunawan', phone: '081211110009', org: 'Cyber Security ID', roleType: RoleType.SUPERVISOR },
  { uuid: 'v0000000-0000-0000-0000-000000000010', email: 'visitor10@mexpo.id', full_name: 'Joko Widodo', phone: '081211110010', org: 'Komunitas Open Source', roleType: RoleType.PARTICIPANT },
  { uuid: 'v0000000-0000-0000-0000-000000000011', email: 'visitor11@mexpo.id', full_name: 'Kartika Sari', phone: '081211110011', org: 'Universitas Negeri Malang', roleType: RoleType.PARTICIPANT },
  { uuid: 'v0000000-0000-0000-0000-000000000012', email: 'visitor12@mexpo.id', full_name: 'Lukman Hakim', phone: '081211110012', org: 'SMK Telkom Malang', roleType: RoleType.PARTICIPANT },
];

async function safeUpsertUser(u: {
  uuid: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'SUPERADMIN' | 'USER';
  org?: string;
}) {
  const existing = await prisma.users.findFirst({
    where: {
      OR: [{ email: u.email }, { uuid: u.uuid }],
    },
  });

  if (existing) {
    return prisma.users.update({
      where: { uuid: existing.uuid },
      data: {
        email: u.email,
        full_name: u.full_name,
        phone: u.phone || existing.phone,
        organization: u.org || existing.organization,
        is_active: true,
        role: u.role,
      },
    });
  }
  return prisma.users.create({
    data: {
      uuid: u.uuid,
      email: u.email,
      full_name: u.full_name,
      phone: u.phone || '081234567890',
      organization: u.org || '',
      password: PASSWORD_HASH,
      is_active: true,
      role: u.role,
    },
  });
}

async function safeUpsertEvent(e: {
  uuid: string;
  name: string;
  slug: string;
  description: string;
  location: string;
  start_date: Date;
  end_date: Date;
  registration_start: Date;
  registration_deadline: Date;
  organizer_name: string;
  quota: number;
  status: any;
  visibility: any;
  event_type: any;
  ticket_mode: any;
  features?: any;
  souvenir_rules?: any;
  approved_by?: string;
  created_by: string;
  updated_by: string;
}) {
  const existing = await prisma.events.findFirst({
    where: {
      OR: [{ uuid: e.uuid }, { slug: e.slug }],
    },
  });
  if (existing) {
    return prisma.events.update({
      where: { uuid: existing.uuid },
      data: {
        name: e.name,
        slug: e.slug,
        description: e.description,
        location: e.location,
        start_date: e.start_date,
        end_date: e.end_date,
        registration_start: e.registration_start,
        registration_deadline: e.registration_deadline,
        organizer_name: e.organizer_name,
        quota: e.quota,
        status: e.status,
        visibility: e.visibility,
        event_type: e.event_type,
        ticket_mode: e.ticket_mode,
        features: e.features,
        souvenir_rules: e.souvenir_rules,
        approved_by: e.approved_by,
      },
    });
  }
  return prisma.events.create({ data: e });
}

async function safeUpsertTenant(t: {
  uuid: string;
  event_id: string;
  name: string;
  slug: string;
  description: string;
  email: string;
  phone: string;
  booth_number: string;
  category_id: string;
  status: any;
  created_by: string;
  updated_by: string;
}) {
  const existing = await prisma.tenants.findFirst({
    where: {
      OR: [{ uuid: t.uuid }, { slug: t.slug }],
    },
  });
  if (existing) {
    return prisma.tenants.update({
      where: { uuid: existing.uuid },
      data: {
        event_id: t.event_id,
        name: t.name,
        slug: t.slug,
        description: t.description,
        email: t.email,
        phone: t.phone,
        booth_number: t.booth_number,
        category_id: t.category_id,
        status: t.status,
      },
    });
  }
  return prisma.tenants.create({ data: t });
}

async function safeUpsertWorkshop(ws: {
  uuid: string;
  event_id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  start_time: Date;
  end_time: Date;
  quota: number;
  is_public: boolean;
  created_by: string;
  updated_by: string;
}) {
  const existing = await prisma.workshops.findFirst({
    where: {
      OR: [{ uuid: ws.uuid }, { slug: ws.slug }],
    },
  });
  if (existing) {
    return prisma.workshops.update({
      where: { uuid: existing.uuid },
      data: {
        event_id: ws.event_id,
        title: ws.title,
        slug: ws.slug,
        description: ws.description,
        location: ws.location,
        start_time: ws.start_time,
        end_time: ws.end_time,
        quota: ws.quota,
        is_public: ws.is_public,
      },
    });
  }
  return prisma.workshops.create({ data: ws });
}

const main = async () => {
  await prisma.$connect();
  console.log('🚀 Starting Comprehensive Database Seeder...');

  // ==========================================
  // PHASE 1: Users (Superadmin, Organizer, Committee, Tenants, Visitors)
  // ==========================================
  console.log('\n📦 Phase 1: Seeding Users...');

  const coreUsers = [
    { uuid: 'd9e0f074-b5b5-4b0d-b4b6-a21535496464', email: 'superadmin@mexpo.id', full_name: 'Super Admin Mexpo', role: 'SUPERADMIN' as const, phone: '081299990001' },
    { uuid: 'c4d2932b-9271-4dc7-ba84-3c1d471df797', email: 'organizer@mexpo.id', full_name: 'Budi Santoso (Event Owner)', role: 'USER' as const, phone: '081299990002' },
    { uuid: 'c0000000-0000-0000-0000-000000000001', email: 'committee1@mexpo.id', full_name: 'Siti Rahma (Panitia Utama)', role: 'USER' as const, phone: '081299990003' },
    { uuid: 'c0000000-0000-0000-0000-000000000002', email: 'committee2@mexpo.id', full_name: 'Ahmad Fauzi (Panitia Registrasi)', role: 'USER' as const, phone: '081299990004' },
    { uuid: 'a9b2b528-9844-428a-bb0a-283dc1ec96a7', email: 'tenant1@mexpo.id', full_name: 'Dimas Aditya (Kopi Kenangan)', role: 'USER' as const, phone: '081299990005' },
    { uuid: 'a9b2b528-9844-428a-bb0a-283dc1ec96a8', email: 'tenant2@mexpo.id', full_name: 'Rina Kusuma (Tech Innovate)', role: 'USER' as const, phone: '081299990006' },
    { uuid: 'a9b2b528-9844-428a-bb0a-283dc1ec96a9', email: 'tenant3@mexpo.id', full_name: 'Hendra Wijaya (EduNusa Media)', role: 'USER' as const, phone: '081299990007' },
    { uuid: 'a9b2b528-9844-428a-bb0a-283dc1ec96aa', email: 'tenant4@mexpo.id', full_name: 'Maya Putri (Telkom Merch Store)', role: 'USER' as const, phone: '081299990008' },
    { uuid: 'f912e752-61d0-44ec-b827-0cfc34a946b5', email: 'staff1@mexpo.id', full_name: 'Bagus Pratama (Staff Kasir F&B)', role: 'USER' as const, phone: '081299990009' },
    { uuid: 'f912e752-61d0-44ec-b827-0cfc34a946b6', email: 'staff2@mexpo.id', full_name: 'Dewi Lestari (Staff Booth Tech)', role: 'USER' as const, phone: '081299990010' },
  ];

  const userMap = new Map<string, string>();
  for (const u of coreUsers) {
    const res = await safeUpsertUser(u);
    userMap.set(u.email, res.uuid);
  }

  const saId = userMap.get('superadmin@mexpo.id')!;
  const orgId = userMap.get('organizer@mexpo.id')!;
  const com1Id = userMap.get('committee1@mexpo.id')!;
  const com2Id = userMap.get('committee2@mexpo.id')!;
  const tenant1Id = userMap.get('tenant1@mexpo.id')!;
  const tenant2Id = userMap.get('tenant2@mexpo.id')!;
  const tenant3Id = userMap.get('tenant3@mexpo.id')!;
  const tenant4Id = userMap.get('tenant4@mexpo.id')!;
  const staff1Id = userMap.get('staff1@mexpo.id')!;
  const staff2Id = userMap.get('staff2@mexpo.id')!;

  const visitorList: Array<{ uuid: string; email: string; full_name: string; org: string }> = [];
  for (const v of RAW_VISITORS) {
    const res = await safeUpsertUser({
      uuid: v.uuid,
      email: v.email,
      full_name: v.full_name,
      phone: v.phone,
      org: v.org,
      role: 'USER',
    });
    visitorList.push({ uuid: res.uuid, email: res.email, full_name: res.full_name, org: res.organization || v.org });

    // Bio profile
    await prisma.users_bio.upsert({
      where: { user_id: res.uuid },
      create: {
        user_id: res.uuid,
        city: 'Malang',
        role_type: v.roleType,
      },
      update: {
        city: 'Malang',
        role_type: v.roleType,
      },
    });
  }
  console.log(`✓ Seeded ${coreUsers.length} core users and ${visitorList.length} visitors.`);

  // ==========================================
  // PHASE 2: Tenant Categories
  // ==========================================
  console.log('\n📦 Phase 2: Seeding Tenant Categories...');
  const categories = [
    { uuid: CAT_FB, name: 'Food & Beverage', description: 'Kuliner, makanan ringan, dan aneka minuman.' },
    { uuid: CAT_TECH, name: 'Technology & Software', description: 'Inovasi teknologi informasi, aplikasi, dan hardware.' },
    { uuid: CAT_EDU, name: 'Education & Career', description: 'Institusi pendidikan, kursus, dan pengembangan karir.' },
    { uuid: CAT_MERCH, name: 'Merchandise & Creative', description: 'Karya kreatif, apparel, kerajinan tangan, dan souvenir.' },
  ];
  for (const cat of categories) {
    await prisma.tenant_categories.upsert({
      where: { uuid: cat.uuid },
      create: {
        uuid: cat.uuid,
        name: cat.name,
        description: cat.description,
        is_active: true,
        created_by: saId,
        updated_by: saId,
      },
      update: { name: cat.name, description: cat.description, is_active: true },
    });
  }
  console.log(`✓ Seeded ${categories.length} tenant categories.`);

  // ==========================================
  // PHASE 3: Events & Event Configuration
  // ==========================================
  console.log('\n📦 Phase 3: Seeding Events & Configuration...');
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const nextYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  // Event 1: Tech Expo & Career Fair 2026 (Flagship)
  const ev1 = await safeUpsertEvent({
    uuid: EVENT_1_ID,
    name: 'Tech Expo & Career Fair 2026',
    slug: 'tech-expo-career-fair-2026',
    description:
      'Pameran teknologi terbesar dan bursa kerja talenta digital persembahan SMK Telkom Malang & Komunitas Industri Kreatif.',
    location: 'Moklet Convention Hall & Dome, Malang',
    start_date: now,
    end_date: nextMonth,
    registration_start: now,
    registration_deadline: nextMonth,
    organizer_name: 'SMK Telkom Malang & Industri Partner',
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
    souvenir_rules: {
      usePointSystem: true,
      boothVisitPoint: { enabled: true, pointsPerVisit: 10 },
      seminarPoint: { enabled: true, pointsPerSeminar: 25 },
      transactionPoint: {
        enabled: true,
        pointsPerTransaction: 5,
        amountStep: 50000,
        pointsPerAmountStep: 10,
      },
      tiers: [
        { id: 'tier-sticker', name: 'Sticker Pack', minPoints: 20 },
        { id: 'tier-totebag', name: 'Totebag', minPoints: 50 },
        { id: 'tier-tshirt', name: 'Exclusive T-Shirt', minPoints: 100 },
      ],
    },
    approved_by: saId,
    created_by: orgId,
    updated_by: orgId,
  });

  // Event 2: National Seminar & AI Workshop 2026
  await safeUpsertEvent({
    uuid: EVENT_2_ID,
    name: 'National Seminar & AI Workshop 2026',
    slug: 'national-seminar-ai-workshop-2026',
    description:
      'Seminar nasional mendalam mengenai pemanfaatan Artificial Intelligence dan Large Language Models dalam rekayasa perangkat lunak modern.',
    location: 'Auditorium Lt. 3 Gedung Moklet, Malang',
    start_date: now,
    end_date: nextMonth,
    registration_start: now,
    registration_deadline: nextMonth,
    organizer_name: 'Pusat Riset AI & Data Science',
    quota: 1500,
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    event_type: 'SEMINAR',
    ticket_mode: 'FREE',
    features: {
      tenant: false,
      seminar: true,
      souvenir: false,
      product: false,
      pos: false,
      paidTicket: false,
    },
    approved_by: saId,
    created_by: orgId,
    updated_by: orgId,
  });

  // Event 3: Telkom Digital Marketplace & Creative Fest
  await safeUpsertEvent({
    uuid: EVENT_3_ID,
    name: 'Telkom Digital Marketplace & Creative Fest',
    slug: 'telkom-digital-marketplace-creative-fest',
    description:
      'Festival kreativitas siswa dan bazaar produk tenant digital, kriya, kuliner, serta karya inovatif generasi muda.',
    location: 'Lapangan Utama & Koridor Kreatif Moklet',
    start_date: now,
    end_date: nextYear,
    registration_start: now,
    registration_deadline: nextYear,
    organizer_name: 'OSIS & Ekstrakurikuler Kewirausahaan',
    quota: 3000,
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    event_type: 'MARKETPLACE',
    ticket_mode: 'PAID',
    features: {
      tenant: true,
      seminar: false,
      souvenir: true,
      product: true,
      pos: true,
      paidTicket: true,
    },
    souvenir_rules: { minVisitedBooth: 2, minTransaction: 25000 },
    approved_by: saId,
    created_by: orgId,
    updated_by: orgId,
  });
  console.log('✓ Seeded 3 diverse events (EXPO, SEMINAR, MARKETPLACE).');

  // ==========================================
  // PHASE 4: User Event Roles (Owner, Committee)
  // ==========================================
  console.log('\n📦 Phase 4: Seeding User Event Roles...');
  const organizerRoles = [
    // Event 1
    { uuid: 'ur-org-e1', event_id: ev1.uuid, user_id: orgId, role: 'OWNER' as const, status: 'APPROVED' as const },
    { uuid: 'ur-com1-e1', event_id: ev1.uuid, user_id: com1Id, role: 'COMMITTEE' as const, status: 'APPROVED' as const },
    { uuid: 'ur-com2-e1', event_id: ev1.uuid, user_id: com2Id, role: 'COMMITTEE' as const, status: 'APPROVED' as const },
    // Event 2
    { uuid: 'ur-org-e2', event_id: EVENT_2_ID, user_id: orgId, role: 'OWNER' as const, status: 'APPROVED' as const },
    { uuid: 'ur-com1-e2', event_id: EVENT_2_ID, user_id: com1Id, role: 'COMMITTEE' as const, status: 'APPROVED' as const },
    // Event 3
    { uuid: 'ur-org-e3', event_id: EVENT_3_ID, user_id: orgId, role: 'OWNER' as const, status: 'APPROVED' as const },
    { uuid: 'ur-com2-e3', event_id: EVENT_3_ID, user_id: com2Id, role: 'COMMITTEE' as const, status: 'APPROVED' as const },
  ];

  for (const r of organizerRoles) {
    await prisma.user_event_roles.upsert({
      where: { uuid: r.uuid },
      create: {
        uuid: r.uuid,
        event_id: r.event_id,
        user_id: r.user_id,
        role: r.role,
        status: r.status,
        created_by: orgId,
        updated_by: orgId,
      },
      update: { role: r.role, status: r.status },
    });
  }

  // ==========================================
  // PHASE 5: Event Contacts (Helpdesk, Sponsorship, Venue)
  // ==========================================
  console.log('\n📦 Phase 5: Seeding Event Contacts...');
  const contacts = [
    { uuid: 'ec-1', event_id: ev1.uuid, name: 'Helpdesk & Layanan Tiket', email: 'helpdesk@mexpo.id', phone_number: '081234567801' },
    { uuid: 'ec-2', event_id: ev1.uuid, name: 'Koordinator Pendaftaran Tenant', email: 'tenant-support@mexpo.id', phone_number: '081234567802' },
    { uuid: 'ec-3', event_id: ev1.uuid, name: 'Divisi Sponsorship & Kerjasama', email: 'partnership@mexpo.id', phone_number: '081234567803' },
    { uuid: 'ec-4', event_id: EVENT_2_ID, name: 'Sekretariat Seminar Nasional', email: 'seminar@mexpo.id', phone_number: '081234567804' },
  ];
  for (const c of contacts) {
    await prisma.event_contact.upsert({
      where: { uuid: c.uuid },
      create: {
        uuid: c.uuid,
        event_id: c.event_id,
        name: c.name,
        email: c.email,
        phone_number: c.phone_number,
        created_by: orgId,
        updated_by: orgId,
      },
      update: { name: c.name, email: c.email, phone_number: c.phone_number },
    });
  }
  console.log(`✓ Seeded ${contacts.length} event contacts.`);

  // ==========================================
  // PHASE 6: Event Speakers
  // ==========================================
  console.log('\n📦 Phase 6: Seeding Event Speakers...');
  const speakers = [
    {
      uuid: SPK_1,
      event_id: ev1.uuid,
      name: 'Dr. Pratama Ardiansyah',
      bio: 'Principal AI Researcher & Ex-Google DeepMind. Pakar dalam arsitektur Transformer dan generative agent.',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    },
    {
      uuid: SPK_2,
      event_id: ev1.uuid,
      name: 'Nadia Saraswati, M.Kom',
      bio: 'VP of Engineering at GoTo Financial. Berpengalaman 12+ tahun memimpin tim arsitektur distributed systems.',
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300',
    },
    {
      uuid: SPK_3,
      event_id: ev1.uuid,
      name: 'Reza Rahardian, S.Ds',
      bio: 'Head of Product Design at Tech Unicorn. Pembuat design system enterprise skala jutaan pengguna aktif.',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    },
    {
      uuid: SPK_4,
      event_id: ev1.uuid,
      name: 'Bambang Pamungkas, MBA',
      bio: 'Head of People & Culture. Telah merekrut lebih dari 2.000 talenta software engineering dan digital product.',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    },
  ];

  for (const s of speakers) {
    await prisma.event_speakers.upsert({
      where: { uuid: s.uuid },
      create: {
        uuid: s.uuid,
        event_id: s.event_id,
        name: s.name,
        bio: s.bio,
        photo: s.photo,
        status: 'APPROVED',
        created_by: orgId,
        updated_by: orgId,
      },
      update: { name: s.name, bio: s.bio, photo: s.photo },
    });
  }
  console.log(`✓ Seeded ${speakers.length} event speakers.`);

  // ==========================================
  // PHASE 7: Event Rundown / Agendas & Link Speakers
  // ==========================================
  console.log('\n📦 Phase 7: Seeding Event Rundowns & Agendas...');
  const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);

  const rundowns = [
    {
      uuid: 'rd-01',
      event_id: ev1.uuid,
      title: 'Registrasi Peserta & Morning Networking',
      description: 'Check-in QR code di gerbang utama, pembagian welcome kit, dan sarapan santai bersama komunitas.',
      start_time: new Date(d1.getTime()),
      end_time: new Date(d1.getTime() + 60 * 60 * 1000),
      speaker_id: null,
    },
    {
      uuid: 'rd-02',
      event_id: ev1.uuid,
      title: 'Opening Ceremony & Keynote Pengantar',
      description: 'Sambutan Kepala Sekolah SMK Telkom Malang, Perwakilan Dinas Pendidikan, dan Pembukaan Simbolis.',
      start_time: new Date(d1.getTime() + 60 * 60 * 1000),
      end_time: new Date(d1.getTime() + 120 * 60 * 1000),
      speaker_id: null,
    },
    {
      uuid: 'rd-03',
      event_id: ev1.uuid,
      title: 'Keynote Speech: Peta Jalan AI & Otomasi 2026',
      description: 'Pemaparan mendalam mengenai disrupsi Artificial Intelligence dan kesiapan talenta muda Indonesia.',
      start_time: new Date(d1.getTime() + 120 * 60 * 1000),
      end_time: new Date(d1.getTime() + 210 * 60 * 1000),
      speaker_id: SPK_1,
    },
    {
      uuid: 'rd-04',
      event_id: ev1.uuid,
      title: 'Panel Discussion: Karir Global & Arsitektur Cloud',
      description: 'Tanya jawab interaktif seputar tips menembus industri teknologi global dan standar rekayasa perangkat lunak.',
      start_time: new Date(d1.getTime() + 270 * 60 * 1000),
      end_time: new Date(d1.getTime() + 360 * 60 * 1000),
      speaker_id: SPK_2,
    },
    {
      uuid: 'rd-05',
      event_id: ev1.uuid,
      title: 'Design Workshop: Design Systems that Scale',
      description: 'Praktik langsung mendesain antarmuka responsif dan konsisten dengan token desain modern.',
      start_time: new Date(d1.getTime() + 375 * 60 * 1000),
      end_time: new Date(d1.getTime() + 465 * 60 * 1000),
      speaker_id: SPK_3,
    },
    {
      uuid: 'rd-06',
      event_id: ev1.uuid,
      title: 'Awarding Booth Terbaik, Doorprize & Penutupan',
      description: 'Pengumuman tenant terfavorit, undian merchandise, dan penutupan resmi acara hari pertama.',
      start_time: new Date(d1.getTime() + 480 * 60 * 1000),
      end_time: new Date(d1.getTime() + 540 * 60 * 1000),
      speaker_id: null,
    },
  ];

  for (const rd of rundowns) {
    await prisma.event_rundown.upsert({
      where: { uuid: rd.uuid },
      create: {
        uuid: rd.uuid,
        event_id: rd.event_id,
        title: rd.title,
        description: rd.description,
        start_time: rd.start_time,
        end_time: rd.end_time,
        created_by: orgId,
        updated_by: orgId,
      },
      update: {
        title: rd.title,
        description: rd.description,
        start_time: rd.start_time,
        end_time: rd.end_time,
      },
    });

    if (rd.speaker_id) {
      const existingRds = await prisma.event_rundown_speaker.findFirst({
        where: { rundown_id: rd.uuid, speaker_id: rd.speaker_id },
      });
      if (!existingRds) {
        await prisma.event_rundown_speaker.create({
          data: {
            uuid: `rds-${rd.uuid}`,
            rundown_id: rd.uuid,
            speaker_id: rd.speaker_id,
            created_by: orgId,
            updated_by: orgId,
          },
        });
      }
    }
  }
  console.log(`✓ Seeded ${rundowns.length} event rundowns with speaker relationships.`);

  // ==========================================
  // PHASE 8: Event Sponsors (Platinum, Gold, Silver, Bronze)
  // ==========================================
  console.log('\n📦 Phase 8: Seeding Event Sponsors...');
  const sponsors = [
    { uuid: 'sp-1', event_id: ev1.uuid, name: 'PT Telkom Indonesia (Persero) Tbk', level: SponsorLevel.PLATINUM, logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200' },
    { uuid: 'sp-2', event_id: ev1.uuid, name: 'Google Cloud Indonesia', level: SponsorLevel.PLATINUM, logo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&q=80&w=200' },
    { uuid: 'sp-3', event_id: ev1.uuid, name: 'Bank Mandiri Digital', level: SponsorLevel.GOLD, logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=200' },
    { uuid: 'sp-4', event_id: ev1.uuid, name: 'Dicoding Academy', level: SponsorLevel.GOLD, logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=200' },
    { uuid: 'sp-5', event_id: ev1.uuid, name: 'Ruangguru Tech', level: SponsorLevel.SILVER, logo: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=200' },
    { uuid: 'sp-6', event_id: ev1.uuid, name: 'Kopi Kenangan Official', level: SponsorLevel.BRONZE, logo: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=200' },
  ];

  for (const sp of sponsors) {
    await prisma.event_sponsors.upsert({
      where: { uuid: sp.uuid },
      create: {
        uuid: sp.uuid,
        event_id: sp.event_id,
        name: sp.name,
        level: sp.level,
        logo: sp.logo,
        created_by: orgId,
        updated_by: orgId,
      },
      update: { name: sp.name, level: sp.level, logo: sp.logo },
    });
  }
  console.log(`✓ Seeded ${sponsors.length} event sponsors across tiers.`);

  // ==========================================
  // PHASE 9: Workshops / Seminars
  // ==========================================
  console.log('\n📦 Phase 9: Seeding Workshops & Bookings...');
  const workshops = [
    {
      uuid: WS_1,
      event_id: ev1.uuid,
      title: 'Mastering AI Agent & LLM Fine-Tuning',
      slug: 'mastering-ai-agent-llm',
      description: 'Sesi workshop intensif hands-on membangun AI Agent otonom menggunakan framework mutakhir.',
      location: 'Lab Komputer 1 - Lab AI Moklet',
      start_time: new Date(d1.getTime() + 120 * 60 * 1000),
      end_time: new Date(d1.getTime() + 240 * 60 * 1000),
      quota: 80,
      speaker_id: SPK_1,
    },
    {
      uuid: WS_2,
      event_id: ev1.uuid,
      title: 'Scalable Next.js 16 & Micro-Frontends Architecture',
      slug: 'scalable-nextjs-16-architecture',
      description: 'Bedah arsitektur enterprise Next.js App Router, caching strategi, dan deployment PM2/Serverless.',
      location: 'Lab Komputer 2 - Software Eng Lab',
      start_time: new Date(d1.getTime() + 270 * 60 * 1000),
      end_time: new Date(d1.getTime() + 390 * 60 * 1000),
      quota: 60,
      speaker_id: SPK_2,
    },
    {
      uuid: WS_3,
      event_id: ev1.uuid,
      title: 'Tech Career Coaching: Portfolio & Coding Interview',
      slug: 'tech-career-coaching-interview',
      description: 'Simulasi interview teknis, review CV standar internasional, dan live mockup problem solving.',
      location: 'Mini Hall Lt. 2',
      start_time: new Date(d1.getTime() + 400 * 60 * 1000),
      end_time: new Date(d1.getTime() + 500 * 60 * 1000),
      quota: 50,
      speaker_id: SPK_4,
    },
  ];

  for (const ws of workshops) {
    const createdWs = await safeUpsertWorkshop({
      uuid: ws.uuid,
      event_id: ws.event_id,
      title: ws.title,
      slug: ws.slug,
      description: ws.description,
      location: ws.location,
      start_time: ws.start_time,
      end_time: ws.end_time,
      quota: ws.quota,
      is_public: true,
      created_by: orgId,
      updated_by: orgId,
    });

    // Link speaker
    const wsSpk = await prisma.workshop_speaker.findFirst({
      where: { workshop_id: createdWs.uuid, speaker_id: ws.speaker_id },
    });
    if (!wsSpk) {
      await prisma.workshop_speaker.create({
        data: {
          uuid: `ws-spk-${createdWs.uuid}`,
          workshop_id: createdWs.uuid,
          speaker_id: ws.speaker_id,
          created_by: orgId,
          updated_by: orgId,
        },
      });
    }
  }

  // Workshop Bookings
  for (let i = 0; i < Math.min(visitorList.length, 8); i++) {
    const v = visitorList[i];
    const targetWs = i % 2 === 0 ? WS_1 : WS_2;
    const bkUuid = `wbk-${targetWs}-${v.uuid.slice(-4)}`;
    await prisma.workshop_bookings.upsert({
      where: { uuid: bkUuid },
      create: {
        uuid: bkUuid,
        workshop_id: targetWs,
        user_id: v.uuid,
        status: i < 5 ? BookingStatus.CHECKED_IN : BookingStatus.REGISTERED,
        checkin_at: i < 5 ? now : null,
        created_by: v.uuid,
        updated_by: v.uuid,
      },
      update: {},
    });
  }
  console.log(`✓ Seeded ${workshops.length} workshops and visitor bookings.`);

  // ==========================================
  // PHASE 10: Tenants, Members & Products
  // ==========================================
  console.log('\n📦 Phase 10: Seeding Tenants, Members & Products...');
  const tenantConfigs = [
    {
      uuid: TENANT_1_ID,
      event_id: ev1.uuid,
      name: 'Kopi Kenangan Moklet',
      slug: 'kopi-kenangan-moklet',
      description: 'Menyajikan aneka kopi susu gula aren, roti bakar, dan minuman segar pendamping pameran.',
      email: 'moklet@kopikenangan.id',
      phone: '081234567101',
      booth_number: 'A-01',
      category_id: CAT_FB,
      status: TenantStatus.APPROVED,
      owner_id: tenant1Id,
      staff_id: staff1Id,
      products: [
        { uuid: 'p-101', name: 'Kopi Kenangan Mantan', price: 18000, desc: 'Espresso blend pilihan dengan susu segar dan gula aren asli.' },
        { uuid: 'p-102', name: 'Roti Coklat Klasik', price: 12000, desc: 'Roti lembut isi pasta coklat lumer premium.' },
        { uuid: 'p-103', name: 'Americano Ice', price: 15000, desc: 'Kopi hitam dingin segar tanpa gula.' },
      ],
    },
    {
      uuid: TENANT_2_ID,
      event_id: ev1.uuid,
      name: 'Tech Innovate Studio',
      slug: 'tech-innovate-studio',
      description: 'Penyedia komponen IoT, mikrokontroler, modul AI Edge, dan perangkat praktikum elektronika.',
      email: 'sales@techinnovate.id',
      phone: '081234567102',
      booth_number: 'B-05',
      category_id: CAT_TECH,
      status: TenantStatus.APPROVED,
      owner_id: tenant2Id,
      staff_id: staff2Id,
      products: [
        { uuid: 'p-201', name: 'IoT Smart Home Kit', price: 285000, desc: 'Kit lengkap sensor suhu, relay, dan modul ESP32 terprogram.' },
        { uuid: 'p-202', name: 'ESP32 Cam AI Module', price: 95000, desc: 'Kamera mikro untuk proyek computer vision dan deteksi objek.' },
        { uuid: 'p-203', name: 'Jumper Wire & Breadboard Pack', price: 25000, desc: 'Paket kabel jumper 40 pcs dan breadboard 830 titik.' },
      ],
    },
    {
      uuid: TENANT_3_ID,
      event_id: ev1.uuid,
      name: 'EduNusa Learning Media',
      slug: 'edunusa-learning-media',
      description: 'Penerbit buku teknologi, modul panduan sertifikasi pemrograman, dan voucher beasiswa kursus.',
      email: 'halo@edunusa.id',
      phone: '081234567103',
      booth_number: 'C-02',
      category_id: CAT_EDU,
      status: TenantStatus.APPROVED,
      owner_id: tenant3Id,
      staff_id: null,
      products: [
        { uuid: 'p-301', name: 'Buku Panduan Fullstack Next.js', price: 95000, desc: 'Buku panduan langkah demi langkah membangun aplikasi modern.' },
        { uuid: 'p-302', name: 'Flashcard Algoritma & Data Structure', price: 45000, desc: 'Kartu ringkasan materi interview teknis developer.' },
      ],
    },
    {
      uuid: TENANT_4_ID,
      event_id: ev1.uuid,
      name: 'Telkom Merch & Creative Goods',
      slug: 'telkom-merch-goods',
      description: 'Merchandise eksklusif Mexpo 2026, kaos limited edition, enamel pin, lanyard, dan stiker laptop.',
      email: 'merch@mexpo.id',
      phone: '081234567104',
      booth_number: 'D-01',
      category_id: CAT_MERCH,
      status: TenantStatus.APPROVED,
      owner_id: tenant4Id,
      staff_id: null,
      products: [
        { uuid: 'p-401', name: 'Kaos Mexpo 2026 Limited Edition', price: 110000, desc: 'Bahan Cotton Combed 24s sablon discharge tahan lama.' },
        { uuid: 'p-402', name: 'Enamel Pin Moklet Dev', price: 30000, desc: 'Pin logam enamel premium edisi expo teknologi.' },
        { uuid: 'p-403', name: 'Sticker Pack Developer 10 pcs', price: 15000, desc: 'Stiker vinyl anti air gambar logo tech & coding memes.' },
      ],
    },
    {
      uuid: TENANT_5_ID,
      event_id: ev1.uuid,
      name: 'Startup AI Nusantara Hub',
      slug: 'startup-ai-nusantara',
      description: 'Inkubator startup digital binaan alumni yang menawarkan konsultasi produk dan peluang karir.',
      email: 'incubator@ainusantara.id',
      phone: '081234567105',
      booth_number: 'E-03',
      category_id: CAT_TECH,
      status: TenantStatus.PENDING,
      owner_id: tenant1Id,
      staff_id: null,
      products: [],
    },
    {
      uuid: TENANT_6_ID,
      event_id: ev1.uuid,
      name: 'Vape & Tobacco Store',
      slug: 'vape-tobacco-store',
      description: 'Penjualan rokok elektronik dan aksesoris (ditolak karena tidak sesuai kebijakan expo sekolah).',
      email: 'contact@vapeshop.id',
      phone: '081234567106',
      booth_number: 'F-09',
      category_id: CAT_MERCH,
      status: TenantStatus.REJECTED,
      owner_id: tenant2Id,
      staff_id: null,
      products: [],
    },
  ];

  for (const t of tenantConfigs) {
    const tenant = await safeUpsertTenant({
      uuid: t.uuid,
      event_id: t.event_id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      email: t.email,
      phone: t.phone,
      booth_number: t.booth_number,
      category_id: t.category_id,
      status: t.status,
      created_by: t.owner_id,
      updated_by: t.owner_id,
    });

    // Tenant Member: Owner
    await prisma.tenant_members.upsert({
      where: { uuid: `tm-o-${tenant.uuid}` },
      create: {
        uuid: `tm-o-${tenant.uuid}`,
        tenant_id: tenant.uuid,
        user_id: t.owner_id,
        role: TenantMemberRole.OWNER,
        status: t.status,
        created_by: t.owner_id,
        updated_by: t.owner_id,
      },
      update: { status: t.status },
    });

    // User Event Role
    await prisma.user_event_roles.upsert({
      where: { uuid: `ur-t-${tenant.uuid}` },
      create: {
        uuid: `ur-t-${tenant.uuid}`,
        event_id: t.event_id,
        user_id: t.owner_id,
        role: EventRole.TENANT,
        status: t.status === TenantStatus.APPROVED ? USER_EVENT_STATUS.APPROVED : t.status === TenantStatus.REJECTED ? USER_EVENT_STATUS.REJECTED : USER_EVENT_STATUS.PENDING,
        created_by: orgId,
        updated_by: orgId,
      },
      update: {
        status: t.status === TenantStatus.APPROVED ? USER_EVENT_STATUS.APPROVED : t.status === TenantStatus.REJECTED ? USER_EVENT_STATUS.REJECTED : USER_EVENT_STATUS.PENDING,
      },
    });

    // Staff member if present
    if (t.staff_id) {
      await prisma.tenant_members.upsert({
        where: { uuid: `tm-s-${tenant.uuid}` },
        create: {
          uuid: `tm-s-${tenant.uuid}`,
          tenant_id: tenant.uuid,
          user_id: t.staff_id,
          role: TenantMemberRole.STAFF,
          status: TenantStatus.APPROVED,
          created_by: t.owner_id,
          updated_by: t.owner_id,
        },
        update: {},
      });
      await prisma.user_event_roles.upsert({
        where: { uuid: `ur-st-${tenant.uuid}` },
        create: {
          uuid: `ur-st-${tenant.uuid}`,
          event_id: t.event_id,
          user_id: t.staff_id,
          role: EventRole.TENANT,
          status: USER_EVENT_STATUS.APPROVED,
          created_by: orgId,
          updated_by: orgId,
        },
        update: {},
      });
    }

    // Seed Products
    for (const p of t.products) {
      await prisma.tenant_products.upsert({
        where: { uuid: p.uuid },
        create: {
          uuid: p.uuid,
          tenant_id: tenant.uuid,
          event_id: t.event_id,
          name: p.name,
          description: p.desc,
          price: p.price,
          created_by: t.owner_id,
          updated_by: t.owner_id,
        },
        update: { price: p.price, name: p.name },
      });
    }
  }
  console.log(`✓ Seeded ${tenantConfigs.length} tenants with members, roles, and products.`);

  // ==========================================
  // PHASE 11: Tickets & Registration Setup
  // ==========================================
  console.log('\n📦 Phase 11: Seeding Ticket Types, Fields & Registrations...');

  // Registration fields
  const regFields = [
    { uuid: 'rf-1', field_key: 'instansi', label: 'Asal Instansi/Perusahaan', type: 'TEXT' as const, req: true, pos: 1 },
    { uuid: 'rf-2', field_key: 'jabatan', label: 'Jabatan/Profesi', type: 'TEXT' as const, req: false, pos: 2 },
    { uuid: 'rf-3', field_key: 'alasan', label: 'Tujuan Mengikuti Event', type: 'TEXT' as const, req: false, pos: 3 },
  ];
  for (const rf of regFields) {
    await prisma.event_registration_fields.upsert({
      where: { uuid: rf.uuid },
      create: {
        uuid: rf.uuid,
        event_id: ev1.uuid,
        field_key: rf.field_key,
        label: rf.label,
        type: rf.type,
        required: rf.req,
        position: rf.pos,
        created_by: orgId,
        updated_by: orgId,
      },
      update: { label: rf.label, required: rf.req },
    });
  }

  // Ticket Types
  const TT_FREE = 'tt-01-free';
  const TT_VIP = 'tt-02-vip';
  const TT_WORKSHOP = 'tt-03-ws';

  await prisma.ticket_types.upsert({
    where: { uuid: TT_FREE },
    create: {
      uuid: TT_FREE,
      event_id: ev1.uuid,
      name: 'Reguler Pass (Gratis)',
      price: 0,
      created_by: orgId,
      updated_by: orgId,
    },
    update: { price: 0 },
  });
  await prisma.ticket_types.upsert({
    where: { uuid: TT_VIP },
    create: {
      uuid: TT_VIP,
      event_id: ev1.uuid,
      name: 'VIP All-Access Pass',
      price: 50000,
      created_by: orgId,
      updated_by: orgId,
    },
    update: { price: 50000 },
  });
  await prisma.ticket_types.upsert({
    where: { uuid: TT_WORKSHOP },
    create: {
      uuid: TT_WORKSHOP,
      event_id: ev1.uuid,
      name: 'Workshop & Networking Pass',
      price: 120000,
      created_by: orgId,
      updated_by: orgId,
    },
    update: { price: 120000 },
  });

  // Visitors Registrations, Tickets, QRs, Answers
  for (let i = 0; i < visitorList.length; i++) {
    const v = visitorList[i];
    const isApproved = i < 10;
    const isVIP = i % 3 === 0;
    const ticketTypeId = isVIP ? TT_VIP : TT_FREE;

    // User Event Role
    await prisma.user_event_roles.upsert({
      where: { uuid: `uer-vis-${ev1.uuid}-${v.uuid}` },
      create: {
        uuid: `uer-vis-${ev1.uuid}-${v.uuid}`,
        event_id: ev1.uuid,
        user_id: v.uuid,
        role: EventRole.VISITOR,
        status: isApproved ? USER_EVENT_STATUS.APPROVED : USER_EVENT_STATUS.PENDING,
        created_by: v.uuid,
        updated_by: v.uuid,
      },
      update: {
        status: isApproved ? USER_EVENT_STATUS.APPROVED : USER_EVENT_STATUS.PENDING,
      },
    });

    // Ticket
    const ticketUuid = `tkt-${v.uuid}`;
    await prisma.tickets.upsert({
      where: { uuid: ticketUuid },
      create: {
        uuid: ticketUuid,
        event_id: ev1.uuid,
        user_id: v.uuid,
        ticket_type_id: ticketTypeId,
        status: isApproved ? TicketStatus.PAID : TicketStatus.RESERVED,
        payment_method: isVIP ? 'QRIS' : 'CASH',
        created_by: v.uuid,
        updated_by: v.uuid,
      },
      update: { status: isApproved ? TicketStatus.PAID : TicketStatus.RESERVED },
    });

    // QR Code (clean up legacy typo `mexo:` if present)
    await prisma.qr_codes.deleteMany({
      where: { code_data: `mexo:${ev1.uuid}:${v.uuid}` },
    });
    await prisma.qr_codes.upsert({
      where: { code_data: `mexpo:${ev1.uuid}:${v.uuid}` },
      create: {
        uuid: `qr-e1-${v.uuid}`,
        code_data: `mexpo:${ev1.uuid}:${v.uuid}`,
        event_id: ev1.uuid,
        user_id: v.uuid,
      },
      update: {},
    });

    // Registration Answer
    const ansKey = `ans-${v.uuid}-instansi`;
    await prisma.registration_answers.upsert({
      where: { uuid: ansKey },
      create: {
        uuid: ansKey,
        event_id: ev1.uuid,
        user_id: v.uuid,
        field_key: 'instansi',
        value: v.org,
        created_by: v.uuid,
        updated_by: v.uuid,
      },
      update: { value: v.org },
    });

    // Venue Attendance (first 8 visitors attended)
    if (i < 8) {
      const existingAtt = await prisma.log_attendances.findFirst({
        where: { event_id: ev1.uuid, user_id: v.uuid },
      });
      if (!existingAtt) {
        await prisma.log_attendances.create({
          data: {
            uuid: `att-e1-${v.uuid}`,
            event_id: ev1.uuid,
            user_id: v.uuid,
            created_at: new Date(now.getTime() - i * 15 * 60 * 1000),
          },
        });
      }
    }
  }
  console.log(`✓ Seeded tickets, QR codes, answers, and attendance logs for ${visitorList.length} visitors.`);

  // ==========================================
  // PHASE 12: Booth Visits, Transactions, and Souvenirs
  // ==========================================
  console.log('\n📦 Phase 12: Seeding Booth Visits, POS Transactions & Souvenirs...');

  const approvedTenants = [TENANT_1_ID, TENANT_2_ID, TENANT_3_ID, TENANT_4_ID];
  for (let i = 0; i < Math.min(visitorList.length, 6); i++) {
    const v = visitorList[i];
    const visitCount = Math.min(approvedTenants.length, (i % 3) + 2);
    for (let tIdx = 0; tIdx < visitCount; tIdx++) {
      const tenantId = approvedTenants[tIdx];
      const bvUuid = `bv-${tenantId}-${v.uuid.slice(-4)}`;
      const existingBv = await prisma.booth_visits.findFirst({
        where: { tenant_id: tenantId, event_id: ev1.uuid, user_id: v.uuid },
      });
      if (!existingBv) {
        await prisma.booth_visits.create({
          data: {
            uuid: bvUuid,
            event_id: ev1.uuid,
            tenant_id: tenantId,
            user_id: v.uuid,
            created_by: tenant1Id,
            updated_by: tenant1Id,
          },
        });
      }
    }
  }

  // POS Transactions
  const sampleTransactions = [
    { uuid: 'tx-01', tenant_id: TENANT_1_ID, visitor_id: visitorList[0].uuid, amount: 30000, method: 'QRIS', prod_id: 'p-101', qty: 1, price: 18000, prod_id2: 'p-102', qty2: 1, price2: 12000 },
    { uuid: 'tx-02', tenant_id: TENANT_1_ID, visitor_id: visitorList[1].uuid, amount: 36000, method: 'CASH', prod_id: 'p-101', qty: 2, price: 18000 },
    { uuid: 'tx-03', tenant_id: TENANT_2_ID, visitor_id: visitorList[2].uuid, amount: 285000, method: 'TRANSFER', prod_id: 'p-201', qty: 1, price: 285000 },
    { uuid: 'tx-04', tenant_id: TENANT_3_ID, visitor_id: visitorList[3].uuid, amount: 95000, method: 'QRIS', prod_id: 'p-301', qty: 1, price: 95000 },
    { uuid: 'tx-05', tenant_id: TENANT_4_ID, visitor_id: visitorList[0].uuid, amount: 140000, method: 'QRIS', prod_id: 'p-401', qty: 1, price: 110000, prod_id2: 'p-402', qty2: 1, price2: 30000 },
    { uuid: 'tx-06', tenant_id: TENANT_4_ID, visitor_id: visitorList[4].uuid, amount: 45000, method: 'CASH', prod_id: 'p-402', qty: 1, price: 30000, prod_id2: 'p-403', qty2: 1, price2: 15000 },
  ];

  for (const tx of sampleTransactions) {
    await prisma.tenant_transactions.upsert({
      where: { uuid: tx.uuid },
      create: {
        uuid: tx.uuid,
        event_id: ev1.uuid,
        tenant_id: tx.tenant_id,
        visitor_id: tx.visitor_id,
        amount: tx.amount,
        transaction_date: now,
        payment_method: tx.method,
        paid: true,
        created_by: tenant1Id,
        updated_by: tenant1Id,
      },
      update: { amount: tx.amount, paid: true },
    });

    const existingDet = await prisma.tenant_transaction_details.findFirst({
      where: { transaction_id: tx.uuid },
    });
    if (!existingDet) {
      await prisma.tenant_transaction_details.create({
        data: {
          transaction_id: tx.uuid,
          product_id: tx.prod_id,
          quantity: tx.qty,
          purchase_price: tx.price,
        },
      });
      if (tx.prod_id2) {
        await prisma.tenant_transaction_details.create({
          data: {
            transaction_id: tx.uuid,
            product_id: tx.prod_id2,
            quantity: tx.qty2 || 1,
            purchase_price: tx.price2 || 0,
          },
        });
      }
    }
  }

  // Souvenirs (Visitors 0, 1, 3 have visited >= 3 booths & attended seminar)
  const souvenirRecipients = [visitorList[0], visitorList[1], visitorList[3]];
  for (const rec of souvenirRecipients) {
    const existingSouvenir = await prisma.souvenirs.findFirst({
      where: { event_id: ev1.uuid, user_id: rec.uuid },
    });
    if (!existingSouvenir) {
      await prisma.souvenirs.create({
        data: {
          event_id: ev1.uuid,
          user_id: rec.uuid,
          souvenir_name: 'Sticker Pack',
          points_earned: 30,
          points_spent: 20,
          created_by: com1Id,
          updated_by: com1Id,
        },
      });
    } else if (!existingSouvenir.souvenir_name || existingSouvenir.points_spent === 0) {
      await prisma.souvenirs.update({
        where: { id: existingSouvenir.id },
        data: { souvenir_name: 'Sticker Pack', points_earned: 30, points_spent: 20 },
      });
    }
  }
  console.log(`✓ Seeded booth visits, transactions, and granted souvenirs.`);

  // ==========================================
  // PHASE 13: Certificates, FAQs, and Contact Messages
  // ==========================================
  console.log('\n📦 Phase 13: Seeding Certificate Templates, FAQs & Inquiries...');

  // Certificate template
  await prisma.certificate_templates.upsert({
    where: { uuid: 'cert-tmpl-01' },
    create: {
      uuid: 'cert-tmpl-01',
      event_id: ev1.uuid,
      name: 'Sertifikat Resmi Peserta Tech Expo 2026',
      kind: 'PARTICIPANT',
      is_active: true,
      template: {
        width: 1920,
        height: 1080,
        elements: [
          { type: 'text', text: 'SERTIFIKAT PENGHARGAAN', x: 960, y: 240, fontSize: 48, fontWeight: 'bold' },
          { type: 'text', binding: { type: 'dynamic', key: 'full_name' }, x: 960, y: 520, fontSize: 56, fontWeight: 'bold' },
          { type: 'text', binding: { type: 'dynamic', key: 'event_name' }, x: 960, y: 640, fontSize: 32 },
        ],
      },
      created_by: orgId,
      updated_by: orgId,
    },
    update: { is_active: true },
  });

  // FAQs
  const faqItems = [
    { uuid: 'faq-01', q: 'Bagaimana cara mendaftar dan mendapatkan tiket expo?', a: 'Pilih event yang diinginkan, klik "Daftar Sekarang", pilih kategori tiket, dan lengkapi data form registrasi.', cat: 'Pendaftaran', order: 1 },
    { uuid: 'faq-02', q: 'Apakah tiket masuk Tech Expo 2026 berbayar?', a: 'Tersedia kategori Reguler gratis dan tiket VIP Pass / All-Access Workshop dengan fasilitas merchandise eksklusif.', cat: 'Tiket & Pembayaran', order: 2 },
    { uuid: 'faq-03', q: 'Bagaimana cara melakukan check-in di gerbang acara?', a: 'Buka dashboard tiket Anda di Mexpo, tunjukkan QR Code kepada panitia di pintu masuk untuk di-scan secara instan.', cat: 'Acara & Lokasi', order: 3 },
    { uuid: 'faq-04', q: 'Apa syarat untuk mendapatkan souvenir resmi acara?', a: 'Pengunjung harus melakukan check-in minimal ke 3 booth tenant dan menghadiri salah satu sesi seminar/workshop.', cat: 'Souvenir & Fasilitas', order: 4 },
    { uuid: 'faq-05', q: 'Bagaimana cara mendaftar sebagai tenant atau membuka booth pameran?', a: 'Pemilik usaha dapat mengajukan pendaftaran booth melalui formulir "Daftar Tenant" pada dashboard event.', cat: 'Tenant & Pameran', order: 5 },
    { uuid: 'faq-06', q: 'Kapan dan di mana saya bisa mengunduh e-sertifikat kehadiran?', a: 'E-sertifikat dapat diunduh langsung melalui dashboard Mexpo setelah Anda diverifikasi hadir pada sesi acara.', cat: 'Sertifikat', order: 6 },
  ];

  for (const f of faqItems) {
    await prisma.faqs.upsert({
      where: { uuid: f.uuid },
      create: {
        uuid: f.uuid,
        question: f.q,
        answer: f.a,
        category: f.cat,
        order: f.order,
        is_published: true,
        created_by: saId,
        updated_by: saId,
      },
      update: { question: f.q, answer: f.a, category: f.cat },
    });
  }

  // Contact Messages
  const contactMessages = [
    {
      uuid: 'cm-01',
      name: 'Hendrawan Pratama',
      email: 'hendrawan@partnertech.id',
      subject: 'Penawaran Kerjasama Media Partner & Sponsorship',
      message: 'Halo panitia Mexpo 2026, kami dari media teknologi ingin menawarkan kerjasama publikasi dan peliputan live.',
      status: ContactStatus.REPLIED,
      reply_message: 'Halo Pak Hendrawan, terima kasih atas tawarannya. Tim sponsorship kami telah mengirimkan proposal kerjasama melalui email.',
      replied_at: now,
      replied_by: saId,
    },
    {
      uuid: 'cm-02',
      name: 'Rian Firmansyah',
      email: 'rian.f@gmail.com',
      subject: 'Pertanyaan Kuota Workshop AI',
      message: 'Apakah kuota workshop AI masih tersedia jika saya mendaftar secara on-the-spot?',
      status: ContactStatus.UNREAD,
    },
    {
      uuid: 'cm-03',
      name: 'Clara Anindya',
      email: 'clara@startupstudio.id',
      subject: 'Pengajuan Tenant Tambahan',
      message: 'Apakah masih memungkinkan menambah 1 booth tambahan untuk showcase demo produk robotika?',
      status: ContactStatus.READ,
    },
  ];

  for (const cm of contactMessages) {
    await prisma.contact_message.upsert({
      where: { uuid: cm.uuid },
      create: {
        uuid: cm.uuid,
        name: cm.name,
        email: cm.email,
        subject: cm.subject,
        message: cm.message,
        status: cm.status,
        reply_message: cm.reply_message || null,
        replied_at: cm.replied_at || null,
        replied_by: cm.replied_by || null,
      },
      update: { status: cm.status },
    });
  }
  console.log(`✓ Seeded certificate templates, FAQs, and contact messages.`);

  console.log('\n✨ All modules seeded successfully and comprehensively!');
};

main()
  .then(() => {
    console.log(`\n🎉 Mexpo Database Seeder Finished Successfully!`);
  })
  .catch((error) => {
    console.error('❌ Error during database seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
