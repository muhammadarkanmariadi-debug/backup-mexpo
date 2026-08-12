# AGENT.md — Context for AI Coding Agents on the Mexpo Project

> Read this file first. It is the entry point for any agent (Claude Code, etc.) working in this repo. It tells you what the product is, where the docs live, what conventions to follow, and — critically — what traps to avoid.

---

## 1. Project Summary (one paragraph)

Mexpo is a web platform for organizing events (currently oriented around an Expo/graduation event at SMK Telkom Malang). The product spec (`Mexpo — Product & Flow Revision Documentation.docx`) mandates a **modular "Event Operating System"** that supports many event types (Expo, Career Fair, Seminar, Graduation, Exhibition, Marketplace, Government, Campus/School) where every event is config-driven: feature toggles, visibility, quota, ticket mode, seminar/tenant/souvenir/POS configuration. The **current codebase does not yet implement that vision** — it is a single-event-profile CRUD app: a NestJS 11 + Prisma (MariaDB) backend with events, tenants, workshops (docx calls them "seminars"), attendance, souvenirs, and reports; and a Next.js 16 (App Router) + React 19 + Tailwind v4 frontend that currently only delivers public event browsing, auth, and a read-only role-based event dashboard. Most transactional flows (registration, tickets, QR check-in, POS scanning, souvenir redemption, certificates, tenant portal) are **unbuilt** — the PRD tags every feature `[DONE]/[IN PROGRESS]/[PLANNED]` so you can tell at a glance.

---

## 2. Tech Stack Quick Reference

| Layer | Where | Stack |
|---|---|---|
| Backend | `dev-backend-mexpo-new/` | NestJS 11, Prisma 7 (`prisma-client-js` + **hybrid DB**: `@prisma/adapter-pg` for PostgreSQL/Supabase or `@prisma/adapter-mariadb` for MySQL, chosen from `DATABASE_URL`/`DB_PROVIDER`), passport-jwt + bcrypt, class-validator, nodemailer, AWS SDK v3 vs **MinIO** (S3-compatible), multer |
| Frontend | `dev-frontend-mexpo-new/` | Next.js **16.2.6 (custom build — see ⚠ below)**, React 19, Tailwind CSS **v4 (CSS-first, no tailwind.config.ts)**, radix-ui + shadcn-style components, react-hook-form + zod v4, zustand, server actions + fetch wrapper, lucide-react + fontawesome, framer-motion, leaflet |
| Ports / URLs | — | Backend default port **3500**; dev API `http://localhost:3500`, prod API `https://mexpo-api.smktelkom-mlg.sch.id`. Backend runs as a **long-running NestJS process** (`node dist/src/main`) on VPS + PM2 via `.github/workflows/deploy.yml` or Render/Railway (`render.yaml`/`railway.json`); it ALSO deploys to **Vercel** via `api/index.js` → compiled `dist/src/serverless.js` (legacy `builds` config in `vercel.json` bypasses the NestJS framework preset, which breaks NestJS DI — see src imports note). Source uses **relative imports only** (no `src/...` baseUrl aliases) so it can be bundled anywhere. |

> ⚠ **Frontend: "This is NOT the Next.js you know."** `dev-frontend-mexpo-new/AGENTS.md` states this Next.js 16 build has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing any frontend code. Note `middleware` is renamed to `proxy.ts` (and the current `proxy.ts` is broken — see Blockers).

---

## 3. Folder Structure Map

```
Mexpo/
├─ docs/                          # ← project-wide docs (PRD, ARCHITECTURE)
├─ AGENT.md                       # ← this file
├─ scrum.md                       # ← product backlog
├─ .gitignore                     # ← monorepo root gitignore
├─ Mexpo — Product & Flow Revision Documentation.docx   # product spec (source of truth for [PLANNED])
├─ dev-backend-mexpo-new/
│  ├─ docs/                       # ← backend-specific docs (API handbook, SCHEMA, RULES, flows)
│  │  ├─ api-handbook.md          # endpoint reference + DB schema (Indonesian)
│  │  ├─ Mexpo-API-and-Backend-Design.docx  # ← generated from api-handbook.md
│  │  ├─ SCHEMA.md                # ← DB table-by-table breakdown
│  │  ├─ RULES.md                 # ← business rules & validation
│  │  └─ flows/*.mmd              # ← Mermaid user-flow diagrams (9 flows)
│  ├─ src/
│  │  ├─ auth/ users/ events/ event-users/
│  │  ├─ event-contacts/ event-rundowns/ event-sponsors/ event_speakers/
│  │  ├─ workshops/ workshop_bookings/
│  │  ├─ tenants/ tenant-categories/ tenant-products/ tenant-transactions/
│  │  ├─ attendances/ souvenirs/ reports/ public-api/
│  │  ├─ mail/ s3/ prisma/ bcrypt/ helper/
│  │  └─ main.ts (port 3500, Swagger at /docs)
│  ├─ prisma/schema.prisma        # DB schema (see dev-backend-mexpo-new/docs/SCHEMA.md)
│  ├─ prisma/seed.ts              # 7 demo visitors for hardcoded event b63146f1-...
│  └─ .github/workflows/deploy.yml
└─ dev-frontend-mexpo-new/
   ├─ docs/                       # ← frontend-specific docs (DESIGN)
   │  └─ DESIGN.md                # ← design tokens, fonts, component inventory, UI guidelines
   ├─ src/
   │  ├─ app/(public|auth|dashboard)/   # routes: /, /event/[uuid], /about, /contact, /faq, /auth, /verify-email, /dashboard, /dashboard/[uuid]
   │  ├─ features/ entities/ widgets/ shared/ components/ui/ templates/ stores/ services/ context/
   │  ├─ global.ts                 # BASE_API_URL + env keys
   │  └─ shared/utils/http-client.ts, auth-token.ts, cookies.ts
   └─ proxy.ts                     # ⚠ broken route protection
```

---

## 4. Documentation Map (read the right doc at the right time)

| Doc | When to consult |
|---|---|
| `docs/PRD.md` | Before any feature work — tells you the product intent (docx) vs what exists (code), tagged `[DONE]/[IN PROGRESS]/[PLANNED]`. Start here to answer "what should this feature do?" |
| `dev-backend-mexpo-new/docs/RULES.md` | Before implementing validation, quotas, permissions, souvenir rules, attendance logic — all business rules + validation constraints, plus known-broken rules `[BLOCKED]`. |
| `dev-backend-mexpo-new/docs/SCHEMA.md` | **Before touching the database** — full ER diagram + table-by-table breakdown of `prisma/schema.prisma`, and which docx-only tables don't exist yet. |
| `docs/ARCHITECTURE.md` | Before changing API endpoints, auth, deployment, or folder structure — tech stack, endpoint map, auth model (JWT + Basic), env vars, deploy workflow. |
| `dev-frontend-mexpo-new/docs/DESIGN.md` | Before any UI work — design tokens, fonts, component inventory, dead links, and UI guidelines. |
| `dev-backend-mexpo-new/docs/api-handbook.md` | Full API endpoint reference, DB schema, user flows, and conventions — written for frontend developers. Also available as `.docx`. |
| `dev-backend-mexpo-new/docs/flows/*.mmd` | Mermaid diagrams for 9 user flows (auth, event lifecycle, registration, workshop, check-in, tenant, POS, souvenir, reports). |
| `scrum.md` | When picking up a task — the product backlog: user stories for all unimplemented features, sprint order, priorities, and Definition of Done. Update the story's status/AC as you work. |

---

## 5. Conventions (inferred from existing code)

- **Backend module pattern:** one NestJS module per feature = `controller + service + module + dto/ + entities/`. Keep this shape for new modules.
- **Validation:** use `class-validator` + `class-transformer` DTOs on every body/query, with `@UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))` per route. Never skip validation on a new endpoint.
- **Auth:** logged-in endpoints → `@UseGuards(AuthGuard('jwt'))`; "public/trusted" endpoints (public-api, reports, user creation) → `BasicGuard`. Role checks for OWNER/COMMITTEE/TENANT/VISITOR are done **in services** (imperative), not with decorators — except `@Roles('SUPERADMIN')` which is a decorator.
- **Audit fields:** every owned table carries `created_by`/`updated_by` (FK → users) + `created_at`/`updated_at`. Follow this for new tables.
- **IDs:** UUIDs everywhere (Prisma `@default(uuid())`), except `souvenirs.id` and `tenant_transaction_details.id` (Int autoincrement). Match the surrounding table.
- **File uploads:** multipart, images only (`jpeg/jpg/png/gif`), max **5 MB** (see `helper/upload.format.ts`); store via `S3Service` into the per-entity bucket.
- **Frontend structure:** feature folders under `src/features/<area>/`, shared UI under `src/shared/components/`, primitives under `src/components/ui/`. Data-fetching pages are **server components** using the `httpRequest` wrapper; interactive bits are `"use client"`; forms use `react-hook-form` + zod.
- **HTTP client (`src/shared/utils/http-client.ts`):** sends plain JSON/FormData (the old AES encrypt/decrypt round-trip was removed — it corrupted non-ASCII → "Malformed UTF-8"). Responses are read as binary + decoded with a lenient `TextDecoder` (`fatal:false`), so invalid bytes never throw; non-JSON bodies return `{ status:false, message }`. Do **not** re-introduce payload encryption or `response.json()`-only parsing here.
- **Design tokens:** use CSS variables/`@theme` tokens (brand `#3c85f3`, `gray-900 #101828`), never raw hex in components. Reuse shared components before adding new shadcn primitives (there is **no** `components.json`).
- **Commit style (from git log):** short imperative `type:summary` messages, e.g. `update:create-event.dto & update-event.dto`, `add:souvenir condition`, `fixing mail service config`. One repo per app (`dev-backend-*`, `dev-frontend-*`); don't cross-commit.
- **Spelling quirk:** backend route uses the misspelling `commitee` (`/events/commitee/me`). Don't "fix" it silently — it's a public URL; note it if you change it.

---

## 6. Known Blockers / Contradictions (do not repeat past mistakes)

> Full detail in each doc; these are the ones most likely to bite an agent.

1. **Feature-config on events — PARTIALLY BUILT (Sprint 2/A2)** — `events.features` JSON + `events.visibility` + `assertEventFeature()` gating on mutation endpoints now exist. Read endpoints and some UI views are not gated yet. `ticketMode`/`paidTicket` columns still don't exist (only a `paidTicket` toggle).
2. **Publish-request / approval lifecycle — BUILT (Sprint 2/A3)** — `EventStatus` is `DRAFTED/PENDING/PUBLISHED/REJECTED/FINISHED`; `POST /events/:id/publish-request` (owner), `PUT /events/:id/approval` (SUPERADMIN), `GET /events/approval-queue`. Direct `PUBLISHED` via `PUT /events/:id` is blocked for non-superadmins. `approved_by` set at publish.
3. **Tickets / paid events — BUILT (Sprint 3/A1)** — `events.ticket_mode` (`FREE|PAID`), `ticket_types`, `tickets`, public purchase flow at `/event/[uuid]/register`, owner config at `/dashboard/[uuid]/registration`. Payment is **manual/POS placeholder** (free-form `payment_reference`/`payment_method` CASH/QRIS/TRANSFER) — **no payment gateway yet**. Ticket emails not sent (A11).
   - **Dynamic registration form — BUILT (Sprint 3/A8)** — `event_registration_fields` (7 types) + `registration_answers`. Public schema via `GET /public-api/registration-fields/:event_id`; registration POSTs `answers[]` and the backend validates required fields. The legacy hardcoded `users_bio` path in `public-api` is **still active** — do not remove without the A8 clarification decision.
4. **QR system — BUILT (Sprint 4/A4)** — `GET /qr-codes/my/:event_id` (returns PNG data URL + `code_data = mexo:<event_id>:<user_id>`) and `POST /qr-codes/resolve` (returns identity). Check-in UI at `/dashboard/[uuid]/check-in` (committee: venue/workshop; camera scan via `html5-qrcode`). **Booth check-in is a separate tenant page** at `/dashboard/[uuid]/booth-checkin` (linked from TenantView) because `POST /attendances/tenant/:id` requires an APPROVED tenant member — do not add a booth mode to the committee page. Attendance endpoints still take `user_id` — the resolve step bridges QR → user. POS/souvenir QR use not yet wired.
   - ⚠️ **html5-qrcode gotcha:** the scanner container must exist AND be visible when `scanner.start()` runs — React state updates are async, so after `setScanning(true)` wait ~150ms (`await new Promise(r => setTimeout(r,150))`) before `new Html5Qrcode("qr-reader")`. See `CheckInPage.tsx`.
5. **Souvenir rules engine — BUILT (Sprint 6/A5)** — `events.souvenir_rules` supports `minVisitedBooth` (default 5), `joinedSeminar`, `requireAll` (AND/ANY); evaluated by `src/souvenirs/souvenir-rules.ts`. **`minTransaction` is accepted by the DTO but NOT evaluated** — `tenant_transactions` has no visitor link; do not claim it works. Eligibility check endpoint: `POST /souvenirs/check/:event_id`; grant: `POST /souvenirs/:event_id` (one per event). Counter UI at `/dashboard/[uuid]/souvenir`.
6. **Tenant/member rejection** — since FIX-03 rejection **sets `REJECTED` status** (no row deletion). Deletion is explicit via `DELETE`.
7. **`PUT/DELETE /workshop-bookings/:id`** — since FIX-02 they are authorized (SUPERADMIN / APPROVED OWNER/COMMITTEE / booking owner). `GET /workshop-bookings/:workshop_id` filters by workshop (FIX-01).
8. **Frontend type-check** — fixed (FIX-06); `npx tsc --noEmit` returns 0 errors. Keep it green.
9. **Frontend `proxy.ts`** — rewritten (FIX-07) to read `request.cookies`; do not import `"use server"` modules there.
10. **`middleware` is now `proxy.ts`** in this Next.js build — don't create `src/middleware.ts` expecting it to work; read `node_modules/next/dist/docs/` first.
11. **Env gaps** — `.env.example` files now exist (F9) with all vars documented. Backend `.env` still lacks real `MAIL_*`/`MINIO_*` values and frontend lacks `NEXT_PUBLIC_TOKEN_KEY`/`NEXT_PUBLIC_ENCRYPT_SECRET` (AES empty key → obfuscation only).
12. **JWT secret** — unified + fail-fast if unset (FIX-08). Role is still trusted from the token without DB re-check (open decision) — don't rely on token roles being current.
13. **Hardcoded event UUID in `public-api` registration** forces `users_bio` (city/role_type/destination_country/departure_month) for one event only. This is legacy event-specific logic in a generic endpoint — ask before removing or generalizing.
14. **Dead nav links everywhere** — registration/tenant-portal/check-in/QR/certificate routes referenced in UI all 404. New UI must not assume those routes exist.
15. **CI uses `prisma migrate deploy`** (`deploy.yml`, changed from the former risky `migrate dev --name init`). DB is Supabase PostgreSQL; never use `migrate dev` outside local dev (needs a shadow DB).
16. **Toasts** — global `<Toaster/>` mounted in root layout (FIX-15); duplicate `AuthProvider` removed.
17. **Dashboard layout** — now a real shell with header + logout (FIX-16); no longer the public template.
18. **events pagination** — count/findMany filters aligned (FIX-05).
19. **`QueryUserDto.is_active`** — fixed (FIX-04); `?is_active=false` works.
20. **Terminology:** docx says **"seminar"**, code says **"workshop"** — same concept. Keep the mapping in mind.
21. **Tenant portal & roles — BUILT (Sprint 5):** `/dashboard/[uuid]/tenant` (Profil/Produk/Transaksi/Tim tabs). `tenant_members.role` = `OWNER|STAFF` — creator is OWNER, invites are STAFF. **Delete product/transaction + member management require an OWNER member or event manager/SUPERADMIN.** `tenant_transactions.payment_method` + `paid` exist (CASH/QRIS/TRANSFER free-form; no gateway). Verification UI at `/dashboard/[uuid]/verification`. `PUT /tenants/member/:id` changes role.
22. **`src/shared/utils/form-data.ts`** (restored in Sprint 5) builds multipart payloads — objects/arrays are JSON-stringified for the backend `@Transform`; use it for any multipart upload (products, transactions, tenant logo).
23. **Reports & export (Sprint 7):** `/dashboard/[uuid]/reports` (B8) + `GET /reports/export/:event_id` (A16, Basic auth, xlsx via `exceljs`). `report.service.ts` `downloadReportExport` fetches the binary client-side. Approval + ticket emails added (A11 partial). **Deferred:** A17 traffic, A15 plans, A12 speaker portal, A19 plugins, A20 custom domain — all need product/infra decisions.
24. **Reports upgraded + management gaps filled (Sprint 7 follow-up):** `recharts` installed; reports page has a **date-range filter** + Attendance & Transaction sections (bar/pie charts). Backend `reports.service.ts` `buildDateFilter` supports partial ranges. New owner/committee pages: `/dashboard/[uuid]/workshops`, `/team`, `/attendance`. When editing these, note the backend `FilterReportDto` accepts `start_date`/`end_date` (ISO), and `getEventAttendance`/report fetchers take date params.
25. **Follow-up #2 (profile / tenant reports / minTransaction / conditional fields):** `/profile`, `/forgot-passwords`, `/forgot-passwords/reset-password` pages added; tenant portal "Laporan" tab + `GET /reports/export/:event_id/tenant/:tenant_id`; `tenant_transactions.visitor_id` (set via POS visitor-QR scan) enables the souvenir `minTransaction` rule; `event_registration_fields.condition` (`{field_key,value}`) enables show-if registration fields (public form hides/omits them; backend skips their required check when hidden). Migrations `add_transaction_visitor`, `add_registration_field_condition`.
21. **`events.souvenir_rules` is a JSON column** — when writing it in Prisma, use `Prisma.InputJsonValue`/`eventsUncheckedUpdateInput` (scalar FK fields like `approved_by` are not on the checked update input).

---

## 7. Before You Code — Checklist

- [ ] Read `docs/PRD.md` §4 for the feature's status tag; if `[PLANNED]`, confirm the product intent from the docx before implementing.
- [ ] Check `dev-backend-mexpo-new/docs/RULES.md` for validation rules, quotas, permission rules, and `[BLOCKED]` flags that affect your feature.
- [ ] If touching the DB: read `dev-backend-mexpo-new/docs/SCHEMA.md`, then edit `dev-backend-mexpo-new/prisma/schema.prisma` and create a migration (`npx prisma migrate dev`) — never hand-edit SQL.
- [ ] If adding/editing API endpoints: follow the endpoint map & auth conventions in `docs/ARCHITECTURE.md` §4 (JWT vs Basic guard, per-route ValidationPipe, multipart for files, audit fields). See also `dev-backend-mexpo-new/docs/api-handbook.md` for the full reference.
- [ ] If doing UI work: read `dev-frontend-mexpo-new/docs/DESIGN.md` — use design tokens, reuse shared components, keep the server/client split, and re-check the type-check (`npx tsc --noEmit`) before and after.
- [ ] Verify no cross-cutting bug from §6 applies (e.g. you're not relying on workshop-booking authz, QR scanning, or feature toggles).
- [ ] Backend: run `npm run lint` + `npm run build` in `dev-backend-mexpo-new`; Frontend: `npm run lint` + `npx tsc --noEmit` in `dev-frontend-mexpo-new`.
- [ ] Update the relevant docs if your change alters schema, rules, endpoints, or UI patterns — keep the docs honest.
