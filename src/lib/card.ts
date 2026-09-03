import type { Content } from "./types";
import { cardTitle } from "./assets.ts";

/**
 * The headline for a page's social card, resolved from the site's own content.
 *
 * The card route takes a path rather than the title itself. Free text in the
 * query string would mean anyone could point /api/og at whatever words they
 * liked and get them back rendered in the brand's colours on the brand's
 * domain — a passable-looking forgery from a URL alone. A path can only ever
 * name a page that exists, and the words come from what is actually published
 * there.
 *
 * Anything unrecognised falls back to the site's own name, so a stale or
 * mistyped link still produces the right card rather than an empty one.
 */
export function titleForPath(content: Content, path: string): string {
  const clean = `/${(path || "/").trim().replace(/^\/+|\/+$/g, "")}`;
  const fallback = cardTitle(content.site.seo.title) || content.site.name;

  const named: Record<string, string | undefined> = {
    "/": content.home.seo.title || content.site.seo.title,
    "/news": content.news.seo.title,
    "/shows": content.showsPage.seo.title,
    "/shop": content.shop.seo.title,
    "/about": content.about.seo.title,
    "/contact": content.contact.seo.title,
    "/bad-decisions": content.weekly.seo.title,
  };
  if (clean in named) return cardTitle(named[clean]) || fallback;

  const post = /^\/news\/(.+)$/.exec(clean);
  if (post) {
    const match = content.posts.find((entry) => entry.slug === post[1]);
    return match ? cardTitle(match.seo.title) || match.title || fallback : fallback;
  }

  const show = /^\/shows\/(.+)$/.exec(clean);
  if (show) {
    const match = content.shows.find((entry) => entry.slug === show[1]);
    return match ? cardTitle(match.seo.title) || match.title || fallback : fallback;
  }

  return fallback;
}
