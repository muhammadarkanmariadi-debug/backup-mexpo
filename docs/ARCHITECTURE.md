# Mexpo — System Architecture

> Everything in this doc is **detected from actual files** (`package.json`, `nest-cli.json`, `prisma.config.ts`, `next.config.ts`, `.env`, `.github/workflows`), not guessed.
>
> Repo layout (this project root):
> - `dev-backend-mexpo-new/` — NestJS API
> - `dev-frontend-mexpo-new/` — Next.js web app
> - `Mexpo — Product & Flow Revision Documentation.docx` — product spec
> - `docs/` — this documentation suite
> - `AGENT.md` — context for AI coding agents

---

## 1. Tech Stack (verified)

### Backend — `dev-backend-mexpo-new`
| Layer | Technology | Version (from package.json) |
|---|---|---|
| Runtime | Node.js (ts-node / nest) | — |
| Framework | NestJS | 11.x |
| ORM | Prisma (`prisma-client-js`) + `@prisma/adapter-mariadb` | 7.x |
| Database | MySQL / MariaDB | (provider `mysql`) |
| Auth | `passport` + `passport-jwt`, `@nestjs/jwt` | |
| Password hashing | `bcrypt` | 6.x (10 rounds) |
| Validation | `class-validator` + `class-transformer` | |
| Email | `nodemailer` | 8.x |
| Object storage | `@aws-sdk/client-s3` against **MinIO-compatible** endpoint (`forcePathStyle`) | |
| File upload | `multer` | 2.x |
| Excel (unused) | `exceljs` | 4.x — installed, **never imported** |

### Frontend — `dev-frontend-mexpo-new`
| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | **16.2.6** ⚠️ custom build — read `node_modules/next/dist/docs/` before coding; this is NOT stock Next.js |
| React | React | 19.2.4 |
| Styling | Tailwind CSS v4 (CSS-first, no `tailwind.config.ts`) + `tw-animate-css` + `shadcn/tailwind.css` | 4.x |
| UI primitives | `radix-ui` (unified pkg) + shadcn-style components (`src/components/ui/`) | |
| Forms | `react-hook-form` + `zod` v4 + `@hookform/resolvers` | |
| State | `zustand` (single auth store, persisted to `sessionStorage`) | 5.x |
| Server data | Server Actions + fetch wrapper (server-only, httpOnly-token auth) — **TanStack Query v5** on top: `useApiQuery` / `useApiMutation` / `useList` (see `dev-frontend-mexpo-new/docs/TANSTACK-QUERY.md`) | 5.x |
| Icons | `@fortawesome` v7 + `lucide-react` | |
| Animation | `framer-motion`, `embla-carousel` (+autoplay), `react-countup` | |
| Maps | `leaflet` / `react-leaflet` (contact page) | |
| Encryption (client) | `crypto-js` (AES — see §5 caveat) | |
| Toasts | `sonner` | |

---

## 2. High-Level Architecture

```mermaid
flowchart TB
    subgraph FE["Frontend — Next.js 16 (App Router, server-first)"]
        PP[Public pages: /, /event/[slug], /about, /contact, /faq]
        AP[Auth pages: /auth, /verify-email]
        DP[Dashboard: /dashboard, /dashboard/[slug]]
        APIW[httpRequest wrapper + Server Actions]
        STORE[(zustand auth store)]
        PP --> APIW
        AP --> APIW
        DP --> APIW
        APIW --> COOKIE[(httpOnly token cookie)]
    end

    subgraph BE["Backend — NestJS 11 (port 3500)"]
        AUTH["Auth: POST /auth (JWT 1d) + Basic guard"]
        EV[Events / Event-Roles / Contacts / Rundowns / Sponsors / Speakers]
        WS[Workshops / Workshop-bookings]
        TEN[Tenants / Categories / Products / Transactions]
        ATT[Attendances: log_attendances / booth_visits / workshop check-in]
        SOU[Souvenirs]
        PUB[public-api (Basic guard)]
        REP[Reports (Basic guard)]
        USR[Users / verification / reset]
    end

    subgraph EXT["External services"]
        DB[(MariaDB via Prisma adapter)]
        MINIO[(MinIO/S3 - photos, logos, proofs)]
        SMTP[SMTP - nodemailer]
    end

    BE --> DB
    BE --> MINIO
    BE --> SMTP
    FE -->|HTTP + Basic/Bearer| BE
    FE -->|auth callback| COOKIE

    style DB fill:#f9f
    style MINIO fill:#9cf
    style SMTP fill:#fc9
```

Auth notes:
- **Two auth mechanisms on the backend:**
  1. **JWT Bearer** (`AuthGuard('jwt')`) — all logged-in app endpoints; token `{ uuid, role }`, 1-day expiry.
  2. **HTTP Basic** (`BasicGuard`, `BASIC_AUTH_USERNAME`/`BASIC_AUTH_PASSWORD`) — used for `POST /users*`, `GET /users/verification/:code` (actually public), `/public-api/*`, `/reports/*`. Effectively "trusted server" auth for the website/scripts.
- The frontend sends Basic credentials on most requests and attaches the Bearer token from an httpOnly cookie when present; payloads are AES-encrypted client→server (see §5 caveat).

---

## 3. Folder Structure (annotated)

### 3.1 Backend (`dev-backend-mexpo-new/src`)
```
src/
├─ main.ts                  # bootstrap; enableCors(); listen PORT ?? 3500; NO global prefix/versioning
├─ app.module.ts            # root module
├─ auth/                    # POST /auth (login -> JWT)
├─ users/                   # /users CRUD, /users/me, verification, reset-password
├─ events/                  # /events CRUD + role-scoped listings (/me, /visitor/me, /commitee/me, /tenant/me)
├─ event-users/             # /event-users — user_event_roles management (visitor/committee/tenant)
├─ event-contacts/          # /event-contacts
├─ event-rundowns/          # /event-rundowns (+ speaker attach)
├─ event-sponsors/          # /event-sponsors
├─ event_speakers/          # /event-speakers
├─ workshops/               # /workshops (the docx "seminar/session")
├─ workshop_bookings/       # /workshop-bookings
├─ tenants/                 # /tenants + invite/verify/members
├─ tenant-categories/       # /tenant-categories (super admin)
├─ tenant-products/         # /tenant-products
├─ tenant-transactions/     # /tenant-transactions (POS)
├─ attendances/             # /attendances (event / tenant / workshop check-in)
├─ souvenirs/               # /souvenirs (hardcoded rule: >=5 booth visits)
├─ reports/                 # /reports (JSON analytics, Basic guard)
├─ public-api/              # /public-api (public registration, event browsing)
├─ mail/                    # nodemailer (global module)
├─ s3/                      # MinIO/S3 wrapper (global module)
├─ prisma/                  # PrismaService (global module)
├─ bcrypt/                  # hash/compare/random password
└─ helper/                  # jwt.strategy, role-guard (Roles decorator), basic-auth, upload.format, validation.format
test/
├─ app.e2e-spec.ts          # ⚠ expects 'Hello World!' — currently fails
prisma/
├─ schema.prisma            # source of truth (see dev-backend-mexpo-new/docs/SCHEMA.md)
├─ migrations/
└─ seed.ts                  # 7 demo visitors for hardcoded event b63146f1-...
```

Convention: each feature module = `controller + service + module + dto/ + entities/`, one `*.spec.ts` (scaffolding only, "should be defined").

### 3.2 Frontend (`dev-frontend-mexpo-new/src`)
```
src/
├─ app/                          # Next.js App Router
│  ├─ (public)/                  # group: / , /event/[slug], /about, /contact, /faq
│  ├─ (auth)/                    # group: /auth, /verify-email
│  └─ (dashboard)/               # group: /dashboard, /dashboard/[slug]
├─ components/ui/                # shadcn-style primitives (button, select, pagination)
├─ context/                      # AuthContext, ThemeContext (ThemeProvider never mounted)
├─ entities/event/               # event entity + role dispatch helpers
├─ features/public/              # feature folders (events, About, contact, faq) + Hooks/
├─ shared/
│  ├─ components/                # button, Input, Checkbox, Card, Tabs, SearchBar, DataPagination, Gmaps...
│  └─ utils/                     # http-client ("use server"), auth-token (Basic/Bearer/AES), cookies, http-meta, cn
├─ services/                     # auth.service, public.service, event.service, user.service, workshop.service, verify-email.service
├─ lib/
│  ├─ query-client.ts            # TanStack Query QueryClient global (staleTime:0, retry, dsb)
│  ├─ query-keys.ts              # factory "alamat" cache untuk invalidasi (keys.*)
│  ├─ hooks/useApi.ts            # useApiQuery + useApiMutation + ApiError (normalisasi status:false→throw)
│  └─ providers/QueryProvider.tsx # pembungkus QueryClientProvider (dipasang di layout)
├─ stores/auth.store.ts          # zustand auth store (sessionStorage)
├─ templates/                    # PublicTemplate, AuthTemplate (+ MexpoCard, Toaster in AuthTemplate)
├─ widgets/                      # Navbar, Footer
├─ global.ts                     # BASE_DOMAIN / BASE_API_URL / auth creds / token key
├─ env.config.ts                 # ⚠ dead code (Supabase/Resend refs, unused)
└─ lib/utils.ts                  # cn() (duplicate of shared/utils/cn)
proxy.ts                         # ⚠ broken route protection (see RULES.md B10)
```

Route map (only 7 reachable routes exist):
`/`, `/event/[slug]`, `/about`, `/contact`, `/faq`, `/auth`, `/verify-email`, `/dashboard`, `/dashboard/[slug]`

`/dashboard/[slug]` dispatches by `userEventRoles[0].role`: `OwnerView | CommitteeView | TenantView | VisitorView` (all read-only event detail; publish/delete for owner/committee).

> ⚠️ Many nav targets referenced in code/UI are **dead links** (404): `/onsite-register/[slug]`, `/dashboard/[slug]/register`, `/dashboard/[slug]/tenant-list`, `/dashboard/[slug]/edit`, `/dashboard/[slug]/rundown`, `/events/committee/create`, `/profile`, `/forgot-passwords`, `/organizer/*`. See DESIGN.md §4.

---

## 4. API Conventions

- **Base URL:** no global prefix. Backend serves at `/` (e.g. `POST /auth`, `GET /events`). Default port **3500** (`PORT` env).
- **No API versioning.**
- **Auth headers:**
  - `Authorization: Bearer <JWT>` for logged-in endpoints.
  - `Authorization: Basic base64(user:pass)` for `public-api`, `reports`, and user-creation/reset endpoints.
- **Content:** JSON bodies (class-validator DTOs); multipart/form-data for photo/logo/proof uploads; one JSON-array field (`detail_transactions`) is passed as a JSON string inside multipart and parsed server-side.
- **Validation:** per-route `ValidationPipe` with custom `exceptionFactory` → `400 { error validation: ... }`.
- **Pagination convention:** `?page=` + `?quantity=` (both numbers), plus `?search=`. Response shape varies per endpoint (no global pagination wrapper).
- **Files:** images only (`jpeg/jpg/png/gif`), max **5 MB**, stored in MinIO/S3 buckets per entity (`expo-project`, `-event`, `-tenants`, `-products`, `-transactions`, `-speaker`, `-sponsor`).

### Endpoint map (high level)
| Area | Endpoints |
|---|---|
| Auth | `POST /auth` |
| Users | `POST /users`, `POST /users/superadmin`, `POST /users/reset-password`, `POST /users/reset-password/verify`, `GET /users/verification/:code`, `GET /users`, `GET /users/superadmin`, `GET /users/me`, `GET/PUT/DELETE /users/:id`, `PUT /users/me` |
| Events | `POST/GET /events`, `GET /events/me`, `GET /events/visitor/me`, `GET /events/commitee/me`, `GET /events/tenant/me`, `GET /events/me/:id`, `GET/PUT/DELETE /events/:id`, `POST /events/:id/publish-request` (A3), `PUT /events/:id/approval` (A3, SUPERADMIN), `GET /events/approval-queue` (A3, SUPERADMIN) |
| Event-users | `POST /event-users/visitor|committee|tenant/:event_id`, `GET /event-users/:event_id`, `PUT/DELETE /event-users/:id` |
| Contacts/Rundowns/Sponsors/Speakers | `/event-contacts/*`, `/event-rundowns/*` (+ `GET /event-rundowns/detail/:id` since FIX-17), `/event-sponsors/*` (+ `GET /event-sponsors/detail/:id` since FIX-17), `/event-speakers/*` |
| Workshops | `/workshops/*`, `/workshop-bookings/*`, `/workshops/speaker/:workshop_id` |
| Tenants | `/tenants/*`, `/tenants/invite/:tenant_id`, `/tenants/verify/:id`, `/tenants/verify/member/:id`, `/tenants/members/:tenant_id`, `/tenant-categories/*` |
| Products/POS | `/tenant-products/*`, `/tenant-transactions/*` |
| Attendances | `/attendances/event/:event_id`, `/attendances/tenant/:tenant_id`, `/attendances/workshop/:workshop_id` |
| Souvenirs | `/souvenirs/*` |
| Reports | `/reports/booth|category|visitor/:event_id`, `/reports/amount/booth|category|:event_id` |
| Public | `POST /public-api/registration/:event_id`, `GET /public-api/events` (+ `?event_type=` filter, hides PRIVATE — A7), `GET /public-api/events/active`, `GET /public-api/events/upcoming`, `GET /public-api/events/:id` (PUBLIC only), `GET /public-api/users/event/:event_id` |

---

## 5. Frontend ↔ Backend Contract

- Base URL chosen at runtime in `src/global.ts`:
  - Server-side: `NEXT_PUBLIC_BASE_URL_DEVELOPMENT` (default `http://localhost:3500`)
  - Client-side: `NEXT_PUBLIC_BASE_URL_PRODUCTION` (default `https://mexpo-api.smktelkom-mlg.sch.id`)
  - ⚠ The branch flips by `typeof window` — so SSR renders hit dev while browser calls hit prod in a production build. **Verify intended behavior.**
- `httpRequest()` (`"use server"`) → `httpGet/httpPost/httpPut/httpDelete/httpLogin`; the login path writes JWT into an **httpOnly cookie** via `next/headers` cookies.
- Payload encryption: `crypto-js` AES with `NEXT_PUBLIC_ENCRYPT_SECRET`. ⚠ This env var is **not set** in `.env` → AES runs with an **empty key**. Treat as obfuscation, not security. Same for `NEXT_PUBLIC_TOKEN_KEY` (unset).
- Public endpoints (`public-api`, verification) require Basic credentials, which are shipped in the Next.js env (`NEXT_PUBLIC_BASIC_AUTH_*`). ⚠ Basic creds in client-side env are exposed to the browser.

---

## 6. Deployment / Environment

### Backend (`dev-backend-mexpo-new/.github/workflows/deploy.yml`)
- Trigger: push to `main`.
- SSH (secrets `SSH_HOST/USER/KEY`, port `9002`) → server dir `/home/dev-backend-expo`:
  `git pull && npm install && npx prisma migrate dev --name init && npx prisma generate && npm run build && pm2 restart backend-expo && pm2 reload backend-expo`
- ⚠ **Risks:** `prisma migrate dev` in production (interactive/destructive, shadow DB required); `pm2 restart` + `pm2 reload` both run. Prefer `migrate deploy` + single `pm2 reload`.

### Frontend
- No CI workflow found in the frontend repo. `next start` presumed (scripts: `dev/build/start/lint`). No Dockerfiles detected.

### Environment variables
**Backend `.env` (10 vars, all present):** `DATABASE_URL`, `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `BASIC_AUTH_USERNAME`, `BASIC_AUTH_PASSWORD`, `JWT_SECRET`, `PUBLIC_FRONTEND_URL`.

**Referenced by code but MISSING from `.env`** (`[BLOCKED]` — mail/S3 will not work in this checkout):
`MAIL_HOST`, `MAIL_PORT` (default 587), `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASSWORD`, `AWS_REGION` (default `us-east-1`), `MINIO_ENDPOINT_UPLOAD`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_ENDPOINT`, `MINIO_BUCKET`, `PORT`, `SHADOW_DATABASE_URL`.

**Frontend `.env` (4 vars):** `NEXT_PUBLIC_BASE_URL_PRODUCTION`, `NEXT_PUBLIC_BASE_URL_DEVELOPMENT`, `NEXT_PUBLIC_BASIC_AUTH_USERNAME`, `NEXT_PUBLIC_BASIC_AUTH_PASSWORD`.

**Referenced but MISSING from frontend `.env`:** `NEXT_PUBLIC_TOKEN_KEY`, `NEXT_PUBLIC_ENCRYPT_SECRET` (both default to `""`).

**No `.env.example` existed in either repo** — created during Sprint 0/1 (F9): `dev-backend-mexpo-new/.env.example` and `dev-frontend-mexpo-new/.env.example` (frontend `.gitignore` updated with `!.env.example`).

### Known infra constraints
- S3 client configured for MinIO (`forcePathStyle: true`); production bucket domain referenced in `next.config.ts` image allowlist: `s3.smktelkom-mlg.sch.id`.
- Production API domain: `https://mexpo-api.smktelkom-mlg.sch.id` (SMK Telkom Malang hosting).

---

## 7. Security Review (observations, not fixes)

| # | Finding | Severity |
|---|---|---|
| 1 | JWT role claim trusted without DB re-check; token role only changes after expiry (1d) | Medium |
| 2 | JWT secret fallbacks differ between strategy and `JwtModule` (`default_secret_key` vs `secret-word`) | **FIXED (FIX-08)** — single secret, fail-fast if `JWT_SECRET` unset; role re-validation per request still an open decision |
| 3 | `PUT/DELETE /workshop-bookings/:id` have no authz check | **FIXED (FIX-02)** — SUPERADMIN / APPROVED OWNER/COMMITTEE / booking owner |
| 4 | `DELETE /event-users/:id` lacks SUPERADMIN path | Low — still open |
| 5 | Rejection of tenants/members **deletes rows** | **FIXED (FIX-03)** — rejection sets status; deletion explicit |
| 6 | Basic creds exposed via `NEXT_PUBLIC_*` on the frontend | Medium |
| 7 | AES "encryption" with empty secret; token key unset | Medium (obfuscation only) |
| 8 | Wide-open CORS (`app.enableCors()` with no options) | Medium |
| 9 | No rate limiting, no global validation pipe, no global guards | Low/Medium |
| 10 | Email failures silently swallowed (fire-and-forget) | Low |

---

## 8. Target Architecture (docx) vs Current — Summary

The docx mandates a config-driven, feature-based, multi-event **Event Operating System**. The current system is a **single-event-profile CRUD app** with a thin read-only frontend. The refactor areas called out in the docx (Event System, Permission, Public Page, Registration, Attendance, Tenant, POS & Product, Reporting) map to the gap list in `docs/PRD.md` §7 — none of the "Major Revision Areas" are implemented in code yet.
