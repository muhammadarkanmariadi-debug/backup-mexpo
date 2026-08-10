// src/helper/sort.ts
// Shared sorting helper for list endpoints.
//
// Each service exposes a whitelist of sortable fields (alias → Prisma orderBy
// builder). `sort_by` values outside the whitelist are ignored and the service
// falls back to its default ordering — this prevents arbitrary field injection.

export type SortDir = 'asc' | 'desc';

export function buildOrderBy(
  sortBy: string | undefined,
  sortDir: SortDir | undefined,
  sortable: Record<string, (dir: SortDir) => unknown>,
  fallback: unknown,
): any {
  if (!sortBy) return fallback;
  const builder = sortable[sortBy];
  if (!builder) return fallback;
  return builder(sortDir ?? 'asc');
}
