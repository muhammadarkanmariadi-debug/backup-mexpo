/**
 * Case-insensitive text search for PostgreSQL.
 *
 * MySQL/MariaDB collations are case-insensitive, so `{ contains: 'expo' }`
 * finds "Expo". PostgreSQL's `LIKE` is case-sensitive, so the same filter finds
 * nothing and every search box in the app looked broken. Prisma's
 * `mode: 'insensitive'` fixes that, but it is PostgreSQL-only (MySQL rejects
 * it), so it is added centrally here instead of at each of the ~90 call sites.
 */

const TEXT_FILTERS = ['contains', 'startsWith', 'endsWith'] as const;

/** Keys whose value is write payload, never a filter. */
const SKIPPED_KEYS = new Set(['data', 'create', 'update', 'createMany']);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  Object.getPrototypeOf(value) === Object.prototype;

/**
 * Returns a copy of Prisma args where every string filter
 * (`contains` / `startsWith` / `endsWith`) gets `mode: 'insensitive'`.
 * Filters that already set a `mode` are left untouched.
 */
export function withInsensitiveSearch<T>(args: T): T {
  if (Array.isArray(args)) {
    return (args as unknown[]).map((item) =>
      withInsensitiveSearch(item),
    ) as unknown as T;
  }
  if (!isPlainObject(args)) return args;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    out[key] = SKIPPED_KEYS.has(key) ? value : withInsensitiveSearch(value);
  }
  const isTextFilter =
    !('mode' in out) && TEXT_FILTERS.some((f) => typeof out[f] === 'string');
  if (isTextFilter) out.mode = 'insensitive';
  return out as T;
}
