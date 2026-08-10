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
| shadcn vars | `--background/--foreground/--card/--primary/--secondary/--radius/--sidebar-*` | base tokens |

> Verified values: `--color-primary: #ffffff`, `--color-secondary: #3c85f3`, `--color-brand-500: #3c85f3`, `--color-brand-600: #3641f5`.

### 2.2 Typography
- **Declared but NOT loaded:** `--font-outfit: Outfit, sans-serif` — `<body>` uses `font-outfit` but Outfit is never imported → silently falls back to `sans-serif`. ⚠️
- **Loaded via Google Fonts `@import`:** `Plus Jakarta Sans` and `Public Sans`.
- ⚠️ Mismatch: `--font-jakarta: "Jakarta Sans"` references a family that is **not** the imported `Plus Jakarta Sans`; the `font-jakarta` utility won't match the loaded font.
- **Root layout** loads `Geist` + `Geist_Mono` via `next/font` (CSS vars) — effectively unused for body text.
- Custom text scale in `@theme`: `--text-title-2xl: 72px` down to `--text-theme-xs: 12px` (template-derived names like `title-*`, `theme-*`).

### 2.3 Breakpoints (custom)
`2xsm: 375px`, `xsm: 425px`, plus Tailwind defaults, and `3xl: 2000px`.

### 2.4 Shape / Radius
shadcn `--radius` token present; `tw-animate-css` enables animation utilities; `@custom-variant dark (&:is(.dark *))`.

### 2.5 Shadows / Effects
`--shadow-theme-*` scale; custom `@utility` classes: `menu-item*`, `menu-dropdown-*`, `no-scrollbar`, `custom-scrollbar`.

### 2.6 Dark Mode
- `ThemeContext` (light/dark/system) exists but is **never mounted**; root layout imports `ThemeProvider`/`useTheme` without using them; navbar `ThemeSwitcherIcon` is commented out.
- → **Dark mode is dead code.** The `.dark` CSS block is not reachable at runtime.

### 2.7 Legacy CSS
`globals.css` (951 lines) also contains styling for **flatpickr, FullCalendar (.fc), Swiper, jVectorMap, ApexCharts** — none of which are dependencies. This is leftover TailAdmin-style template CSS; **do not assume those libraries are available**.

---

## 3. Component Library & Reusable UI Patterns

### 3.1 Primitives (`src/components/ui/`)
- `button.tsx` — shadcn-style, `class-variance-authority` variants + `radix-ui` `Slot.Root` (asChild)
- `select.tsx` — full Radix Select primitive
- `pagination.tsx` — wraps `Button`

> ⚠️ No `components.json`, no shadcn CLI registry. Missing common shadcn primitives (Dialog, AlertDialog, Badge, Skeleton, Card, Input) are **not** present — the codebase uses its own shared components instead.

### 3.2 Shared components (`src/shared/components/`)
- `button/Button.tsx` — primary/secondary/ghost variants; renders `<a>` when `href` given
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
4. **Toasts** via `sonner` (⚠ only mounted in `AuthTemplate` today).
5. **Icons** — lucide-react primarily; fontawesome only in Navbar/SearchBar/Hero.
6. **Animation** — `framer-motion` for hero/section reveals; `embla-carousel` for event carousels (autoplay via `useCarousel.ts`).

---

## 4. Page-Level Inventory (what exists vs dead links)

### Live & reachable
| Route | Design notes |
|---|---|
| `/` | Hero + category filter + Upcoming/OnGoing/Past carousels (`Events.tsx`) |
| `/event/[uuid]` | Hero + static "Registration Flow" + tabs: Info/Agenda/Speakers/Sponsors/Contact/Workshop/Tenant |
| `/about` | Marketing page (⚠ currently fails type-check — broken imports) |
| `/contact` | Static form (fake submit) + leaflet map |
| `/faq` | Accordion from `faq.data.ts` |
| `/auth` | Login/Register tabs, `MexpoCard` brand panel |
| `/verify-email` | Token auto-verify on mount |
| `/dashboard` | My Events list + search + pagination |
| `/dashboard/[uuid]` | Role-dispatched view (Owner/Committee/Tenant/Visitor) — read-only event detail |

### Dead links (referenced in code/UI, route does not exist — all 404)
`/onsite-register/[uuid]`, `/dashboard/[uuid]/register`, `/dashboard/[uuid]/tenant-list`, `/dashboard/[uuid]/edit`, `/dashboard/[uuid]/rundown`, `/events/committee/create`, `/profile`, `/forgot-passwords`, `/organizer/*`, `/privacy-policy`, `/terms`, `/report`, `/dashboard/qr-code`, `/dashboard/certificates`.

> These are the UI affordances for the **unbuilt** flows (registration, tenant portal, check-in, QR, certificates). Do not add routes blindly — they imply backend features that are `[PLANNED]` (see PRD §7).

---

## 5. Icon / Asset Library

- `public/` ~180 assets: `logo/logo-m.svg`, `images/logo/*`, `images/brand/brand-01…15.svg`, `cards/*`, `carousel/*`, `user/user-01…37`, `error/*.svg`, `icons/qr-code.svg`, `shape/*` — generic admin-template asset dump; only a subset is actually used.
- `next.config.ts` remote image allowlist: `images.unsplash.com`, `s3.smktelkom-mlg.sch.id`, `img.youtube.com`, `i.ytimg.com`, `via.placeholder.com`.

---

## 6. Inconsistencies & Risks (`> ⚠️`)

> ⚠️ **CONTRADICTION (fonts):** the design intends `Outfit` as the body font (`--font-outfit`, applied on `<body>`), but Outfit is never loaded — users see `sans-serif` fallback. `--font-jakarta` is named wrong for the imported `Plus Jakarta Sans`.

> ⚠️ **CONTRADICTION (dark mode):** a full theme system exists (context + CSS) but is not wired into any layout or toggle. Any dark-mode work starts from dead code.

> ⚠️ **CONTRADICTION (dashboard layout):** `(dashboard)/layout.tsx` renders `PublicTemplate` (public navbar + footer), not a dashboard shell — there is no sidebar. The "dashboard" currently looks like the public site.

> ⚠️ **CONTRADICTION (toasts):** `sonner` is used throughout but `<Toaster/>` is mounted only in `AuthTemplate`; toasts on public + dashboard pages are dropped silently.

> ⚠️ **Type-check failure:** the repo does not compile (`npx tsc --noEmit` fails in `About/StatCard`, `About/Testimonial`, `chunkArray`). Fix these before any `next build`.

> ⚠️ **Stale data:** `getEventByUuid` / `getEventByUuidByMe` use `force-cache`; `router.refresh()` after publish/delete may not bust the fetch cache.

---

## 7. Guidelines for New UI Work

1. **Use tokens, not raw hex** — brand color is `brand-500`/`secondary` (`#3c85f3`), dark text `gray-900`.
2. **Keep the server/client split** — pages are server components; interactive bits are client components; forms = RHF + zod.
3. **Reuse shared components** (`src/shared/components/`) before adding new shadcn primitives; there is no `components.json`.
4. **Respect the widget-driven direction (docx)** — for new public-page work, prefer small composable section components over monolithic pages so a future config-driven registry can consume them.
5. **Do not mount a second `<AuthProvider>`** — it's already mounted in root layout (and duplicated in `PublicTemplate` — fix the duplication rather than adding more).
6. **Wire toasts globally** (e.g. mount `<Toaster/>` once in root layout) before building UX that relies on them.
7. **Fonts:** if the design intends Outfit, load it (next/font or Google) — don't rely on the declared-but-unloaded var.
8. **Every new route needs a real backend contract first** — see `docs/RULES.md` and `docs/ARCHITECTURE.md` §4 before scaffolding pages.
