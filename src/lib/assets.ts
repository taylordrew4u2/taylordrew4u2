/**
 * Healing the asset paths saved before the artwork became vector.
 *
 * Stored content wins over the defaults — that is the whole point of merge() —
 * so changing a path in defaults.ts does nothing for a site that has already
 * been saved from /admin. When the shipped images moved from PNG and WebP to
 * SVG, every saved reference kept pointing at a file that no longer exists,
 * and the site quietly served 404s in place of its own logo.
 *
 * Rather than ask anyone to re-pick twenty-nine cover images by hand, content
 * is rewritten as it is read. Only the files this repository ships are
 * touched: /uploads/ is left alone, because an uploaded photograph is still a
 * photograph, and anything absolute belongs to somebody else.
 */

/** The brand marks, which did not all keep their old names. */
const BRAND: Record<string, string> = {
  "/brand/logo-black.png": "/brand/logo-black.svg",
  "/brand/logo-white.png": "/brand/logo-white.svg",
  "/brand/logo-on-white.png": "/brand/logo-on-white.svg",
  "/brand/icon.png": "/brand/icon.svg",
  // The 32px favicon had no usable trace; the 512px icon stands in for it.
  "/brand/favicon-32.png": "/brand/favicon.svg",
  "/brand/bad-decisions-flyer.png": "/brand/bad-decisions-flyer.svg",
};

/** Post covers all kept their name and only changed extension. */
const POST_COVER = /^\/posts\/[A-Za-z0-9._-]+\.webp$/;

/** One path, rewritten if this repository now ships it as an SVG. */
export function vectorPath(value: string): string {
  const brand = BRAND[value];
  if (brand) return brand;
  if (POST_COVER.test(value)) return value.replace(/\.webp$/, ".svg");
  return value;
}

/**
 * Every string in a content tree, run through vectorPath(). Objects and
 * arrays are rebuilt; anything that is not a string is passed through
 * untouched, so numbers, booleans and nulls survive as themselves.
 */
export function healAssetPaths<T>(value: T): T {
  if (typeof value === "string") return vectorPath(value) as unknown as T;
  if (Array.isArray(value)) return value.map(healAssetPaths) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      out[key] = healAssetPaths(inner);
    }
    return out as T;
  }
  return value;
}

/**
 * The image a social crawler should be handed.
 *
 * Facebook, X, Slack and iMessage all decline to render an SVG preview, and
 * every mark this site ships is now an SVG — so a card pointing at one shows
 * nothing at all. When the chosen image is a vector, the crawler is sent to
 * /api/og instead, which draws a PNG at request time. A raster image set by
 * hand in the admin still wins, because somebody chose it on purpose.
 *
 * The card is asked for by path, not by title — the route looks up the words
 * itself, so the URL cannot be used to put arbitrary text on the brand.
 */
export function socialImage(base: string, chosen: string, path?: string): string {
  if (chosen && !/\.svg(\?|#|$)/i.test(chosen)) return chosen;
  const card = `${base.replace(/\/+$/, "")}/api/og`;
  const page = (path || "").trim();
  return page && page !== "/" ? `${card}?path=${encodeURIComponent(page)}` : card;
}

/**
 * The headline half of a page title.
 *
 * SEO titles carry a keyword tail after a separator — "Pins & Needles Comedy
 * | NYC Tattoo Comedy Show & Underground Stand-Up" — which is right for a
 * search result and wrong for a card, where it fills three lines and reads
 * like a billboard. The card takes what comes before the first separator.
 */
export function cardTitle(title?: string): string {
  return (title || "").split(/\s+[|·—–]\s+/)[0].trim();
}
