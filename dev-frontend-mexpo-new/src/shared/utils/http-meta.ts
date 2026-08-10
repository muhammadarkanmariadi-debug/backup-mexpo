/**
 * Opsi fetch untuk Next.js App Router
 * Gunakan di Server Components atau Server Actions
 */

export type CacheStrategy =
  | "no-store"          // selalu fresh, tidak di-cache (default untuk mutable data)
  | "force-cache"       // selalu pakai cache (cocok untuk data statis)
  | "no-cache";         // validasi ke server tiap request

export type FetchMeta = {
  cache?: CacheStrategy;
  revalidate?: number | false;  // false = no revalidation, angka = detik
  tags?: string[];              // untuk revalidateTag()
};

/**
 * Konversi FetchMeta ke NextFetchRequestConfig yang diterima fetch()
 */
export const buildFetchMeta = (meta?: FetchMeta): RequestInit => {
  if (!meta) return { cache: "no-store" };

  const init: RequestInit = {};

  if (meta.cache) {
    init.cache = meta.cache as RequestCache;
  }

  if (meta.revalidate !== undefined || meta.tags) {
    init.next = {
      ...(meta.revalidate !== undefined && { revalidate: meta.revalidate }),
      ...(meta.tags && { tags: meta.tags }),
    };
  }

  return init;
};

// ── Preset umum ──────────────────────────────────────────────

/** Data yang sering berubah (form submit, user data) */
export const META_DYNAMIC: FetchMeta = { cache: "no-store" };

/** Data semi-statis, revalidate tiap 60 detik */
export const META_ISR = (seconds = 60): FetchMeta => ({ revalidate: seconds });

/** Data statis sepenuhnya */
export const META_STATIC: FetchMeta = { cache: "force-cache" };

/** Dengan cache tag untuk revalidateTag() */
export const META_TAGGED = (tags: string[]): FetchMeta => ({
  revalidate: false,
  tags,
});