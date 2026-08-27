import "server-only";
import { headers } from "next/headers";

const hostOf = (value: string): string => {
  try {
    return new URL(value).host.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
};

/**
 * Is this request arriving on the domain the site calls its own?
 *
 * Until the DNS moves, the site also answers on its *.vercel.app address. That
 * address serves identical pages, so letting Google index it would create a
 * duplicate that competes with the real domain later — and every canonical tag
 * on it points somewhere else anyway.
 *
 * Only the canonical host is indexable. The moment the real domain resolves
 * here, this returns true on its own and the whole site becomes crawlable with
 * no setting to remember to flip.
 */
export async function onCanonicalHost(siteUrl: string): Promise<boolean> {
  const canonical = hostOf(siteUrl);
  if (!canonical) return true; // Nothing configured to compare against.

  const requestHost = (await headers()).get("host")?.toLowerCase().replace(/^www\./, "");
  if (!requestHost) return true; // No Host header: don't guess, don't block.

  // Strip the port so localhost:3000 matches a localhost canonical.
  return requestHost.split(":")[0] === canonical.split(":")[0];
}
