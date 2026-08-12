<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes �?" APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Data fetching (TanStack Query)

- All client-side server data goes through **TanStack Query** — see `docs/TANSTACK-QUERY.md` (Indonesian, with examples).
- Read data with `useApiQuery`, mutate with `useApiMutation` (auto `invalidateQueries`), lists/pagination with `useList`.
- Add new data "addresses" to `src/lib/query-keys.ts` — never ad-hoc string literals.
- Do NOT add new `useEffect`+`useState` fetch blocks or call services directly in `useEffect` for server data.
- `AuthContext`/`auth.store.ts` (zustand) is global auth state — not server data; leave it on zustand.
- Keep `npx tsc --noEmit` at 0 errors after changes.

