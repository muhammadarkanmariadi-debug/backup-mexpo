// src/helper/slug.ts
// URL-friendly identifiers. Entities keep their uuid PRIMARY KEY; `slug`
// is a unique, human-readable secondary key used in URLs (/event/<slug>, etc.).

export function slugify(input: string, fallback = 'item'): string {
  const out = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 64);
  return out || fallback;
}

/** True when the value looks like a UUID (so lookups fall back to `uuid`). */
export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

/** First free slug based on `base` (appends -2, -3 … on collisions). */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let i = 2;
  while (await exists(candidate)) {
    candidate = `${root}-${i++}`;
  }
  return candidate;
}
