const GOOGLE_HOST = /^(www\.|maps\.)?google\.[a-z]{2,3}(\.[a-z]{2})?$/i;

const queryEmbed = (query: string) =>
  `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

/**
 * Turns whatever the organizer pasted into an iframe-safe Google Maps URL.
 *
 * Accepted: an `<iframe>` snippet or a `.../maps/embed?pb=...` / `output=embed`
 * URL (used as-is, normalized to https://www.google.com which the CSP allows).
 * A normal Maps link (`/maps/place/...`, `?q=...`, `@lat,lng`) refuses to be
 * framed, so its place/coordinates are re-wrapped as an embed. Anything else —
 * short `maps.app.goo.gl` links, other hosts, garbage — falls back to an embed
 * of the event location.
 */
export function resolveMapsEmbedUrl(raw: string | null | undefined, fallbackQuery: string): string {
  const trimmed = raw?.trim();
  const src = trimmed?.match(/src=["']([^"']+)["']/)?.[1] ?? trimmed;
  if (!src) return queryEmbed(fallbackQuery);

  let url: URL;
  try {
    url = new URL(src.replace(/&amp;/g, "&"));
  } catch {
    return queryEmbed(fallbackQuery);
  }
  if (!/^https?:$/.test(url.protocol) || !GOOGLE_HOST.test(url.hostname)) {
    return queryEmbed(fallbackQuery);
  }

  const embeddable =
    url.pathname.startsWith("/maps/embed") || url.searchParams.get("output") === "embed";
  if (embeddable) {
    url.protocol = "https:";
    url.hostname = "www.google.com";
    return url.toString();
  }

  const coords = url.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  const place = url.pathname.match(/\/maps\/(?:place|search)\/([^/]+)/)?.[1];
  const query =
    url.searchParams.get("q") ??
    url.searchParams.get("query") ??
    (place ? decodeURIComponent(place.replace(/\+/g, " ")) : null) ??
    (coords ? `${coords[1]},${coords[2]}` : null);

  return queryEmbed(query || fallbackQuery);
}
