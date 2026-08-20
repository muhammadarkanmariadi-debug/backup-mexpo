# Mexpo — Business Rules & Validation

> **Purpose:** single source of truth for every business rule and validation constraint. Rules tagged `[BLOCKED]` are known-broken or unimplemented and must not be relied on. Items tagged `[NEEDS CLARIFICATION]` are ambiguous between the docx and the code — do not guess, ask.
>
> Legend: `[DOCX]` = from `Mexpo — Product & Flow Revision Documentation.docx` · `[CODE]` = extracted from actual implementation (`class-validator` DTOs, Prisma constraints, service logic).

---

## 1. Business Rules (from docx)

### 1.1 Event Configuration

| Rule | Source | Status |
|---|---|---|
| Every event must have a feature config that can be toggled: `tenant`, `seminar`, `souvenir`, `product`, `pos`, `paidTicket` | [DOCX] Core System Concept | `[IN PROGRESS]` — `events.features` JSON column + `assertEventFeature()` gating on mutation endpoints (Sprint 2/A2). Read endpoints still return data for disabled features (follow-up) |
| Event must support free, premium, and subscription-based features | [DOCX] | `[PLANNED]` — no plan/subscription model |
| Event visibility: `public` or `private` | [DOCX] Event Settings | `[DONE]` — `events.visibility` (Sprint 2/A2); private events hidden from `public-api` |
| Registration quota: `{ limited: true, quota: 3000 }` | [DOCX] Event Settings | `[IN PROGRESS]` — only `events.quota` (Int, `0` = default) exists; the `limited` boolean is implicit (quota `> 0` means limited) |
| Ticket mode: `free` or `paid` | [DOCX] Event Settings | `[PLANNED]` — no ticket concept; `paidTicket` feature toggle only |
| Event lifecycle: `draft → pending → published → rejected/finished` | [DOCX] Event Lifecycle | `[IN PROGRESS]` — `EventStatus` now `DRAFTED/PENDING/PUBLISHED/REJECTED/FINISHED` (Sprint 2/A3); publish-request + approval endpoints exist |
| Owner must submit a **publish request** and wait for **super admin approval** | [DOCX] Event Lifecycle | `[IN PROGRESS]` — `POST /events/:id/publish-request` (→ PENDING) + `PUT /events/:id/approval` (SUPERADMIN → PUBLISHED/REJECTED + `rejection_reason`); direct `PUBLISHED` via `PUT /events/:id` blocked for non-superadmins (Sprint 2/A3). FIX-13 already sets `approved_by` at publish time |
| Event should not be hardcoded for one event type (multi-event type support) | [DOCX] Overview | `[BLOCKED]` — no event-type field; `public-api` registration has a hardcoded event UUID (see §3.6) |

### 1.2 Souvenir Rules Engine

| Rule | Source | Status |
|---|---|---|
| Owner can define **custom rule combinations** (e.g. `{ minVisitedBooth: 5, minTransaction: 100000, joinedSeminar: true }`) | [DOCX] Souvenir Rules System | `[DONE]` (Sprint 6/A5) — `events.souvenir_rules` supports `minVisitedBooth`, `minTransaction`, `joinedSeminar`, `requireAll` (AND/ANY); evaluated by `evaluateSouvenirEligibility()`. **`minTransaction` is now evaluated** (POS transactions carry `visitor_id` via the visitor-QR scan) |
| Eligibility requires **≥ X booth visits** | [DOCX] example | `[DONE]` — configurable per-event via `souvenir_rules.minVisitedBooth`. **Only enforced when explicitly configured** (no invisible default rule; an event without `minVisitedBooth` does not require booth visits) |
| Eligibility can require **minimum transaction amount** | [DOCX] example | `[DONE]` (FIX: 2026-08) — evaluated against `tenant_transactions` where `visitor_id` is set via the POS visitor scan; see `souvenir-rules.ts` |
| Eligibility can require **joining a seminar** | [DOCX] example | `[DONE]` — `souvenir_rules.joinedSeminar` (non-cancelled workshop booking) |
| A visitor who already claimed cannot claim again | [DOCX] Visitor Flow | `[DONE]` — one `souvenirs` row per `(event_id, user_id)` |
| Redemption must be **rule-validated at scan time** | [DOCX] Visitor Flow | `[DONE]` (Sprint 6/A6+B7) — souvenir counter UI scans QR → `POST /souvenirs/check/:event_id` (rules + already-claimed) → grant; server re-validates |

> ⚠️ **CONTRADICTION (resolved):** docx = configurable rule-based engine; the engine now exists (A5) and **all three rules** (`minVisitedBooth`, `minTransaction`, `joinedSeminar`) are evaluated. The booth rule is only active when explicitly configured, so owners can fully opt out of it. `souvenir-rules.dto.ts`'s self-comment ("minTransaction accepted but NOT evaluated") is **stale** — it IS evaluated now.

### 1.3 Attendance & QR

| Rule | Source | Status |
|---|---|---|
| Attendance must be centralized with explicit types: `venue_checkin`, `seminar_checkin`, `tenant_checkin`, `visitor_booth_visit`, `souvenir_claim` | [DOCX] Attendance System | `[BLOCKED]` — attendance split across `log_attendances`, `booth_visits`, `workshop_bookings`; no type enum; `souvenir_claim` untracked |
| Every role has a **unique QR code** used for attendance, guest book, transaction identification, souvenir validation | [DOCX] QR Code System | `[DONE]` — `GET /qr-codes/my/:event_id` + `POST /qr-codes/resolve` (Sprint 4/A4); universal `mexpo:event:user` code |
| QR is **universal** for the visitor (venue, seminar, tenant guest book, POS, souvenir) | [DOCX] Visitor Flow | `[DONE]` — same code resolves identity for all check-in flows; POS/souvenir integration pending |

### 1.4 Roles & Permissions

| Rule | Source | Status |
|---|---|---|
| Committee has near-owner access but permissions **can be limited** | [DOCX] Committee Flow | `[IN PROGRESS]` — no per-committee permission configuration exists; in practice COMMITTEE ≈ OWNER for most mutations |
| Committee **cannot delete owner**, cannot **transfer ownership** | [DOCX] Committee Flow | `[DONE]` — `DELETE /events/:id` and `DELETE /event-users/:id` are OWNER-only. (Transfer-ownership feature does not exist at all — trivially satisfied.) |
| Tenant team has **owner** and **staff** roles | [DOCX] Tenant Flow | `[DONE]` (FIX) — `tenant_members.role` = `OWNER\|STAFF`; creator becomes OWNER; invites are STAFF; delete/role-change guarded by `assertTenantManager()` (see AGENT.md §6.21) |
| Owner can **override/edit speaker bio** | [DOCX] Speaker Flow | `[DONE]` — `PUT /event-speakers/:id` (OWNER/COMMITTEE) |
| Super admin approves publish requests | [DOCX] Event Lifecycle | `[BLOCKED]` — see §1.1 |

### 1.5 Subscription / Monetization (suggested)

| Rule | Source | Status |
|---|---|---|
| Free: basic public page, basic registration, basic attendance | [DOCX] | `[PLANNED]` |
| Premium: seminar mgmt, tenant mgmt, product mgmt, POS, advanced souvenir rules, analytics, Excel export, paid ticketing, custom domain | [DOCX] | `[PLANNED]` (Excel export even has the dependency installed but unused — see §3.5) |
| Subscription: quota increases, extra committee | [DOCX] | `[PLANNED]` |

> These are labeled "Suggested Feature Monetization" in the docx — **no pricing/plan decision was made**. Treat as directional, not contractual.

---

## 2. Validation Rules (from actual code)

All backend DTOs use **class-validator + class-transformer** (no Zod on backend). Each controller route runs `ValidationPipe({ exceptionFactory: FormatValidation })` → `400 Bad Request "error validation: ..."`. Frontend uses **zod v4** for its (currently few) forms.

### 2.1 users (`CreateUserDto`, `UpdateUserDto`)

| Field | Rules (code) |
|---|---|
| `full_name` | required, string |
| `email` | required, valid email |
| `password` | required, string (hashed with bcrypt, 10 rounds) |
| `phone` | required, string |
| `organization` | optional |
| `photo` | multipart file, optional; **image only** (`jpeg/jpg/png/gif`), **max 5 MB** (`upload.format.ts`) |

`CreateUserDto` produces `is_active=false` and requires email verification before use. `POST /users/superadmin` produces `is_active=true`.

### 2.2 events (`CreateEventDto`, `UpdateEventDto`)

| Field | Rules (code) |
|---|---|
| `name` | required, string |
| `description` | required, string (LongText) |
| `location` | required, string |
| `start_date` | required, date (`@IsDate` + `@Type(() => Date)`) |
| `end_date` | required, date |
| `registration_start` | optional date |
| `registration_deadline` | optional date |
| `organizer_name` | optional string |
| `quota` | optional int (`@IsInt`) |
| `status` | optional, enum `EventStatus` (`DRAFTED/PUBLISHED/FINISHED`) — **Update only** |
| `photo` | multipart file, optional; image only, 5 MB |

> ⚠️ **CONTRADICTION with docx Event Settings:** the docx config shape (`visibility`, `ticketMode`, `quota {limited, quota}`) is not represented in these DTOs. Only flat `quota`/`status` exist.

### 2.3 tenant (`CreateTenantDto`, `UpdateTenantDto`)

| Field | Rules (code) |
|---|---|
| `name` | required, string |
| `description` | required, string |
| `phone` | required, string |
| `category_id` | required, string |
| `website` / `email` | optional, string |
| `booth_number` | optional (update only) |
| `logo` | multipart file, optional; image only, 5 MB |
| `status` | verify DTO: enum `TenantStatus` (`PENDING/APPROVED/REJECTED`) |

### 2.4 tenant-products (`CreateTenantProductDto`)

| Field | Rules (code) |
|---|---|
| `name` | required, string |
| `description` | required, string |
| `price` | required, `@IsNumber @Min(0)` (`@Type(() => Number)`) |
| `photo` | multipart file, optional; image only, 5 MB |

### 2.5 tenant-transactions (`CreateTenantTransactionDto`)

| Field | Rules (code) |
|---|---|
| `detail_transactions` | required array of `{ product_id, quantity }`; JSON string parsed from multipart (`@Transform(JSON.parse)`), nested-validated (`@ValidateNested`) |
| `quantity` | `@Min(1)` |
| `proof` | multipart file, optional |
| `amount` | **computed server-side** as `Σ quantity × product.price` — clients cannot set it |

### 2.6 event-speakers (`CreateEventSpeakerDto`)

| Field | Rules (code) |
|---|---|
| `name` | required, string |
| `bio` | required, string (LongText) |
| `photo` | multipart file, optional; image only, 5 MB |

### 2.7 workshops (`CreateWorkshopDto`)

| Field | Rules (code) |
|---|---|
| `title` | required, string |
| `description` | required, string |
| `location` | required, string |
| `start_time` / `end_time` | required, date |
| `quota` | optional, `@Min(0)` (`0` = unlimited) |
| `is_public` | optional, boolean |
| speaker attach | `POST /workshops/speaker/:workshop_id` with `{ speaker_id }` |

### 2.8 Query DTOs (shared pattern)

`page?` / `quantity?` → `@IsNumber @Type(() => Number)`; `search?` → `@IsString`; plus:
- attendances/reports: `start_date?`, `end_date?` (reports treat `end_date` as **inclusive** by adding `+24h`)
- workshop-bookings: `status?` enum `BookingStatus`
- event-users: status/role enums

### 2.9 contact-messages (`CreateContactMessageDto` — `POST /contact`)

| Field | Validation |
|---|---|
| `name` | `@IsNotEmpty` / `@IsString`, max 120 |
| `email` | `@IsString` + `@IsEmail`, max 120 |
| `subject` | `@IsNotEmpty` / `@IsString`, max 150 |
| `message` | `@IsNotEmpty` / `@IsString`, min 10, max 4000 |

---

## 3. Service-Level Business Rules (from code)

### 3.1 Auth & Accounts
- JWT expires in **1 day**; payload is `{ uuid, role }` (role trusted from token — see §4).
- Email verification token expires in **72h**; reset-password token in **24h**; both single-use (deleted after use).
- New accounts created via tenant-invite / public-registration get a **random 10-char password** (`createRandomPassword`: ≥1 upper, lower, digit, symbol, then shuffled) and credentials are emailed.
- A user without `is_active=true` cannot meaningfully use the app (verification required).

### 3.2 Events
- Creator of an event automatically becomes `user_event_roles` `OWNER`/`APPROVED`.
- Event detail: only super admin can list all events (`GET /events`); `GET /events/:id` is JWT-authenticated (any user).
- `PUT /events/:id`: only OWNER/COMMITTEE (APPROVED) or SUPERADMIN.
- `DELETE /events/:id`: **OWNER only**.
- Registration window (`registration_start`/`registration_deadline`) is **enforced** since FIX-14 — `event-users/visitor` and `public-api/registration` reject outside the window.

### 3.3 Event Roles
- Visitor self-registration to event (`POST /event-users/visitor/:event_id`) **and** the public flow (`POST /public-api/registration/:event_id`) both enforce `events.quota` (`quota > 0` = limited) — if quota reached, registration is rejected (FIX 2026-08 closed the public-path bypass).
- Committee assignment with email → APPROVED immediately; without email → self-request `PENDING`.
- Tenant self-request → `PENDING`.
- `PUT /event-users/:id` with `status = REJECTED` **deletes the role row** (and syncs `tenant_members`). ⚠️ Destructive on rejection; inconsistent with the tenant verification path which keeps the row with `REJECTED` status (FIX-03).

### 3.4 Attendance (all `[CODE]` — docx rules differ)
- **Event check-in** (`POST /attendances/event/:event_id`): recorder must be APPROVED COMMITTEE/OWNER; target must be APPROVED VISITOR (COMMITTEE/OWNER/TENANT excluded); **once per calendar day** per user per event.
- **Booth visit** (`POST /attendances/tenant/:tenant_id`): recorder must be APPROVED `tenant_members`; **once per day per tenant** per user.
- **Workshop check-in** (`POST /attendances/workshop/:workshop_id`): creates/updates `workshop_bookings` → `CHECKED_IN` + sets `checkin_at`; if `workshop.quota > 0` and full, rejected.

### 3.5 Reports
- All report endpoints are behind **HTTP Basic auth** (`BASIC_AUTH_USERNAME`/`BASIC_AUTH_PASSWORD`), not JWT.
- `end_date` filter is inclusive (`+24h`).

> ✅ **Excel export `[DONE]` (Sprint 7/A16):** `GET /reports/export/:event_id` (Basic auth) streams an xlsx workbook (Ringkasan + Visitor per Booth + Transaksi per Booth) using `exceljs`. JSON report endpoints remain.

### 3.6 Public Registration (hardcoded event — `[NEEDS CLARIFICATION]`)
- `POST /public-api/registration/:event_id`:
  - If email unknown → creates user (`is_active=true`, role USER) + sends credentials email.
  - If known → upserts event role to APPROVED.
  - **Hardcoded**: for event UUID `05f3af5d-b049-43b2-985f-78d5214b8f56`, it additionally requires/upserts `users_bio` (`city`, `role_type`, `destination_country`, `departure_month`). A second UUID (`7fbef9fe-...`) appears in a comment.
- This is event-specific business logic embedded in a generic endpoint. **Ask before touching** — see AGENT.md.

### 3.7 Contact (`POST /contact` — publik)
- **Tanpa auth** — endpoint publik di `contact-messages` controller (bukan `public-api`, karena controller itu Basic-auth di level class).
- **Persist dulu, email best-effort** — pesan disimpan ke `contact_message` terlebih dahulu (sumber kebenaran); email notifikasi dikirim `fire-and-forget`, kegagalan SMTP hanya di-log dan **tidak** menggagalkan request.
- **Rate-limit in-memory per-IP** — maksimal **3 pesan/jam** → HTTP 429. Resets saat proses restart & tidak cluster-safe (`@nestjs/throttler` = upgrade path).
- Tujuan email: `CONTACT_DESTINATION_EMAIL` (env; default `tefa@smktelkom-mlg.sch.id`) — sinkron dengan nilai yang ditampilkan di UI (`dev-frontend-mexpo-new/src/features/public/contact/contact.data.ts`).
- Frontend: `submitContactAction` memanggil backend; jika tidak terjangkau (network error) ia **fallback ke `mailto:`** dengan pesan yang jujur (bukan sukses palsu).

---

## 4. Known Defects / Broken Rules

Status: `[FIXED]` = resolved in the Sprint 0/1 execution · `[OPEN]` = still latent.

| # | Issue | Where | Status |
|---|---|---|---|
| B1 | `QueryUserDto.is_active` decorated `@IsString()` **and** `@Type(() => Boolean)` | `users/dto/query-user.dto.ts` | `[FIXED]` (FIX-04) — now `@IsBoolean()`, `?is_active=false` works |
| B2 | `events.service.findAll` — `count()` doesn't filter `userEventRoles.status: APPROVED` but `findMany()` does | `events.service.ts` | `[FIXED]` (FIX-05) — both filters aligned |
| B3 | `PUT/DELETE /workshop-bookings/:id` — **no authorization check** in service | `workshop-bookings.service.ts` | `[FIXED]` (FIX-02) — SUPERADMIN / APPROVED OWNER/COMMITTEE / booking owner; `success` flag corrected |
| B3b | `GET /workshop-bookings/:workshop_id` returned bookings from **all** workshops (no `workshop_id` filter in count/findMany) | `workshop-bookings.service.ts` | `[FIXED]` (FIX-01) |
| B4 | `DELETE /event-users/:id` only checks OWNER (no SUPERADMIN path, unlike sibling endpoints) | `event-users.service.ts` | `[OPEN]` — not in Sprint 0/1; low priority |
| B5 | `PUT /tenants/verify/:id` REJECTED **deletes the tenant**; `PUT /tenants/verify/member/:id` REJECTED deletes the member row | `tenants.service.ts` | `[FIXED]` (FIX-03) — rejection now sets status; deletion requires explicit `DELETE` |
| B6 | `qr_codes` model exists but has **zero routes** | schema + `src/` | `[OPEN]` — decision: leave table for planned A4 (QR system); no routes added |
| B7 | JWT secret fallbacks differ (`'default_secret_key'` vs `'secret-word'`) and role is read from the token without DB re-check | `helper/jwt.strategy.ts`, `auth/auth.module.ts` | `[FIXED]` (FIX-08) — secret unified + **fail-fast** if `JWT_SECRET` unset. Role re-validation on each request remains an open decision |
| B8 | `.env` missing `MAIL_*` and `MINIO_*` variables | repo `.env` | `[PARTIAL]` (F9/FIX-10) — `.env.example` files created with all vars documented; operator must fill real values |
| B9 | e2e test expects `'Hello World!'` but app returns a different string | `test/app.e2e-spec.ts` | `[FIXED]` (FIX-12) — test aligned with actual response |
| B10 | Frontend `proxy.ts` imports a `"use server"` module inside the proxy; matcher vs check mismatch | `dev-frontend-mexpo-new/src/proxy.ts` | `[FIXED]` (FIX-07 + 2026-08) — reads `request.cookies`; **must live in `src/`** (Next 16 only scans the dir containing `app/`). A root-level `proxy.ts` is silently ignored → empty `middleware-manifest.json` + 221-byte stub `middleware.js`. Covers `/dashboard/:path*` + `/profile` |
| B11 | Frontend does not type-check (`npx tsc --noEmit` fails) | `dev-frontend-mexpo-new/src` | `[FIXED]` (FIX-06) — broken imports fixed; orphaned `Testimonial.tsx` removed |
| B12 | `toaster` only mounted in `AuthTemplate`; public/dashboard toasts dropped | frontend templates | `[FIXED]` (FIX-15) — global `<Toaster/>` in root layout; duplicate `AuthProvider` removed |
| B13 | Souvenir threshold hardcoded (`booth_visits >= 5`) | `souvenirs.service.ts` | `[FIXED]` (FIX-11) — configurable per-event `souvenir_rules.minVisitedBooth`, default 5 |
| B14 | `registration_start` / `registration_deadline` not enforced | events service + registrations | `[FIXED]` (FIX-14) — enforced in `event-users/visitor` and `public-api/registration` |
| B15 | `event-rundowns.findOne` scaffold stub unrouted; `event-sponsors` detail commented out | controllers | `[FIXED]` (FIX-17) — real `GET /event-rundowns/detail/:id` + `GET /event-sponsors/detail/:id` |
| B16 | Root layout imported dead `ThemeProvider`; dark-mode theme system never mounted | `src/app/layout.tsx`, `context/ThemeContext.tsx` | `[FIXED]` (FIX-18) — dead theme code removed |
| B17 | `font-outfit` referenced a never-loaded font; `--font-jakarta` mismatched `Plus Jakarta Sans` | `src/app/globals.css` | `[FIXED]` (FIX-19) — Outfit loaded; family name corrected |
| B18 | Contact form faked submission (empty `contact.service/action/schema`) | `src/features/public/contact` | `[FIXED]` (FIX-20) — server action validates + opens `mailto:` to the published contact email |
| B19 | Event detail pages cached with `force-cache` → stale after publish/delete | `public.service.ts`, `event.service.ts` | `[FIXED]` (FIX-21) — `META_ISR(60)` / `META_DYNAMIC` |
| B20 | Duplicate `cn()` implementations | `src/lib/utils.ts` + `src/shared/utils/cn.ts` | `[FIXED]` (FIX-22) — `src/lib/utils.ts` is now a re-export shim |
| B21 | Unused deps (`react-query`, `toaster`) + dead config (`site.config.ts`, `env.config.ts`) | frontend | `[FIXED]` (FIX-23) — removed; `exceljs` intentionally kept for A16 |
| B22 | `GET /tenant-transactions/:tenant_id?search=` crashed with `PrismaClientValidationError` (`payment_reference` is a `tickets` column, not on `tenant_transactions`) | `tenant-transactions.service.ts` | `[FIXED]` (2026-08) — search now uses `payment_method` OR product name |
| B23 | Attendance & workshop-booking reads returned **bcrypt password hashes** (`include: { user: true }` without `omit`) | `attendances.service.ts`, `workshop_bookings.service.ts` | `[FIXED]` (2026-08) — `user: { omit: { password: true } }` on every user include |
| B24 | Public registration (`POST /public-api/registration/:event_id`) **bypassed the quota** (only `event-users/visitor` enforced it) | `public-api.service.ts` | `[FIXED]` (2026-08) — counts APPROVED VISITOR roles and rejects once `events.quota` is reached |
| B25 | Souvenir rule `minVisitedBooth` was **always enforced** with an invisible default of 5 — owners could never opt out of the booth rule | `souvenirs/souvenir-rules.ts` | `[FIXED]` (2026-08) — booth rule only participates when explicitly configured; `checks.length === 0` → eligible |
| B26 | Registration answers were **write-only**: committee/owner had no endpoint to read a visitor's custom-form values | `event-users.service.ts` | `[FIXED]` (2026-08) — `GET /event-users/:event_id` now attaches `registrationAnswers[]` (with human labels resolved from `event_registration_fields`) per user |
| B27 | `Resend verification email` was a **fake frontend stub** (hardcoded `isEmailSent = true`, no backend call) | frontend `VerificationBox.tsx`, backend `users.*` | `[FIXED]` (2026-08) — new `POST /users/resend-verification` (Basic) + real frontend wiring with an email input |
| B28 | Frontend event form silently **dropped** `souvenir_rules` and `ticket_mode` (`buildEventFormData` never appended them) — the "Aturan Souvenir" UI had zero effect and PAID events were uncreatable from the UI | `dev-frontend/.../event.service.ts`, `EventForm.tsx` | `[FIXED]` (2026-08) — both fields now serialized; `ticket_mode` derived from the `paidTicket` feature toggle |
| B29 | `next start` failed with `Error: You cannot use different slug names for the same dynamic path ('slug' !== 'uuid')` — the apply pages lived under `dashboard/[uuid]/apply/*` while every other dashboard route used `[slug]` | `dev-frontend/.../dashboard/[uuid]/apply/*` | `[FIXED]` (2026-08) — moved to `[slug]/apply/*` and updated the `params` type; route table is now all-`[slug]`. The VisitorView links already pointed at `[slug]/apply/*` |

---

## 5. Edge Cases & Required Handling

| Edge case | Current behavior | Should be (per docx or hygiene) |
|---|---|---|
| Visitor registers to full event | Rejected by quota check (`event-users/visitor`) | Provide clear "quota full" UX; docx: quota is config-driven per event |
| Visitor re-registers to same event | Public-api upserts role to APPROVED (idempotent-ish) | Confirmed desired? `[NEEDS CLARIFICATION]` |
| Duplicate souvenir claim | Service prevents 2nd row (implicit 400/conflict) | Return explicit "already claimed" message (docx requires) |
| Souvenir eligibility not met | `ForbiddenException("Sorry, you still visit N booth")` — leaks the count to the caller | Decide if count exposure is acceptable |
| Workshop full | Booking rejected when `quota > 0` and count ≥ quota | Race conditions possible (count-then-insert, no DB constraint) — consider transactional/unique guard |
| Same-day double event check-in | Returns existing row + today's booth-visit count (idempotent) | Keep; document as "once per day" |
| Check-in target is COMMITTEE/OWNER/TENANT | Rejected for event check-in | Matches docx (visitor-only attendance) |
| Tenant rejected | Sets `status = REJECTED` (FIX-03 — no longer deletes the row) | Preserved record keeps audit trail; deletion is explicit via `DELETE` |
| Email send fails | Fire-and-forget with `.catch` logging (swallowed) | Consider retry/queue — docx "Email Notification System" `[PLANNED]` |
| Event dates without registration window | `registration_start` nullable; **enforced** since FIX-14 (reject outside window) | Docx flow says registration opens at publish — reconcile |
| Super admin approves/rejects publish | No such flow | See PRD §4.1 contradiction |

---

## 6. Cross-Cutting Rule Gaps (docx → code mapping)

| docx requirement | Code reality | Suggested action |
|---|---|---|
| Feature-config per event | None | Add config table/JSON column + DTO; gate endpoints on it |
| Lifecycle w/ approval | Flat status enum | Add `PENDING/REJECTED` + publish-request endpoint + approval action |
| Ticket free/paid | None | New `tickets`/`ticket_types` domain |
| QR universal | Dead table | Build QR service (generate → S3/URL → scan resolver) |
| Souvenir rules | Hardcoded | Add `souvenir_rules` table or JSON config on event |
| Tenant roles | None | Add `role` column to `tenant_members` |
| Excel export | Unused dep | Wire `exceljs` into `reports` |
| Centralized attendance types | 3 tables | Add type enum + unified log (or a view) |
