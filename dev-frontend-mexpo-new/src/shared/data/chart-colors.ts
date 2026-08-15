/**
 * Chart palette — single source of truth for recharts color props.
 *
 * Always reference CSS design tokens here (never raw hex) so charts follow
 * the theme. Token values live in `src/app/globals.css` (`@theme`).
 */
export const CHART_COLORS = [
  "var(--color-brand-500)", // #3c85f3 (brand blue)
  "var(--color-theme-purple-500)", // violet
  "var(--color-theme-pink-500)", // pink
  "var(--color-warning-500)", // amber
  "var(--color-success-500)", // green
  "var(--color-blue-light-500)", // cyan
  "var(--color-error-500)", // rose
  "var(--color-brand-600)", // indigo-ish deeper blue
] as const;

/** Single-series chart / bar color — the brand blue. */
export const CHART_PRIMARY = "var(--color-brand-500)";

/** Amount / revenue bar color — semantic success. */
export const CHART_SUCCESS = "var(--color-success-500)";