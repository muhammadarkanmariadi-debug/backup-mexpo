// Event photo display ratio — shared by the detail page and the event form.
// Stored on the event as `features.photo_ratio` ("W:H") + `features.photo_fit`.

export type PhotoFit = "contain" | "cover";

export const DEFAULT_PHOTO_RATIO = 16 / 9;
export const DEFAULT_PHOTO_FIT: PhotoFit = "contain";

/** Allowed range for any ratio (width / height): 1:2 up to 3:1. */
export const MIN_PHOTO_RATIO = 0.5;
export const MAX_PHOTO_RATIO = 3;

export interface RatioPreset {
  label: string;
  w: number;
  h: number;
  hint: string;
}

export const RATIO_PRESETS: RatioPreset[] = [
  { label: "16:9", w: 16, h: 9, hint: "Banner lebar" },
  { label: "4:3", w: 4, h: 3, hint: "Foto standar" },
  { label: "1:1", w: 1, h: 1, hint: "Persegi" },
  { label: "3:4", w: 3, h: 4, hint: "Poster tegak" },
  { label: "21:9", w: 21, h: 9, hint: "Ultra lebar" },
];

const round2 = (n: number) => Math.round(n * 100) / 100;

export function clampRatio(r: number): number {
  if (!Number.isFinite(r) || r <= 0) return DEFAULT_PHOTO_RATIO;
  return Math.min(MAX_PHOTO_RATIO, Math.max(MIN_PHOTO_RATIO, r));
}

/** "16:9" / "1.33:1" -> 1.777... ; null when it is not a valid ratio. */
export function parseRatio(value?: string | null): number | null {
  if (!value) return null;
  const m = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(value.trim());
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (!(w > 0) || !(h > 0)) return null;
  return w / h;
}

/** Width/height -> "W:H" string with at most two decimals each. */
export function formatRatio(w: number, h: number): string {
  return `${round2(w)}:${round2(h)}`;
}

/** Ratio to render for an event: stored value, clamped, or the 16:9 default. */
export function resolvePhotoRatio(value?: string | null): number {
  const parsed = parseRatio(value);
  return parsed === null ? DEFAULT_PHOTO_RATIO : clampRatio(parsed);
}

export function resolvePhotoFit(value?: string | null): PhotoFit {
  return value === "cover" ? "cover" : DEFAULT_PHOTO_FIT;
}

/** The preset whose ratio equals `value` (within rounding), if any. */
export function matchPreset(value?: string | null): RatioPreset | null {
  const r = parseRatio(value);
  if (r === null) return null;
  return RATIO_PRESETS.find((p) => Math.abs(p.w / p.h - r) < 0.01) ?? null;
}
