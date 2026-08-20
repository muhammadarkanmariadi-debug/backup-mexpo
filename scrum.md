# Mexpo — Scrum Backlog

> **Purpose:** executable product backlog for the Mexpo platform. Every item is **source-verified** against the product spec (`Mexpo — Product & Flow Revision Documentation.docx`) and the actual code in `dev-backend-mexpo-new` (NestJS) + `dev-frontend-mexpo-new` (Next.js).
>
> **Tags used:**
> - `[BOTH]` — feature missing on **both** frontend & backend (schema + API + UI needed)
> - `[BE-ONLY→FE]` — backend API exists, **frontend missing** (dead links / no UI)
> - `[PARTIAL]` — exists but broken, unreachable, or incomplete
>
> **Cross-reference docs:** `docs/PRD.md` (feature status + gaps) · `dev-backend-mexpo-new/docs/RULES.md` (business rules & validation) · `dev-backend-mexpo-new/docs/SCHEMA.md` (data model) · `docs/ARCHITECTURE.md` (endpoints & auth) · `dev-frontend-mexpo-new/docs/DESIGN.md` (UI guidelines) · `dev-backend-mexpo-new/docs/api-handbook.md` (API design, for frontend devs) · `AGENT.md` (project context + known blockers).

---

## How to Read This File

- Items are user stories (`As a <role>, I want <capability> so that <value>.`) with priority, effort, dependencies, sides, and acceptance criteria.
- **Priority:** `P0` = blocker/unblocks everything · `P1` = core product · `P2` = growth/premium.
- **Effort:** `S` ≈ 1–3 days · `M` ≈ 1 week · `L` ≈ 2+ weeks.
- **Depends on** lists items (by ID) that must ship first.
- **Status:** `[ ]` Backlog → `[~]` In Progress → `[x]` Done (fill as work proceeds).

---

## Sprint Plan (proposed execution order)

| Sprint | Theme | Items |
|---|---|---|
| **Sprint 0** | Foundations (env & setup) | F9 (F1–F8 folded into Sprint 1) |
| **Sprint 1** | Implemented but Needs Fix (bug-fix sprint) | FIX-01…FIX-23 (below) |
| **Sprint 2** | Event Core | A2, A3, A7 |
| **Sprint 3** | Visitor Journey | A1, A8, B2 |
| **Sprint 4** | Attendance & QR | A4, B6 |
| **Sprint 5** | Tenant & POS | B4, A13, A14, B5 |
| **Sprint 6** | Souvenir & Engagement | A5, A6, A9, A10 |
| **Sprint 7** | Reporting & Monetization | A16, A17, A15, A11, A12, A19, A20 |
| **Sprint 8** | Frontend Consistency & Modularity Refactor | REF-01…REF-07 (below) |

> Ordering rationale: blockers first (Sprint 0), then fix bugs in already-implemented features (Sprint 1 — do this before building new features on top of broken foundations), then event core (config/lifecycle) because almost everything else depends on it; then visitor journey; then on-site tooling (QR/POS); monetization last.

---

## ✅ Sprint 0 & 1 — Execution Status

**Status: DONE (executed).** All of the following shipped. New migration: `20260808063221_add_souvenir_rules` (backend).

| ID | Result |
|---|---|
| F9 | `.env.example` created for backend + frontend; frontend `.gitignore` un-ignores `.env.example` |
| FIX-01 | Workshop-booking list now filters by `workshop_id` (count + findMany) |
| FIX-02 | `PUT/DELETE /workshop-bookings/:id` authorized (SUPERADMIN / APPROVED OWNER/COMMITTEE / booking owner); `success: true` on success |
| FIX-03 | Tenant/member rejection sets `REJECTED` status instead of deleting |
| FIX-04 | `GET /users?is_active=false` works (`@IsBoolean`) |
| FIX-05 | events pagination `count`/`findMany` filters aligned (`APPROVED`) |
| FIX-06 | Frontend `npx tsc --noEmit` passes (0 errors); orphaned `Testimonial.tsx` removed |
| FIX-07 | `proxy.ts` rewritten — reads `request.cookies`, protects `/dashboard/:path*` + `/organizer/:path*` |
| FIX-08 | JWT secret unified + fail-fast if unset (strategy + `JwtModule`) |
| FIX-09 | `quota: 0` treated as unlimited; register button visible where WorkshopTab renders |
| FIX-10 | `MAIL_*` / `MINIO_*` / `AWS_REGION` documented in backend `.env.example` (operator must fill values) |
| FIX-11 | `events.souvenir_rules` JSON column + DTO + service; `minVisitedBooth` configurable (default 5). `minTransaction`/`joinedSeminar` still deferred to A5 |
| FIX-12 | e2e root-endpoint test aligned with actual response |
| FIX-13 | `approved_by` set when event is published (not at create) |
| FIX-14 | Registration window enforced in `event-users/visitor` + `public-api/registration` |
| FIX-15 | Global `<Toaster/>` in root layout; duplicate `AuthProvider` removed |
| FIX-16 | Dashboard layout shell (header + logout), no longer reuses public template |
| FIX-17 | `GET /event-rundowns/detail/:id` + `GET /event-sponsors/detail/:id` routed; dead stub removed |
| FIX-18 | Dead dark-mode theme code removed (`ThemeContext`, `ThemeToggler`, layout import) |
| FIX-19 | Outfit font loaded; `--font-jakarta` → `Plus Jakarta Sans` |
| FIX-20 | Contact form now validates (zod) + **submits to real backend** `POST /contact` (persist + email); `mailto:` kept only as a fallback when the API is unreachable |
| FIX-21 | Event detail caching → `META_ISR(60)` (public) / `META_DYNAMIC` (dashboard) |
| FIX-22 | `src/lib/utils.ts` reduced to a re-export shim of `src/shared/utils/cn.ts` |
| FIX-23 | Removed unused `@tanstack/react-query`, `react-query-devtools`, `toaster`; deleted dead `site.config.ts`/`env.config.ts`; cleaned unused imports. `exceljs` kept for A16 |

**Verification:** backend `nest build` passes; touched backend files lint clean (eslint `--fix`); frontend `npx tsc --noEmit` = 0 errors; `prisma migrate dev` applied.

**Carry-over / still open:** B4 (`DELETE /event-users/:id` SUPERADMIN path), B6 (`qr_codes` — decision: leave for A4), role re-validation per JWT request (decision), operator must fill real `MAIL_*`/`MINIO_*` values.

---

## ✅ Sprint 2 — Event Core (A2, A3, A7) — Execution Status

**Status: DONE (executed).** New migration: `20260808065640_event_config_and_lifecycle`.

| ID | Result |
|---|---|
| A2 | `events` gained `visibility` (enum `PUBLIC/PRIVATE`), `features` (JSON `{tenant, seminar, souvenir, product, pos, paidTicket}`) + DTOs; feature-gating helper `src/events/event-features.ts` (`assertEventFeature`) blocks tenant/seminar/souvenir/product/pos endpoints when disabled; frontend create/edit form exposes visibility + feature toggles |
| A3 | `EventStatus` extended `PENDING`/`REJECTED`; `POST /events/:id/publish-request` (owner/committee → PENDING), `PUT /events/:id/approval` (SUPERADMIN → PUBLISHED/REJECTED + `rejection_reason`), `GET /events/approval-queue` (SUPERADMIN); direct `PUBLISHED` via `PUT /events/:id` blocked for non-superadmins; frontend: OwnerView shows 5-status badge + "Ajukan Publikasi" + rejection reason; super admin approval queue at `/dashboard/approvals` |
| A7 | `events.event_type` (enum: EXPO, CAREER_FAIR, SEMINAR, GRADUATION, EXHIBITION, MARKETPLACE, GOVERNMENT, CAMPUS_SCHOOL, OTHER); public-api list filters by `?event_type=` and hides `PRIVATE` events; frontend home page event-type filter row |

**Also shipped:** `/dashboard/create` + `/dashboard/[uuid]/edit` pages (event create/edit form with dates, quota, visibility, type, feature toggles) — replaces the dead `/events/committee/create` link; "Approvals" entry point on the dashboard home for super admins.

**Verification:** backend `nest build` passes; frontend `npx tsc --noEmit` = 0 errors; lint clean on touched files; migration applied (`prisma migrate status` up to date).

**Carry-over / still open:** A2 feature-gating covers **mutations**; read endpoints still return data for disabled features (e.g. public listing shows tenants even when `tenant` off) — full visibility gating is a follow-up. A3 rejection `[NEEDS CLARIFICATION]`: rejection reason is required (default "Not approved") — confirm product wants a mandatory reason. B1 (full event create/edit UI) done as part of A2; B10 (Manage hub) done in a follow-up.

### Sprint 2 follow-up (B10 Manage hub + UTF-8 fix)

- **B10 — Event detail management UI shipped:** `/dashboard/[uuid]/manage` with tabs **Rundown / Sponsors / Contacts / Speakers** (add/edit/delete + sponsor-logo & speaker-photo upload + attach speaker to rundown), backed by `event-content.service.ts`. "Kelola" link added on OwnerView/CommitteeView; the dead `/dashboard/[uuid]/rundown` link removed.
- **Malformed UTF-8 fix:** the request-side AES encrypt/decrypt round-trip was already removed (it corrupted non-ASCII/Indonesian characters); the response path in `http-client.ts` was hardened — reads the body as binary and decodes with a lenient `TextDecoder` (`fatal:false`) so invalid bytes become `U+FFFD` instead of throwing **"Malformed UTF-8 data"**, and non-JSON bodies (e.g. HTML error pages) return a clean error instead of crashing.
- **Restored A3 publish-request in OwnerView/CommitteeView** (direct `PUBLISHED` is backend-blocked for non-superadmins).

### Sprint 3 follow-up (finishing pass — superadmin users, back nav, team search)

- **Superadmin User Management shipped:** `/dashboard/users` (list, search, pagination, activate/deactivate, role badge) backed by `users.service.ts` (`getUsers`); guarded client-side by `role === "SUPERADMIN"` with a zero-state fallback. Entry links for **Approvals** and **User Management** added to the dashboard home hero for `SUPERADMIN` only (`Eventlist.tsx`).
- **Back navigation added on every remaining dashboard sub-page** via the shared `BackLink` component: souvenir, reports, check-in, badge, certificates, booth-check-in, manage, registration, tenant portal, profile, create & edit event — each routes back to `/dashboard` or `/dashboard/[uuid]` as appropriate.
- **TenantPortal `Tim` tab client-side search** (by member name/email) — the backend `getTenantMembers` list has no server filter, so the search is applied in-memory.

**Verification:** `npx tsc --noEmit` = 0 errors; eslint clean on all touched files.

### Follow-up (list UX & sorting pass — bugs, filters, search/pagination)

- **Create Event dead-link + gate fixed (`Eventlist.tsx`):** button pointed at the non-existent `/events/committee/create` (real route is `/dashboard/create`) and was hidden unless the user already had an OWNER/COMMITTEE event. Now links to `/dashboard/create` and shows for every authenticated user (backend `POST /events` requires only a JWT).
- **Role badges centralized + fixed:** new `src/shared/utils/role-badge.ts` (`ROLE_BADGE` map) + `src/shared/components/ui/RoleBadge.tsx`. The OWNER badge was `bg-white text-secondary` (white pill, invisible on the hero banner) in both `EventHero` and `DashboardCard`; now **OWNER = `bg-secondary text-white`**, COMMITTEE = blue, TENANT = teal, VISITOR = gray. Applied to `EventHero` (via OwnerView), `DashboardCard`, `TeamManager`, `UserManager`.
- **Manage hub (`/dashboard/[uuid]/manage`) — search + pagination on ALL 4 tabs** (Rundown, Sponsors, Contacts, Speakers): converted to `useList` + `SearchBar` + `DataPagination`. Backend `search/page/quantity` was already supported by the content endpoints.
- **Public Agenda tab pagination:** added `DataPagination` over the selected day's rows (search existed; paging didn't).
- **RegistrationManager search + pagination:** ticket types and registration fields now have client-side search + paging.
- **Eventlist filters + sort (client-side):** status pills (ALL/DRAFTED/PENDING/PUBLISHED/REJECTED/FINISHED), event-type filter, and sort (Terbaru / Nama A–Z / Z–A).
- **Server-side sorting (backend):** new `src/helper/sort.ts` (`buildOrderBy` whitelist helper) + `sort_by`/`sort_dir` (validated `asc|desc`) added to query DTOs & services for **events (`/events/me`), users, event-users, workshops, attendances (`/attendances/event`), tenant-transactions**. Frontend `useList` gained `sortBy/sortDir/applySort` and a shared `SortMenu` component; wired into UserManager, TeamManager, WorkshopsManager, Attendance, and tenant Transactions tab.
- **Bonus fix — tenant-transaction search was dead:** backend `findAllTenantTransactions` destructured only `page/quantity/start_date/end_date` (ignored the `search` DTO field). Search now filters by `payment_reference` or product name (nested detail).

**Skipped (data model doesn't support):** workshops status filter (no status column on `workshops`) and user-role filter in UserManager (`GET /users` returns only `USER` role by controller design).

**Verification:** frontend `npx tsc --noEmit` = 0 errors + eslint clean on 15 touched files; backend `nest build` passes + eslint clean on 13 touched files. No schema migration required.

---

---

# Sprint 0 — Foundations (blockers that block everything)

> ⚠️ **F1–F8 were folded into Sprint 1 (the bug-fix sprint)** as `FIX-02…FIX-15` — see the consolidation note in the Sprint 1 summary table. Only F9 remains here; treat the FIX items as the canonical versions of the old F1–F8.

### F9. Complete environment documentation
- **Sides:** `[PARTIAL]` BE + FE
- **Priority:** P2 · **Effort:** S
- **User story:** *As a developer, I want `.env.example` files and documented env vars so that local setup is reproducible.*
- **Acceptance criteria:**
  - [ ] Backend `.env.example` includes `MAIL_*`, `MINIO_*`, `AWS_REGION`, `PORT`, `SHADOW_DATABASE_URL` (see ARCHITECTURE.md §6)
  - [ ] Frontend `.env.example` includes `NEXT_PUBLIC_TOKEN_KEY`, `NEXT_PUBLIC_ENCRYPT_SECRET`
  - [ ] `.env.example` committed; real `.env` stays gitignored

---

# Sprint 1 — Implemented but Needs Fix (Bug-Fix Sprint)

> Every item below is a **feature that already exists in code but is broken, misbehaving, or incomplete**. All are source-verified (see `dev-backend-mexpo-new/docs/RULES.md` §4 known defects + this review). **Ordering:** P0 items first. **Sprint 0's original F1–F8 were folded into this sprint** — the FIX items below are their canonical replacements.
>
> **Sides:** `[PARTIAL]` = partially implemented / broken.

## 🔴 High priority (P0/P1)

### FIX-01. Workshop booking list must filter by workshop
- **Sides:** `[PARTIAL]` BE
- **Priority:** P0 · **Effort:** S
- **User story:** *As an owner, I want `GET /workshop-bookings/:workshop_id` to return bookings for that workshop only so that attendance lists are correct.*
- **Acceptance criteria:**
  - [ ] `findAll` adds `workshop_id` to the `where` of both `count` and `findMany` (`workshop_bookings.service.ts:128-155`)
  - [ ] Verified: two workshops under one event return separate booking lists
  - [ ] Regression spec added

### FIX-02. Workshop booking update/delete must be authorized
- **Sides:** `[PARTIAL]` BE
- **Priority:** P0 · **Effort:** S
- **User story:** *As an owner, I want only authorized users (OWNER/COMMITTEE or the booking's owner) to update or cancel bookings so that visitors can't tamper with others' bookings.*
- **Acceptance criteria:**
  - [ ] `PUT/DELETE /workshop-bookings/:id` enforce OWNER/COMMITTEE (or booking owner) — currently zero authz (`workshop_bookings.service.ts:220-285`)
  - [ ] Fix `success: false` → `success: true` on successful update/remove
  - [ ] Regression spec asserting unauthorized access is rejected
  - [ ] Supersedes `F4` (Sprint 0 — folded into this item)

### FIX-03. Rejection must not delete tenant/member rows
- **Sides:** `[PARTIAL]` BE
- **Priority:** P0 · **Effort:** S
- **User story:** *As a super admin, I want rejected tenants/members to remain in the system with `REJECTED` status so that no data is lost.*
- **Acceptance criteria:**
  - [ ] `verifyTenant`/`verifyMemberTenant` set status on REJECTED instead of `delete` (`tenants.service.ts:829-830, 866-867`)
  - [ ] Update `dev-backend-mexpo-new/docs/RULES.md` §4 (B5)
  - [ ] Supersedes `F5` (Sprint 0 — folded into this item)

### FIX-04. `is_active` query filter
- **Sides:** `[PARTIAL]` BE
- **Priority:** P1 · **Effort:** S
- **User story:** *As a super admin, I want `GET /users?is_active=false` to filter correctly so that I can list inactive accounts.*
- **Acceptance criteria:**
  - [ ] Remove `@IsString()` from `QueryUserDto.is_active`, keep boolean transform (`query-user.dto.ts:19-22`)
  - [ ] `?is_active=false` returns 200 with filtered results (dev-backend-mexpo-new/docs/RULES.md B1)
  - [ ] Supersedes `F6` (Sprint 0 — folded into this item)

### FIX-05. Events pagination consistency
- **Sides:** `[PARTIAL]` BE
- **Priority:** P1 · **Effort:** S
- **User story:** *As a user, I want pagination totals to match returned rows in "my events" so that lists aren't misleading.*
- **Acceptance criteria:**
  - [ ] Align `count` and `findMany` filters — both include `status: APPROVED` (`events.service.ts:110` vs `130-142`)
  - [ ] Supersedes `F7` (Sprint 0 — folded into this item)

### FIX-06. Frontend type-check / build
- **Sides:** `[PARTIAL]` FE
- **Priority:** P0 · **Effort:** S
- **User story:** *As a developer, I want `next build` to pass so that the app can be deployed.*
- **Acceptance criteria:**
  - [ ] `npx tsc --noEmit` returns 0 errors — fix `About/StatCard`, `About/Testimonial`, `chunkArray`
  - [ ] Remove or wire orphaned dead components (dev-frontend-mexpo-new/docs/DESIGN.md §6)
  - [ ] Supersedes `F1` (Sprint 0 — folded into this item)

### FIX-07. Route protection (`proxy.ts`)
- **Sides:** `[PARTIAL]` FE
- **Priority:** P0 · **Effort:** S
- **User story:** *As a user, I want dashboard routes protected so that unauthenticated visitors are redirected to `/auth`.*
- **Acceptance criteria:**
  - [ ] Rewrite `proxy.ts` using `request.cookies` (not `getCookies()` / `next/headers`); read `node_modules/next/dist/docs/` for this Next.js build
  - [ ] Matcher **and** body both cover `/dashboard/:path*`
  - [ ] Supersedes `F2` (Sprint 0 — folded into this item)

### FIX-08. JWT secret & role validation
- **Sides:** `[PARTIAL]` BE
- **Priority:** P0 · **Effort:** S
- **User story:** *As a platform owner, I want a single JWT secret and current-role validation so that tokens can't be forged and revoked users lose access.*
- **Acceptance criteria:**
  - [ ] Unify `default_secret_key` (strategy) and `secret-word` (JwtModule); fail fast if `JWT_SECRET` unset
  - [ ] Decision: re-validate user existence/role from DB on each request (dev-backend-mexpo-new/docs/RULES.md B7)
  - [ ] Supersedes `F8` (Sprint 0 — folded into this item)

### FIX-09. Workshop register button + quota=0 handling
- **Sides:** `[PARTIAL]` FE
- **Priority:** P1 · **Effort:** S
- **User story:** *As a visitor, I want to register for workshops with unlimited quota and from the event page so that booking is actually possible.*
- **Acceptance criteria:**
  - [ ] `isFull` treats `quota: 0` as unlimited, not full (`WorkshopCard.tsx:35`)
  - [ ] Register button visible where `WorkshopTab` renders — remove `!validatePath` gating (`WorkshopCard.tsx:45, 139`)
  - [ ] Unblocks B3

### FIX-10. Mail / S3 environment
- **Sides:** `[PARTIAL]` BE + FE
- **Priority:** P1 · **Effort:** S
- **User story:** *As a developer, I want mail and file uploads to work in a local checkout so that I can test end-to-end.*
- **Acceptance criteria:**
  - [ ] Add `MAIL_*`, `MINIO_*`, `AWS_REGION` to backend `.env` / `.env.example` (see F9)
  - [ ] Smoke test: nodemailer transport + S3/MinIO upload succeed

## 🟠 Medium priority

### FIX-11. Souvenir rule configurability
- **Sides:** `[PARTIAL]` BE
- **Priority:** P1 · **Effort:** M
- **User story:** *As an owner, I want the souvenir eligibility rule configurable per event instead of hardcoded so that events can differ.*
- **Acceptance criteria:**
  - [ ] Move `booth_visits >= 5` out of `souvenirs.service.ts:24` into event config (schema + DTO); keep default 5 for backward compatibility
  - [ ] Update `dev-backend-mexpo-new/docs/RULES.md` §1.2 + PRD §4.7 R2
  - [ ] Note: this is the docx-vs-code contradiction — aligns with A5

### FIX-12. Root endpoint vs e2e test
- **Sides:** `[PARTIAL]` BE
- **Priority:** P2 · **Effort:** S
- **User story:** *As a developer, I want `npm run test:e2e` to pass so that CI is green.*
- **Acceptance criteria:**
  - [ ] Align `app.service.getHello()` with `test/app.e2e-spec.ts` (or update the test)

### FIX-13. `approved_by` semantics
- **Sides:** `[PARTIAL]` BE
- **Priority:** P1 · **Effort:** S
- **User story:** *As a super admin, I want `approved_by` to reflect who approved the publish so that audit trails are correct.*
- **Acceptance criteria:**
  - [ ] Set `approved_by` at publish/approval, not at create (`events.service.ts:73`); interim: leave unset until A3 ships

### FIX-14. Registration window enforcement
- **Sides:** `[PARTIAL]` BE
- **Priority:** P1 · **Effort:** M
- **User story:** *As an owner, I want registrations blocked outside `registration_start`/`registration_deadline` so that the timeline is enforced.*
- **Acceptance criteria:**
  - [ ] `event-users/visitor` and `public-api/registration` check the window; clear error when closed

### FIX-15. Toasts app-wide
- **Sides:** `[PARTIAL]` FE
- **Priority:** P1 · **Effort:** S
- **User story:** *As a user, I want toast feedback on every page so that actions don't silently fail.*
- **Acceptance criteria:**
  - [ ] Mount `<Toaster/>` once in root layout; remove from `AuthTemplate`
  - [ ] Supersedes `F3` (Sprint 0 — folded into this item)

### FIX-16. Dashboard layout + double `AuthProvider`
- **Sides:** `[PARTIAL]` FE
- **Priority:** P1 · **Effort:** M
- **User story:** *As a user, I want a proper dashboard shell so that the dashboard doesn't look like the public site.*
- **Acceptance criteria:**
  - [ ] `(dashboard)/layout.tsx` renders a dashboard layout (sidebar/nav), not `PublicTemplate`
  - [ ] Remove duplicate `<AuthProvider>` (root layout + `PublicTemplate`) (dev-frontend-mexpo-new/docs/DESIGN.md §6)

## 🟡 Low priority

### FIX-17. Dead / unrouted endpoints
- **Sides:** `[PARTIAL]` BE
- **Priority:** P2 · **Effort:** S
- **User story:** *As a maintainer, I want documented endpoints actually routed so that no stub silently 404s.*
- **Acceptance criteria:**
  - [ ] Route `event-rundowns.findOne` (stub, currently unrouted)
  - [ ] Un-comment or remove `event-sponsors` detail endpoint
  - [ ] Decide: wire `qr_codes` table or remove it (see A4)

### FIX-18. Dark mode
- **Sides:** `[PARTIAL]` FE
- **Priority:** P2 · **Effort:** S
- **User story:** *As a user, I want dark mode to work or be cleanly removed so that the UI is consistent.*
- **Acceptance criteria:**
  - [ ] Mount `ThemeProvider` + enable toggle, or remove the dead theme code (dev-frontend-mexpo-new/docs/DESIGN.md §2.6)

### FIX-19. Fonts
- **Sides:** `[PARTIAL]` FE
- **Priority:** P2 · **Effort:** S
- **User story:** *As a designer, I want the intended fonts actually loaded so that the UI matches the design.*
- **Acceptance criteria:**
  - [ ] Load Outfit (or remove `font-outfit`); fix `--font-jakarta` to match `Plus Jakarta Sans` (dev-frontend-mexpo-new/docs/DESIGN.md §2.2)

### FIX-20. Contact form
- **Sides:** `[PARTIAL]` FE
- **Priority:** P2 · **Effort:** S
- **User story:** *As a visitor, I want the contact form to submit somewhere real so that messages aren't lost.*
- **Acceptance criteria:**
  - [ ] Wire `contact.service/action/schema` to a backend endpoint, or remove the form

### FIX-21. Stale fetch cache
- **Sides:** `[PARTIAL]` FE
- **Priority:** P2 · **Effort:** S
- **User story:** *As an owner, I want event status/counts to refresh after publish/delete so that I don't see stale data.*
- **Acceptance criteria:**
  - [ ] Replace `force-cache` with `META_DYNAMIC`/revalidation on event detail pages (dev-frontend-mexpo-new/docs/DESIGN.md §6)

### FIX-22. Duplicate `cn()` util
- **Sides:** `[PARTIAL]` FE
- **Priority:** P2 · **Effort:** S
- **User story:** *As a developer, I want one `cn()` helper so that there's no drift between duplicates.*
- **Acceptance criteria:**
  - [ ] Keep `src/shared/utils/cn.ts`; remove or re-export `src/lib/utils.ts`

### FIX-23. Unused deps / dead code
- **Sides:** `[PARTIAL]` BE + FE
- **Priority:** P2 · **Effort:** S
- **User story:** *As a maintainer, I want unused dependencies and dead code removed so that the build is clean.*
- **Acceptance criteria:**
  - [ ] Remove or use: `exceljs` (BE — unless A16 ships), `react-query`, `toaster` (FE), dead `site.config.ts` navs, `env.config.ts`

---

# Sprint 2 — Event Core

### A2. Per-event feature-config system
- **Sides:** `[BOTH]`
- **Priority:** P0 · **Effort:** L
- **Depends on:** FIX-04 (DTO validation fix), dev-backend-mexpo-new/docs/SCHEMA.md §2.4
- **User story:** *As an owner, I want to enable/disable features per event (`tenant`, `seminar`, `souvenir`, `product`, `pos`, `paidTicket`) and set visibility (`public`/`private`) so that each event behaves differently without new code.*
- **Acceptance criteria:**
  - [ ] `events` gains a feature-config (columns or JSON column) + `visibility` field; migration added
  - [ ] `Create/UpdateEventDto` accept the config; validated via class-validator
  - [ ] Backend endpoints gate behavior on enabled features (e.g. no POS routes when `pos` off)
  - [ ] Frontend event create/edit form exposes feature toggles; dashboard shows only enabled features
  - [ ] Update PRD.md E4/E7 tag → `[DONE]`; update dev-backend-mexpo-new/docs/SCHEMA.md

### A3. Publish-request → super-admin approval lifecycle
- **Sides:** `[BOTH]`
- **Priority:** P0 · **Effort:** M
- **Depends on:** A2
- **User story:** *As an owner, I want to submit an event for publication and wait for super-admin approval so that only approved events go live.*
- **Acceptance criteria:**
  - [ ] `EventStatus` extended with `PENDING`/`REJECTED` (or equivalent) + migration
  - [ ] New endpoint: owner submits publish request; super admin approves/rejects
  - [ ] `approved_by` set at approval time, not at create (fix PRD.md §4.1 E3 contradiction)
  - [ ] Frontend: owner sees approval status (`draft/pending/published/rejected`); super admin gets an approval queue screen
  - [ ] Rejected events return to draft with a reason field `[NEEDS CLARIFICATION]` — confirm whether rejection message is needed

### A7. Multi-event-type support
- **Sides:** `[BOTH]`
- **Priority:** P1 · **Effort:** M
- **Depends on:** A2
- **User story:** *As an owner, I want to choose an event type (Expo, Career Fair, Seminar, Graduation, Exhibition, Marketplace, Government, Campus/School) so that Mexpo serves all event categories.*
- **Acceptance criteria:**
  - [ ] `events.event_type` field (enum or string) + migration
  - [ ] Public site can filter by event type; home page carousels use it
  - [ ] No hardcoded single-event-type behavior remains (see A8 & dev-backend-mexpo-new/docs/RULES.md §3.6)

---

# Sprint 3 — Visitor Journey

### A1. Ticket & paid-ticketing system
- **Sides:** `[BOTH]` ✅ done (Sprint 3) + A1b payment gateway (follow-up)
- **Priority:** P0 · **Effort:** L
- **Depends on:** A2, A3
- **User story:** *As a visitor, I want to register and buy a ticket (free or paid) for an event so that I can attend.*
- **Acceptance criteria:**
  - [x] `TicketMode` (`free|paid`) per event; `ticket_types`/`tickets` models + migration `20260808083739`
  - [x] Visitor registration issues a ticket; paid events capture payment reference (manual/POS/CASH/QRIS/TRANSFER — no gateway yet, `[NEEDS CLARIFICATION]` payment handling)
  - [x] **A1b — Midtrans Snap gateway:** `transactions` + `event_settlements` + `events.payout_*`; `POST /events/:id/checkout` returns Snap token; `POST /payment/notification` webhook (SHA512 + idempotent); settlement summary/payout/settle (SUPERADMIN) endpoints; public registration returns payment intent. Manual CASH/QRIS/TRANSFER kept as fallback. See `dev-backend-mexpo-new/docs/PAYMENT.md`
  - [ ] Ticket emails sent (depends on A11 — deferred)
  - [x] Frontend: public registration page `/event/[uuid]/register` (ticket select + Snap popup + success screen) replaces dead links

### A8. Dynamic registration form
- **Sides:** `[BOTH]` ✅ done (Sprint 3 — conditional fields deferred)
- **Priority:** P1 · **Effort:** M
- **Depends on:** A2
- **User story:** *As an owner, I want to define custom registration fields per event (including required/conditional fields) so that I collect the right data for each event.*
- **Acceptance criteria:**
  - [x] `event_registration_fields` model + CRUD endpoints + public schema endpoint; 7 field types (TEXT/TEXTAREA/NUMBER/EMAIL/SELECT/DATE/BOOLEAN)
  - [x] Registration renders the schema dynamically; validation uses the schema (required + answers stored in `registration_answers`)
  - [ ] Replace hardcoded `users_bio` requirement (dev-backend-mexpo-new/docs/RULES.md §3.6) — kept as legacy; `[NEEDS CLARIFICATION]` keep columns or migrate to dynamic answers
  - [ ] Conditional-field support — deferred follow-up

### B2. Registration UI (replace dead links)
- **Sides:** `[BE-ONLY→FE]` ✅ done (Sprint 3)
- **Priority:** P0 · **Effort:** M
- **Depends on:** A1 or A8 (whichever ships first)
- **User story:** *As a visitor, I want to register for an event from the public page so that I can join.*
- **Acceptance criteria:**
  - [x] Real route `/event/[uuid]/register` replaces `/onsite-register/[uuid]` (Hero CTA fixed); `/dashboard/[uuid]/register` replaced by `/dashboard/[uuid]/registration` (owner config)
  - [x] Registration calls `POST /public-api/registration/:event_id` with dynamic answers + ticket info
  - [x] Success screen confirms registration + next steps

---

# Sprint 4 — Attendance & QR

### A4. QR code system (generate + scan)
- **Sides:** `[BOTH]` ✅ done (Sprint 4)
- **Priority:** P0 · **Effort:** L
- **Depends on:** A1 (ticket/QR per attendee), FIX-06
- **User story:** *As a participant, I want a unique QR code for check-in, booth visits, POS, and souvenir validation so that all on-site flows are scan-based.*
- **Acceptance criteria:**
  - [x] `qr_codes` table wired — `src/qr-codes/` module: `GET /qr-codes/my/:event_id` (lazily creates the row, unique `code_data = mexo:event:user`), `POST /qr-codes/resolve` (identity resolution; also parses the format if no row exists)
  - [x] QR served as a **PNG data URL** (`qrcode` lib) and scannable by camera (html5-qrcode on FE)
  - [x] Visitor QR is universal — same code resolves identity for venue/workshop/booth check-in (and future POS/souvenir)
  - [x] dev-backend-mexpo-new/docs/RULES.md §1.3 updated `[BLOCKED] → [DONE]`

### B6. Check-in UI (venue / booth / workshop)
- **Sides:** `[BE-ONLY→FE]` ✅ done (Sprint 4)
- **Priority:** P0 · **Effort:** M
- **Depends on:** A4 (scan input)
- **User story:** *As a committee member, I want to scan a visitor's QR to check them in at the venue, a booth, or a workshop so that attendance is recorded instantly.*
- **Acceptance criteria:**
  - [x] `/dashboard/[uuid]/check-in` — committee check-in with mode tabs (Venue / Workshop); scan (camera via html5-qrcode) or paste QR → resolve → confirm → calls `/attendances/event|workshop/:id` with the scanned `user_id`
  - [x] **Booth check-in is separate** — tenant-facing page `/dashboard/[uuid]/booth-checkin` ("Scan Booth") linked from `TenantView`; scans visitor QR → `POST /attendances/tenant/:id` (backend requires APPROVED tenant member). Not on the committee page.
  - [x] Visual success/failure feedback (green/red result panel; backend messages for double-scan/day-limit from dev-backend-mexpo-new/docs/RULES.md §3.4)
  - [x] VisitorView shows the visitor's **My QR**; Owner/Committee views link to the check-in page

---

# Sprint 5 — Tenant & POS

### B4. Tenant portal UI
- **Sides:** `[BE-ONLY→FE]` ✅ done (Sprint 5)
- **Priority:** P0 · **Effort:** L
- **Depends on:** FIX-06, FIX-07
- **User story:** *As a tenant, I want a portal to manage my profile, products, POS transactions, team, and reports so that I can run my booth.*
- **Acceptance criteria:**
  - [x] Real route `/dashboard/[uuid]/tenant` (replaces the dead `/tenant-list` link; linked from TenantView "Portal")
  - [x] Screens: company profile (edit + logo), product CRUD (multipart photo), POS transaction entry (line items) + history + receipt print, booth-visit stats (via reports — minimal)
  - [x] All mutations use existing endpoints (`/tenants`, `/tenant-products`, `/tenant-transactions`)

### A13. Tenant team roles (owner / staff)
- **Sides:** `[BOTH]` ✅ done (Sprint 5)
- **Priority:** P1 · **Effort:** M
- **Depends on:** B4
- **User story:** *As a tenant owner, I want to invite staff with limited permissions so that my team can help without full control.*
- **Acceptance criteria:**
  - [x] `tenant_members.role` (`OWNER|STAFF`) + migration `20260808091933`; creator becomes OWNER, invited members STAFF
  - [x] Staff restrictions: delete product / delete transaction / manage members require OWNER member (or event manager/SUPERADMIN); new `PUT /tenants/member/:id` (change role)
  - [x] Team management UI (invite, list, change role, remove) in the portal "Tim" tab

### A14. Payment methods, `paid` flag & receipt
- **Sides:** `[BOTH]` ✅ done (Sprint 5)
- **Priority:** P1 · **Effort:** M
- **Depends on:** B4
- **User story:** *As a tenant, I want to record payments (cash/QRIS/transfer) and print a receipt so that POS transactions are complete.*
- **Acceptance criteria:**
  - [x] `tenant_transactions.payment_method` + `paid` flag + migration `20260808091933`; DTOs + create/update persist them
  - [x] Amount math stays server-side (Σ qty × price); paid flag set on payment
  - [x] Receipt/nota modal (printable via `window.print`) per transaction in the portal; payment methods free-form CASH/QRIS/TRANSFER `[NEEDS CLARIFICATION]` — per event or global?

### B5. Tenant & committee verification UI
- **Sides:** `[BE-ONLY→FE]` ✅ done (Sprint 5)
- **Priority:** P1 · **Effort:** S
- **Depends on:** B4
- **User story:** *As an owner/super admin, I want to approve or reject tenant and committee requests from the UI so that I don't need API calls.*
- **Acceptance criteria:**
  - [x] `/dashboard/[uuid]/verification` calls `PUT /tenants/verify/:id`, `PUT /event-users/:id` (committee/tenant requests)
  - [x] Rejection keeps records (FIX-03 already shipped)

---

# Sprint 6 — Souvenir & Engagement

### A5. Configurable souvenir rules engine
- **Sides:** `[BOTH]` ✅ done (Sprint 6)
- **Priority:** P1 · **Effort:** M
- **Depends on:** A2, A4
- **User story:** *As an owner, I want to configure souvenir eligibility rules (`minVisitedBooth`, `minTransaction`, `joinedSeminar`, combinations) so that rules differ per event.*
- **Acceptance criteria:**
  - [x] Centralized `evaluateSouvenirEligibility()` (`src/souvenirs/souvenir-rules.ts`) replaces the inline hardcoded check — supports `minVisitedBooth` (default 5), `joinedSeminar`, `requireAll` (AND/ANY combinations)
  - [x] `SouvenirRulesDto` extended; `minTransaction` accepted but **NOT evaluated** (`tenant_transactions` has no visitor link — follow-up)
  - [x] dev-backend-mexpo-new/docs/RULES.md & PRD.md §4.7 updated from `[BLOCKED]` → `[DONE]` (minTransaction caveat noted)

### A6. Visitor souvenir redemption
- **Sides:** `[BOTH]` ✅ done (Sprint 6)
- **Priority:** P1 · **Effort:** M
- **Depends on:** A4, A5
- **User story:** *As a visitor, I want to claim a souvenir by scanning my QR so that eligible visitors get one, and repeat claims are rejected.*
- **Acceptance criteria:**
  - [x] Scan → `POST /souvenirs/check/:event_id` (new eligibility endpoint) → validates rules + already-claimed → grant via existing `POST /souvenirs/:event_id` (server re-validates + one-per-event guard)
  - [x] Souvenir counter UI `/dashboard/[uuid]/souvenir` (scan/paste QR → check → grant) + visitor feedback; linked from Owner/Committee
  - [ ] `souvenir_claim` as a separate attendance row — `[NEEDS CLARIFICATION]`; the `souvenirs` table is the claim record today

### A9. Badge generator
- **Sides:** `[BOTH]` ✅ done (Sprint 6)
- **Priority:** P2 · **Effort:** M
- **Depends on:** A4
- **User story:** *As an organizer, I want to auto-generate badges (visitor/speaker/tenant) so that on-site identification is easy.*
- **Acceptance criteria:**
  - [x] `/dashboard/[uuid]/badge` — printable ID badge (event header, user photo/name/email/role, **QR from A4**)
  - [ ] Speaker/tenant badge variants — currently one generic badge (role label switches); per-role templates deferred

### A10. Certificate system
- **Sides:** `[BOTH]` ✅ done (Sprint 6)
- **Priority:** P2 · **Effort:** M
- **Depends on:** A1 (attendance proof), A9 (template engine)
- **User story:** *As a visitor, I want a certificate for workshops/seminars I completed so that I can use it as proof of participation.*
- **Acceptance criteria:**
  - [x] Backend `GET /workshop-bookings/certificates/my/:event_id` returns the caller's `CHECKED_IN` bookings; `/dashboard/[uuid]/certificates` lists them + printable certificate (event, workshop, name, date)
  - [x] **Template engine (follow-up):** OWNER/COMMITTEE design certificates with a Konva studio (`/dashboard/[uuid]` → Sertifikat tab) — layout, custom background (color/image upload), static default text + dynamic per-recipient fields (whitelisted: participant_name, event_name, workshop_title, date, organizer_name, certificate_number). Persisted in `certificate_templates`; the visitor page renders the active template and exports PDF/PNG via jsPDF; falls back to the legacy HTML block when no template exists.
  - [ ] Organizer revoke — deferred (not implemented)

---

# Sprint 7 — Reporting & Monetization

### A16. Excel export
- **Sides:** `[BOTH]` ✅ done (Sprint 7)
- **Priority:** P1 · **Effort:** S
- **Depends on:** B8
- **User story:** *As an owner/tenant, I want to export reports to Excel so that I can analyze data offline.*
- **Acceptance criteria:**
  - [x] `exceljs` (previously unused) wired into `GET /reports/export/:event_id` — xlsx workbook (Ringkasan + Visitor per Booth + Transaksi per Booth), Basic auth
  - [x] Export button on the reports screen downloads the file (client fetch + blob)

### B8. Reports / analytics UI
- **Sides:** `[BE-ONLY→FE]` ✅ done (Sprint 7)
- **Priority:** P1 · **Effort:** M
- **Depends on:** FIX-06
- **User story:** *As an owner, I want to see visitor traffic, attendance, and transaction analytics in the dashboard so that I can measure event success.*
- **Acceptance criteria:**
  - [x] `/dashboard/[uuid]/reports` calls `/reports/booth|amount/booth|visitor|amount/:event_id` (Basic) — summary cards + visitor-per-booth + transactions-per-booth tables
  - [x] Excel export button (A16); linked from Owner/Committee
  - [ ] Charts (A17); dead `/organizer/stats` refs were already removed from nav

### A17. Analytics dashboards (traffic) — ⏸️ DEFERRED
- **Priority:** P2 · **Effort:** M · **Depends on:** B8
- **Status:** deferred — no page-view/traffic data source exists; needs tracking infrastructure (`[NEEDS CLARIFICATION]` source of traffic data). B8 tables cover booth/visitor/amount.

### A15. Subscription / premium feature gating — ⏸️ DEFERRED
- **Priority:** P2 · **Effort:** L · **Depends on:** A2
- **Status:** deferred — `[NEEDS CLARIFICATION]` pricing/plans/billing provider not defined in docx; no plan model exists.

### A11. Full email notification system
- **Sides:** `[BOTH]` ⚠️ partial (Sprint 7)
- **Priority:** P1 · **Effort:** M
- **Depends on:** A3 (approval emails)
- **User story:** *As a participant, I want email notifications for invitation, approval, tickets, reminders, and attendance so that I stay informed.*
- **Acceptance criteria:**
  - [x] **Approval email** → event creator on approve/reject (with reason); **ticket confirmation email** → visitor on paid registration
  - [x] Reuses nodemailer (`src/mail`); fire-and-forget with logging
  - [ ] Reminder/attendance emails, queue/retry, opt-out — deferred (`[NEEDS CLARIFICATION]` consent)

### A12. Speaker-as-user portal — ⏸️ DEFERRED
- **Priority:** P2 · **Effort:** M · **Depends on:** A4
- **Status:** deferred — speakers are content rows, not users; full invite→account→bio→analytics portal is a larger feature.

### A19. Plugin integrations (payment gateway / WhatsApp) — ⏸️ DEFERRED
- **Priority:** P2 · **Effort:** L · **Depends on:** A15
- **Status:** deferred — `[NEEDS CLARIFICATION]` which gateway/provider.

### A20. Custom domain per event — ⏸️ DEFERRED
- **Priority:** P2 · **Effort:** M · **Depends on:** A2
- **Status:** deferred — needs infra (DNS/HTTPS) decision.

---

# Product Backlog (summary tables)

## 🔴 `[BOTH]` — Missing on both frontend & backend

| ID | Feature | Priority | Effort | Depends on | Sprint |
|---|---|---|---|---|---|
| A1 | Ticket & paid ticketing | P0 | L | A2, A3 | 3 ✅ done |
| A2 | Feature-config system + visibility | P0 | L | — | 2 ✅ done |
| A3 | Publish-request / approval lifecycle | P0 | M | A2 | 2 ✅ done |
| A4 | QR code system (generate + scan) | P0 | L | A1 | 4 ✅ done |
| A5 | Souvenir rules engine | P1 | M | A2, A4 | 6 ✅ done (minTransaction deferred) |
| A6 | Souvenir redemption (self-claim) | P1 | M | A4, A5 | 6 ✅ done |
| A7 | Multi-event-type support | P1 | M | A2 | 2 ✅ done |
| A8 | Dynamic registration form | P1 | M | A2 | 3 ✅ done (conditional fields deferred) |
| A9 | Badge generator | P2 | M | A4 | 6 ✅ done |
| A10 | Certificate system | P2 | M | A1, A9 | 6 ✅ done (revoke deferred) |
| A11 | Email notification system | P1 | M | A3 | 7 ⚠️ partial (approval + ticket emails) |
| A12 | Speaker-as-user portal | P2 | M | A4 | 7 ⏸️ deferred |
| A13 | Tenant team roles (owner/staff) | P1 | M | B4 | 5 ✅ done |
| A14 | Payment methods + paid flag + receipt | P1 | M | B4 | 5 ✅ done |
| A15 | Subscription / premium gating | P2 | L | A2 | 7 ⏸️ deferred |
| A16 | Excel export | P1 | S | B8 | 7 ✅ done |
| A17 | Analytics dashboards (traffic) | P2 | M | B8 | 7 ⏸️ deferred |
| A18 | Widget-driven public page | P1 | L | A2 | (refactor) |
| A19 | Plugin integrations | P2 | L | A15 | 7 ⏸️ deferred |
| A20 | Custom domain per event | P2 | M | A2 | 7 ⏸️ deferred |

> **A18 note:** docx mandates a widget/config-driven public page. It is a cross-cutting refactor rather than a sprint feature; schedule after A2 so public pages render from config.

## 🟠 `[BE-ONLY→FE]` — Backend exists, frontend missing

| ID | Feature | Priority | Effort | Depends on | Sprint |
|---|---|---|---|---|---|
| B2 | Registration UI (replace dead links) | P0 | M | A1/A8 | 3 ✅ done |
| B4 | Tenant portal UI | P0 | L | FIX-06, FIX-07 | 5 ✅ done |
| B5 | Tenant & committee verification UI | P1 | S | B4 | 5 ✅ done |
| B6 | Check-in UI (venue/booth/workshop) | P0 | M | A4 | 4 ✅ done |
| B8 | Reports / analytics UI | P1 | M | FIX-06 | 7 ✅ done |
| B1 | Event create/edit UI | P1 | M | FIX-06, A2 | 2 |
| B3 | Workshop booking UI (unblock register button) | P1 | S | — | 4 |
| B7 | Souvenir grant counter UI | P1 | S | A5 | 6 ✅ done |
| B9 | User profile page | P1 | S | — | 3 |
| B10 | Event detail mgmt UI (rundown/sponsor/contact/speaker) | P1 | M | B1 | 2 ✅ done (Manage hub `/dashboard/[uuid]/manage`) |
| B11 | Forgot/reset password UI | P1 | S | — | 3 |

## 🔴 `[FIX]` — Implemented but Needs Fix (Sprint 1 — bug-fix sprint) · ✅ executed

| ID | Feature | Priority | Effort | Sides | Status |
|---|---|---|---|---|---|
| FIX-01 | Workshop booking list filter by workshop | P0 | S | BE | ✅ Done |
| FIX-02 | Workshop booking update/delete authz | P0 | S | BE | ✅ Done |
| FIX-03 | Rejection must not delete tenant/member | P0 | S | BE | ✅ Done |
| FIX-04 | `is_active` query filter | P1 | S | BE | ✅ Done |
| FIX-05 | Events pagination consistency | P1 | S | BE | ✅ Done |
| FIX-06 | Frontend type-check / build | P0 | S | FE | ✅ Done |
| FIX-07 | Route protection (`proxy.ts`) | P0 | S | FE | ✅ Done |
| FIX-08 | JWT secret & role validation | P0 | S | BE | ✅ Done (role re-check = open decision) |
| FIX-09 | Workshop register button + quota=0 | P1 | S | FE | ✅ Done |
| FIX-10 | Mail / S3 environment | P1 | S | BE+FE | ✅ Done (docs only — operator fills real values) |
| FIX-11 | Souvenir rule configurability | P1 | M | BE | ✅ Done (minVisitedBooth only; rest → A5) |
| FIX-12 | Root endpoint vs e2e test | P2 | S | BE | ✅ Done |
| FIX-13 | `approved_by` semantics | P1 | S | BE | ✅ Done |
| FIX-14 | Registration window enforcement | P1 | M | BE | ✅ Done |
| FIX-15 | Toasts app-wide | P1 | S | FE | ✅ Done |
| FIX-16 | Dashboard layout + double `AuthProvider` | P1 | M | FE | ✅ Done |
| FIX-17 | Dead / unrouted endpoints | P2 | S | BE | ✅ Done (qr_codes decision: leave for A4) |
| FIX-18 | Dark mode | P2 | S | FE | ✅ Done (dead code removed) |
| FIX-19 | Fonts | P2 | S | FE | ✅ Done |
| FIX-20 | Contact form | P2 | S | FE | ✅ Done — now a real submit: backend `POST /contact` persists + emails, FE server action calls it, `mailto:` kept only as a fallback when the API is down |
| FIX-21 | Stale fetch cache | P2 | S | FE | ✅ Done |
| FIX-22 | Duplicate `cn()` util | P2 | S | FE | ✅ Done |
| FIX-23 | Unused deps / dead code | P2 | S | BE+FE | ✅ Done (exceljs kept for A16) |

> **Consolidation note:** Sprint 0's original `F1–F8` were folded into this sprint — FIX-02 ↔ F4, FIX-03 ↔ F5, FIX-04 ↔ F6, FIX-05 ↔ F7, FIX-06 ↔ F1, FIX-07 ↔ F2, FIX-08 ↔ F8, FIX-15 ↔ F3. **Treat each pair as ONE backlog item** — the FIX item is canonical; `F1–F8` are removed from Sprint 0 (only F9 remains there). See the **Sprint 0 & 1 Execution Status** section for what shipped.

## 🟡 `[PARTIAL]` — Broken / incomplete (includes Sprint 0 items)

| ID | Item | Note |
|---|---|---|
| F1–F8 | Sprint 0 foundations (moved) | Folded into Sprint 1 as FIX-02…FIX-15 — see consolidation note above |
| F9 | Env documentation (Sprint 0) | `.env.example` + documented vars — stays in Sprint 0 |
| C1 | Contact form (fake submit) | ✅ Resolved — form now submits to backend `POST /contact` (persists + emails); `mailto:` only a fallback (FIX-20 + 2026 contact follow-up) |
| P1 | WorkshopCard hides register button on `/event*` | Button unreachable where the tab renders — covered by **FIX-09** |
| P2 | Dark mode dead code | `ThemeProvider` never mounted; toggle commented (dev-frontend-mexpo-new/docs/DESIGN.md §2.6) — covered by **FIX-18** |
| P3 | Dashboard layout renders public template | No dashboard shell/sidebar (dev-frontend-mexpo-new/docs/DESIGN.md §6) — covered by **FIX-16** |
| P4 | Duplicate `<AuthProvider>` + `cn()` utils | Root layout + `PublicTemplate`; cleanup — covered by **FIX-16 / FIX-22** |
| P5 | Stale fetch cache | `force-cache` on event detail may not refresh after publish/delete — covered by **FIX-21** |

---

# Definition of Done (DoD)

A story is **Done** only when **all** of these hold:

### Backend
- [ ] DTO validation (class-validator) on every new/modified route — per-route `ValidationPipe`
- [ ] Service-level authorization (OWNER/COMMITTEE/TENANT/VISITOR/SUPERADMIN) enforced
- [ ] Schema change → Prisma migration committed (never hand-edited SQL); `dev-backend-mexpo-new/docs/SCHEMA.md` updated
- [ ] No hardcoded business rules (config-driven per dev-backend-mexpo-new/docs/RULES.md)
- [ ] `npm run lint` and `npm run build` pass in `dev-backend-mexpo-new`
- [ ] Email failures not silently swallowed (if emails involved)

### Frontend
- [ ] Real route exists — **no dead links** (all `href`s resolve)
- [ ] `npx tsc --noEmit` passes in `dev-frontend-mexpo-new`
- [ ] Uses design tokens + shared components (dev-frontend-mexpo-new/docs/DESIGN.md §7); no raw hex
- [ ] Toasts wired (global `<Toaster/>`); error fallbacks shown
- [ ] Auth state + proxy route protection respected

### Cross-cutting
- [ ] `docs/PRD.md` status tag updated (`[PLANNED]` → `[IN PROGRESS]` → `[DONE]`)
- [ ] `dev-backend-mexpo-new/docs/RULES.md` / `dev-backend-mexpo-new/docs/SCHEMA.md` / `docs/ARCHITECTURE.md` updated for any rule/schema/endpoint change
- [ ] No regression in existing `[DONE]` features (smoke test the 9 reachable routes)
- [ ] Commit per app repo, message style `type:summary` (see AGENT.md §5)

---

*Generated from the verified gap analysis (docx spec vs. actual FE/BE code). Provenance: docs/PRD.md §4–7, dev-backend-mexpo-new/docs/RULES.md §1–4, dev-backend-mexpo-new/docs/SCHEMA.md §2–3, docs/ARCHITECTURE.md §4–5, dev-frontend-mexpo-new/docs/DESIGN.md §4. Revisit whenever the docx or codebase changes.*

---

# 🏁 Project Wrap-Up — Full Execution Status (Sprints 0–7)

> Generated after executing all 8 sprints of the backlog. Legend: ✅ done · ⚠️ partial · ⏸️ deferred (needs a decision) · ⬜ not started.

## 1. What shipped (high level)

**Backend (NestJS + Prisma/MariaDB)**
- **Sprints 0–1 — Foundations & bug-fixes:** `.env.example` for both repos; 23 FIX items (workshop-booking authz + list filter, rejection-keeps-records, `is_active` filter, events pagination, JWT secret fail-fast, FE type-check, `proxy.ts`, global toasts, dashboard shell, configurable `minVisitedBooth`, `approved_by` on publish, registration-window enforcement, dark-mode/fonts/contact-form/`cn()`/dep cleanup). Migrations `add_souvenir_rules`, `make_approved_by_nullable`.
- **Sprint 2 — Event Core:** feature config (`visibility`, `features` JSON + endpoint gating), lifecycle (`PENDING/REJECTED` + publish-request/approval/queue), event types (`event_type` + public filter). Migration `event_config_and_lifecycle`.
- **Sprint 3 — Visitor Journey:** tickets (`ticket_mode`, `ticket_types`, `tickets`), dynamic registration form (`event_registration_fields` + `registration_answers`); registration issues tickets + validates/stores answers. Migration `visitor_journey_tickets_and_dynamic_form`.
- **Sprint 4 — Attendance & QR:** `qr-codes` module (`getMyQr` PNG + `resolve`), universal `mexpo:event:user` code, check-in UI (committee venue/workshop + tenant booth).
- **Sprint 5 — Tenant & POS:** tenant portal (profile/products/POS/team), `tenant_members.role` OWNER/STAFF + authz, `payment_method`/`paid`, verification UI. Migration `tenant_roles_and_payment`.
- **Sprint 6 — Souvenir & Engagement:** rules engine (`minVisitedBooth`, `joinedSeminar`, `requireAll`), eligibility-check endpoint, souvenir counter, ID badge, certificates.
- **Sprint 7 — Reporting & Monetization:** Excel export (`exceljs`), reports UI, approval + ticket emails.

**Frontend (Next.js 16 + Tailwind v4 + shadcn/radix)**
- Public site (home + event-type filter, event detail, about/contact/faq, **event registration** with dynamic form + tickets), auth (login/register/verify), and a full dashboard: my events, event detail, edit, content-manage hub, registration config, super-admin approvals, verification, check-in, booth scan, souvenir counter, ID badge, certificates, reports, tenant portal.

## 2. Backlog status (final)

| Group | Status |
|---|---|
| Sprint 0 foundations (F1–F9) | ✅ done (folded into FIX) |
| Sprint 1 fixes (FIX-01…FIX-23) | ✅ done |
| A1 Tickets · A2 Feature-config · A3 Approval lifecycle · A4 QR · A5 Souvenir rules · A6 Redemption · A7 Event types · A8 Dynamic form · A9 Badge · A10 Certificate · A13 Tenant roles · A14 Payment+receipt · A16 Excel export | ✅ done |
| A11 Email notifications | ⚠️ partial — approval + ticket emails shipped; reminders/attendance, queue/retry, opt-out pending |
| A12 Speaker portal · A15 Plans/gating · A17 Traffic analytics · A18 Widget-driven public page · A19 Plugins · A20 Custom domain | ⏸️ deferred — need product/infra decisions (see §3) |
| B1 Create/edit UI · B2 Registration UI · B3 Workshop booking · B4 Tenant portal · B5 Verification · B6 Check-in UI · B7 Souvenir counter · B8 Reports UI · B9 Profile page (API done; page still a dead link ⚠️) · B10 Manage hub · B11 Forgot-password (API done; `/forgot-passwords` dead link ⚠️) | ✅ done (with the two ⚠️ noted) |

## 3. Decisions needed to unblock deferred items

| Item | Question / blocker |
|---|---|
| **A12 Speaker portal** | Do speakers become real user accounts (invite → login → bio self-edit)? Currently they are content rows only. |
| **A15 Subscription gating** | What are the plans, pricing, and billing provider? (docx only lists *suggested* monetization.) |
| **A17 Traffic analytics** | What is the traffic data source? (No page-view tracking exists; needs analytics infrastructure or proxy from existing data.) |
| **A18 Widget-driven public page** | Confirm the widget/theme model for the public page refactor. |
| **A19 Plugins** | Which payment gateway / WhatsApp provider to integrate first? |
| **A20 Custom domain** | Who hosts/manages DNS + HTTPS for custom domains? |
| **A11 emails (rest)** | Consent/opt-out policy for reminder & attendance emails; need queue/retry? |
| **A3 rejection reason** | Should rejection *require* a reason (currently defaults to "Not approved")? |
| **A14 payment methods** | Payment methods per-event or global? (currently free-form CASH/QRIS/TRANSFER) |
| **A5 `minTransaction`** | Add `visitor_id` to `tenant_transactions` + wire POS QR scan to enable the rule? |
| **A8 `users_bio`** | Migrate the legacy hardcoded `users_bio` requirement into dynamic answers, or keep it? |
| **A6 `souvenir_claim`** | Track souvenir claims as a separate attendance event, or keep the `souvenirs` table as the record? |

## 4. Known open issues / technical debt (not sprint-blocking)

- Backend: `DELETE /event-users/:id` lacks a SUPERADMIN path (dev-backend-mexpo-new/docs/RULES.md B4); JWT role is trusted from token without per-request DB re-check; CI uses `prisma migrate dev` in production (prefer `migrate deploy`); emails are fire-and-forget.
- Frontend: `npx tsc --noEmit` is clean but `next build` should be verified on the server (SSR fetches may need the API reachable); `DashboardLogoutButton.tsx` is unreferenced; `/dashboard/[uuid]/register` + `/forgot-passwords` dead links remain.
- Attendance is still split across 3 tables (no unified type enum); POS/souvenir QR use not wired.

## 5. Recommended next steps

1. **Commit per repo** (backend + frontend separately, `type:summary` style) — everything is currently uncommitted.
2. **Deploy the pending migrations** in order (`...add_souvenir_rules` → `...visitor_journey...` → `...tenant_roles_and_payment`) via `prisma migrate deploy`.
3. **Fill real env values** (`JWT_SECRET`, `MAIL_*`, `MINIO_*`) — the backend now fails fast without `JWT_SECRET`.
4. **Decide on the deferred items in §3** — the smallest, highest-value ones are: `minTransaction` (add `visitor_id` to transactions + POS QR), B9/B11 profile & forgot-password UI, and the A8 `users_bio` migration.
5. Re-run the "before you code" checklist in `AGENT.md` and keep docs in sync as features evolve.

### Sprint 7 follow-up — Reports upgrade + management gaps

- **Reports page upgraded** (`/dashboard/[uuid]/reports`): `recharts` installed; **date-range filter (from–to)**; two sections — **Attendance** (total + bar by tenant + pie by category) and **Transaction** (total count + amount + bar by tenant + pie by category) + tables; Excel export honors the active range.
- **Backend:** `reports.service.ts` now supports **partial date ranges** (from-only / to-only) via `buildDateFilter` across all report methods + export.
- **Management gaps filled** (3 new pages, linked from Owner/Committee):
  - `/dashboard/[uuid]/workshops` — workshop CRUD + attach/detach speakers
  - `/dashboard/[uuid]/team` — committee/member list, add-by-email, approve/reject, change role, remove
  - `/dashboard/[uuid]/attendance` — check-in list with date range + name search

### Sprint 7 follow-up #2 — Profile, tenant reports, minTransaction, conditional fields

- **B9 Profile + B11 Forgot-password:** `/profile` (edit name/phone/organization + photo, proxy-protected), `/forgot-passwords` + `/forgot-passwords/reset-password` (uses existing `POST /users/reset-password` + `/verify`). No backend changes.
- **Tenant reports/export:** new **"Laporan"** tab in the tenant portal (my booth visitors / transactions / amount + recharts bar) + **tenant-scoped export** `GET /reports/export/:event_id/tenant/:tenant_id` (only that tenant's rows).
- **A5 `minTransaction`:** migration `add_transaction_visitor` (`tenant_transactions.visitor_id` FK); POS tab now has an **optional visitor QR scan**; `souvenir-rules.ts` evaluates `minTransaction` (sum of the visitor's transactions); **EventForm now exposes souvenir rules** (minVisitedBooth, minTransaction, joinedSeminar, requireAll).
- **A8 Conditional fields:** migration `add_registration_field_condition` (`event_registration_fields.condition` = `{field_key, value}` show-if); public registration renders/hides fields by condition and skips their required check when hidden; RegistrationManager has condition inputs.

---

# Sprint 8 — Frontend Consistency & Modularity Refactor (REF-01…REF-07)

> **Theme:** kill the AI-slop copy-paste in the role dashboard — one overview component, one action primitive, one segmented tab control, one client-list hook — then fill the remaining list UX gaps (search/sort/pagination) that `useList` already covers elsewhere.
>
> **Sides:** `[PARTIAL] FE` only. No backend schema/API changes (endpoints already accept `page/quantity/search`).

### REF-01 — Unified `EventOverview` across the 4 role views
- **Priority:** P1 · **Effort:** M · **Status:** ✅ done
- **User story:** *As a user, I want the event overview (stats, details, description) to look identical across Owner/Committee/Tenant/Visitor views so the dashboard feels like one product.*
- **Acceptance criteria:**
  - [x] `EventOverview` + `DescriptionCard` shared components created (`features/dashboard/shared/`); `EVENT_TYPE_LABELS` centralized there (was duplicated in OwnerView + CommitteeView)
  - [x] Owner/Committee use `<EventOverview showStats />`; Tenant/Visitor use `<EventOverview />`; the local `Row` helpers (TenantView, VisitorView) deleted
  - [x] `npx tsc --noEmit` = 0 errors; `npm run lint` = 0 errors

### REF-02 — Role badges, `ViewAction`, and token cleanup
- **Priority:** P1 · **Effort:** S · **Status:** ✅ done
- **User story:** *As a user, I want the action buttons (publish, finish, reopen, register, badge, certificates) and role pills to use one visual language in every role view.*
- **Acceptance criteria:**
  - [x] COMMITTEE role badge fixed from off-token `bg-blue-50` to `bg-brand-50 text-brand-700` (`src/shared/utils/role-badge.ts`)
  - [x] `ViewAction` gained a `warning` variant; Owner/Committee status actions + Visitor links migrated to `ViewAction` (replaces raw `<button>`/`<Link>`); Visitor links keep `href`
  - [x] Rejection banner (Owner/Committee) uses error tokens (`bg-error-50 border-error-200 text-error-700`)
  - [x] `DashboardTabs` off-token `hover:bg-blue-50` / `text-blue-100` → `hover:bg-brand-50` / `text-brand-100`

### REF-03 — Reusable `SegmentedTabs`
- **Priority:** P1 · **Effort:** S · **Status:** ✅ done (partial — see note)
- **User story:** *As a developer, I want one segmented-control primitive so mode/tab switchers look and behave identically.*
- **Acceptance criteria:**
  - [x] `SegmentedTabs` created (`src/shared/components/ui/SegmentedTabs.tsx`)
  - [x] Migrated: EventManager content tabs, RegistrationManager (Tiket / Form Pendaftaran), CheckInPage venue/workshop mode
  - [ ] **Not migrated (intentional):** VerificationPage/`verification/lists/*` status *pills* are filter chips (`rounded-full`), not segmented tabs — converting them would change their visual pattern; left as pills
  - [x] Dead `src/shared/components/ui/Tabs.tsx` deleted (zero importers, verified)

### REF-04 — Tenant portal dedup + orphaned-module removal
- **Priority:** P0 · **Effort:** S · **Status:** ✅ done
- **User story:** *As a developer, I want no dead 879-line duplicate and no 4× redundant tenant queries so the portal is easy to reason about.*
- **Acceptance criteria:**
  - [x] `getMyTenants` hoisted into `TenantView` (fetched once; tabs render from the shared `tenantId`) — previously each `TenantPortalWrapper` instance queried independently
  - [x] `TenantPortalWrapper` replaced by presentational `TenantTabContent` (no data fetching)
  - [x] Orphaned `src/features/dashboard/portal/TenantPortal.tsx` deleted (verified zero external importers; tenant UI served by `portal/tabs/*`)

### REF-05 — Reusable list primitives (`useClientList`, `EmptyState`, `SectionTitle`)
- **Priority:** P1 · **Effort:** M · **Status:** ✅ done
- **User story:** *As a developer, I want one client-side list hook + shared empty/section components so fetch-all lists don't each re-implement search/slice/paging.*
- **Acceptance criteria:**
  - [x] `useClientList` created (`features/dashboard/shared/useClientList.ts`) — search + optional sort + pagination, `useList`-like API (`search/applySearch/sortBy/sortDir/applySort/page/setPage/total/totalPages`)
  - [x] `EmptyState` (`icon/title/subtitle`) + `SectionTitle` (`title/action`) shared components created
  - [x] RegistrationManager `TicketTypesPanel` + `FieldsPanel` migrated to `useClientList` + `SectionTitle` + `EmptyState` (killed the duplicated `filter`/`slice` logic)

### REF-06 — Reports table sort/pagination + searchable check-in selects
- **Priority:** P2 · **Effort:** M · **Status:** ✅ done
- **User story:** *As an owner, I want the reports tenant table sortable/paginated and long check-in select lists searchable.*
- **Acceptance criteria:**
  - [x] ReportsPage Attendance "Tenant" table: client sort (name/visits via `SortMenu` + `useClientList`) + `DataPagination`; charts keep the full dataset
  - [x] `SearchableSelect` created (`src/shared/components/form/SearchableSelect.tsx`) — native combobox with inline search
  - [x] CheckInPage workshop selector + BoothCheckInPage tenant selector → `SearchableSelect`

### REF-07 — Public events paging param + bounded home loading
- **Priority:** P2 · **Effort:** S · **Status:** ✅ done
- **User story:** *As a visitor, I want the home page to load a bounded catalog and let me browse more.*
- **Acceptance criteria:**
  - [x] `getEvents` now sends `quantity`/`page`/`search`/`event_type` (was sending `limit`, which the public-api DTO ignores) and returns `meta.counts`
  - [x] Home page fetches `{ quantity: "24" }` instead of the entire catalog
  - [x] Events component reveals 12 at a time via "Muat Lebih Banyak" (resets on search/category/type change); carousels unchanged

**Verification:** `npx tsc --noEmit` = 0 errors · `npm run lint` = 0 errors after the full Sprint 8 pass.
**Deliberately out of scope (note):** VerificationPage status pills left as pill filters (see REF-03); the transaction table in ReportsPage left as-is (the tenant/attendance table was the target); public home stays a server-component fetch (no TanStack conversion for this SSR page).


