# Mexpo — Design System & UI Guidelines

> **Important framing:** the docx contains **no visual design specification** (no colors, no typography, no spacing, no component naming). Its design-related content is limited to *"Frontend Architecture Implications"* (modular, config-driven, widget-driven public page, dynamic permissions, plugin-ready). Therefore:
> - §1 records the docx's architectural UI requirements.
> - §2–§5 document the **actual** design system found in `dev-frontend-mexpo-new` (Tailwind v4 CSS tokens, fonts, components).
> - §6 flags inconsistencies between spec intent and implementation.

---

## 1. Design Intent (docx — "Frontend Architecture Implications")

| Requirement | Detail | Status in code |
|---|---|---|
| **Modular, feature-based architecture** | frontend split by feature | `[IN PROGRESS]` — `features/`, `widgets/`, `entities/`, `shared/` structure exists |
| **Config-driven flows** | all flows derive from event config | `[PLANNED]` — UI is static; no event-config consumption |
| **Widget-driven public page** | public page composed of widgets/sections | `[PLANNED]` — pages are hand-authored components |
| **Dynamic permission system** | UI changes by role, enabled features, subscription plan | `[IN PROGRESS]` — role dispatch exists; features/plan not reflected |
| **Plugin-ready** | payment gateway, whatsapp, custom integrations | `[PLANNED]` — none |

> ⚠️ **CONTRADICTION (widget-driven):** the docx mandates a widget/section-composed public page that can be reconfigured per event. The implemented public page is a fixed component tree (`Events.tsx` hero + carousels; `Event.tsx` tabbed detail) with no config registry or widget model. Any "public page refactor" is greenfield.

---

## 2. Actual Design Tokens (from `src/app/globals.css`)

Tailwind **v4 CSS-first** — there is **no `tailwind.config.ts`**. Tokens are CSS custom properties + `@theme` blocks.

### 2.1 Colors
| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#ffffff` | white background |
| `--color-secondary` / `--color-brand-500` | `#3c85f3` | **the brand blue** (primary CTA, nav accents) |
| `--color-brand-600` | `#3641f5` | deeper blue (hover/gradient) |
| `--gray-900` | `#101828` | darkest text |
| `--gray-dark` | `#1a2231` | footer/dark surface |
| `--gray-*` (25→950) | full scale | text, borders, surfaces |
| `--brand-*` (25→950) | full scale | brand tints |
| `--success` / `--error` / `--warning` / `--orange` / `--blue-light` | scales | status/feedback |
| `--teal-50/100/600/700` | scales | **tenant / booth identity accents** (deliberate, tokenized) |
| `--fuchsia-50/100/600/700` | scales | **souvenir / gift accents** (deliberate, tokenized) |
| shadcn vars | `--background/--foreground/--card/--primary/--secondary/--radius/--sidebar-*` | base tokens |

> Verified values: `--color-primary: #ffffff`, `--color-secondary: #3c85f3`, `--color-brand-500: #3c85f3`, `--color-brand-600: #3641f5`.

### 2.2 Typography
- **Outfit** (`--font-outfit`) is loaded via Google Fonts `@import` and applied to `<body>` (`@apply … font-outfit`) — it is the brand/body font. Outfit is **not** loaded via `next/font`, but the CSS @import makes it available.
- **Loaded via Google Fonts `@import`:** `Plus Jakarta Sans`, `Public Sans`, and `Outfit`.
- `--font-jakarta: "Plus Jakarta Sans"` — correctly named and matches the loaded family (used for secondary text, e.g. agenda subtitles).
- **Root layout** also loads `Geist` + `Geist_Mono` via `next/font` (CSS vars) — effectively unused for body text.
- Custom text scale in `@theme`: `--text-title-2xl: 72px` down to `--text-theme-xs: 12px` (template-derived names like `title-*`, `theme-*`).

### 2.3 Breakpoints (custom)
`2xsm: 375px`, `xsm: 425px`, plus Tailwind defaults, and `3xl: 2000px`.

### 2.4 Shape / Radius
shadcn `--radius` token present; `tw-animate-css` enables animation utilities; `@custom-variant dark (&:is(.dark *))`.

### 2.5 Shadows / Effects
`--shadow-theme-*` scale; custom `@utility` classes: `menu-item*`, `menu-dropdown-*`, `no-scrollbar`, `custom-scrollbar`.

### 2.6 Dark Mode
- `ThemeProvider` (`src/context/ThemeContext.tsx`) is **mounted in the root layout** and persists the choice to `localStorage`.
- **Opt-in, defaults to light** — the theme is never auto-selected from the OS, so existing light styling is unchanged until the user toggles.
- Toggle buttons live in the `Navbar` (desktop right-side cluster + mobile bar).
- The `.dark` token block and the pervasive `dark:*` utilities in `globals.css` are now reachable at runtime via the `.dark` class on `<html>` (`@custom-variant dark`).

### 2.7 Legacy CSS
`globals.css` (951 lines) also contains styling for **flatpickr, FullCalendar (.fc), Swiper, jVectorMap, ApexCharts** — none of which are dependencies. This is leftover TailAdmin-style template CSS; **do not assume those libraries are available**.

---

## 3. Component Library & Reusable UI Patterns

### 3.1 Primitives (`src/components/ui/`)
- `pagination.tsx` — self-contained shadcn-style pagination (no longer depends on `ui/button`).
- **Retired primitives:** `button.tsx` and `select.tsx` were removed — there is exactly **one button primitive** (`src/shared/components/button/Button`) and selects use native `<select>` (including the page-size picker inside `DataPagination`).

> ⚠️ No `components.json`, no shadcn CLI registry. Missing common shadcn primitives (Dialog, AlertDialog, Badge, Skeleton, Card, Input) are **not** present — the codebase uses its own shared components instead.

### 3.2 Shared components (`src/shared/components/`)
- `button/Button.tsx` — primary/secondary/ghost/outline/danger/success variants, sizes `xs`/`sm`/`md`; renders `<a>` when `href` given
- `ui/PageHeader` — standardized dashboard page header (title/subtitle/icon/action/align); replaces the hand-rolled `<h1>` blocks
- `ui/HeroBanner` — shared hero (image + centered overlay) used by `EventHero` and the dashboard `Eventlist`
- `qr/QrScanPanel` + `hooks/useQrScanner` + `lib/hooks/useResolveQr` — shared QR scan/search panel for check-in, booth, souvenir (and `resolveQr` via TanStack mutation)
- `data/chart-colors` — single chart palette source (`CHART_COLORS`, `CHART_PRIMARY`, `CHART_SUCCESS`) as CSS-var tokens
- `Input` (with password toggle + textarea), `Checkbox`, `SearchBar`, `Card`
- `ContentTitle1` / `ContentTitle2` — section headings
- `Tabs`, `LoadingSpinner`, `DashboardCard`
- `VerticalEventCard` / `HorizontalEventCard`, `SpeakerCard`, `SponsorCard`, `TenantCard`, `TenantProductCard`, `WorkshopCard`
- `DataPagination` — composes `Select` + `Pagination`
- `Gmaps` — leaflet map (only used on `/contact`; hardcoded SMK Telkom Malang coords)

### 3.3 Widgets / templates
- `Navbar` — floating pill nav, mobile drawer, user dropdown; `HIDDEN_ROUTES` list; logout
- `Footer` — brand-blue footer; hides itself on `/report`
- `PublicTemplate` (Navbar + main + Footer), `AuthTemplate` (back-home link + `MexpoCard` + `<Toaster richColors>`)

### 3.4 Recurring patterns (conventions to follow)
1. **Server components for data pages** — pages call service functions directly (e.g. `getEvents`, `getEventByUuid`) with fetch cache presets (`META_DYNAMIC/ISR/STATIC/TAGGED` in `http-meta.ts`).
2. **Client components for interaction** — `"use client"` + hooks; form validation via `react-hook-form` + zod resolver.
3. **Error fallback pattern** — `ErrorPage` component keyed on `status`/`code`.
4. **Toasts** via `sonner` — `<Toaster/>` is mounted **once in the root layout** (not per template); every flow may `toast.` freely.
5. **Icons** — lucide-react primarily; fontawesome only in Navbar/SearchBar/Hero.
6. **Animation** — `framer-motion` for hero/section reveals; `embla-carousel` for event carousels (autoplay via `useCarousel.ts`).

---

## 4. Page-Level Inventory (what exists vs dead links)

### Live & reachable
| Route | Design notes |
|---|---|
| `/` | Hero + category filter + Upcoming/OnGoing/Past carousels (`Events.tsx`) |
| `/event/[uuid]` | Hero + static "Registration Flow" + tabs: Info/Agenda/Speakers/Sponsors/Contact/Workshop/Tenant |
| `/about` | Marketing page |
| `/contact` | Static form (fake submit) + leaflet map |
| `/faq` | Accordion from `faq.data.ts` |
| `/auth` | Login/Register tabs, `MexpoCard` brand panel |
| `/verify-email` | Token auto-verify on mount |
| `/dashboard` | My Events list + server search/pagination + client status/type/sort |
| `/dashboard/[uuid]` | Role-dispatched view (Owner/Committee/Tenant/Visitor) — tab-driven (Overview, Kelola, Registrasi, Check-in, Souvenir, Tenant, Verifikasi, Tim, Attendance, Workshop, Laporan) — **Sertifikat tab** = Konva certificate design studio (OWNER/COMMITTEE) at `src/features/dashboard/certificate-designer/` |
| `/dashboard/[uuid]/badge` | Printable ID badge (QR) |
| `/dashboard/[uuid]/certificates` | My workshop certificates — rendered from the event Konva template when one is active (else legacy HTML) |
| `/dashboard/[uuid]/booth-checkin` | Tenant booth QR scan |
| `/dashboard/[uuid]/apply/speaker` , `/apply/tenant` | Speaker / tenant application forms |
| `/dashboard/create` | Create event form |
| `/dashboard/approvals` , `/dashboard/users` , `/dashboard/tenant-categories` | Super-admin pages |
| `/profile` | Profile edit (Navbar dropdown) |
| `/forgot-passwords` (+ `/reset-password`) | Password reset |
| `/privacy-policy` , `/terms` | Legal pages (public) |

### Dead links (referenced in code/UI, route does not exist — all 404)
`/onsite-register/[uuid]`, `/events/committee/create`, `/organizer/*`, `/dashboard/[uuid]/rundown`, `/dashboard/[uuid]/edit`, `/dashboard/[uuid]/tenant-list`, `/dashboard/qr-code`, `/report`.

> These are the UI affordances for the **unbuilt** flows (registration, tenant portal, check-in, QR, certificates). Do not add routes blindly — they imply backend features that are `[PLANNED]` (see PRD §7).

---

## 5. Icon / Asset Library

- `public/` ~180 assets: `logo/logo-m.svg`, `images/logo/*`, `images/brand/brand-01…15.svg`, `cards/*`, `carousel/*`, `user/user-01…37`, `error/*.svg`, `icons/qr-code.svg`, `shape/*` — generic admin-template asset dump; only a subset is actually used.
- `next.config.ts` remote image allowlist: `images.unsplash.com`, `s3.smktelkom-mlg.sch.id`, `img.youtube.com`, `i.ytimg.com`, `via.placeholder.com`.

---

## 6. Inconsistencies & Risks (`> ⚠️`)

> ✅ **RESOLVED (fonts):** Outfit is loaded via Google Fonts `@import` and applied on `<body>` (`font-outfit`); `--font-jakarta: "Plus Jakarta Sans"` matches the loaded family.

> ✅ **RESOLVED (dark mode):** `ThemeProvider` is mounted in the root layout (opt-in, light default) with Navbar toggles; the `.dark` tokens/utilities are live.

> ⚠️ **NOTE (dashboard layout):** `(dashboard)/layout.tsx` is a **server component with an auth guard** (reads the httpOnly `token` cookie, redirects to `/auth`) that deliberately re-renders the public `Navbar` + `Footer` on a white surface. It intentionally does **not** reuse `PublicTemplate` (different text color + main padding). There is still no dashboard sidebar — acceptable for the current read-only dashboard stage.

> ✅ **RESOLVED (toasts):** `<Toaster/>` is mounted once in the root layout (`src/app/layout.tsx`).

> ✅ **Type-check:** `npx tsc --noEmit` passes with 0 errors (FIX-06) — verified on every change.

> ⚠️ **Cache:** the public detail fetcher uses `META_ISR(60)` (FIX-21); mutation handlers call `router.refresh()` / `list.refetch()` (`useList`) — no `force-cache` on user-owned lists.

> ⚠️ **Known:** `Eventlist` filters status/type and sorts **client-side** because `GET /events/me` only supports `page`/`quantity`/`search` (see TANSTACK-QUERY.md §3.6).

---

## 7. Guidelines for New UI Work

1. **Use tokens, not raw hex** — brand color is `brand-500`/`secondary` (`#3c85f3`), dark text `gray-900`.
2. **Keep the server/client split** — pages are server components; interactive bits are client components; forms = RHF + zod.
3. **Reuse shared components** (`src/shared/components/`) before adding new shadcn primitives; there is no `components.json`.
4. **Respect the widget-driven direction (docx)** — for new public-page work, prefer small composable section components over monolithic pages so a future config-driven registry can consume them.
5. **Do not mount a second `<AuthProvider>`** — it's mounted in the root layout.
6. **Toasts are global** — `<Toaster/>` lives in the root layout; `toast.` anywhere is fine.
7. **Fonts:** body font is `font-outfit` (Outfit via Google Fonts `@import`); don't rely on `next/font` Geist for body text.
8. **Every new route needs a real backend contract first** — see `docs/RULES.md` and `docs/ARCHITECTURE.md` §4 before scaffolding pages.
