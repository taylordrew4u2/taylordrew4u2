import type { Content, Post, Seo } from "@/lib/types";
import { clamp, stripMarkdown, suggestKeywords } from "@/lib/seo";

export type Suggestion = {
  title: string;
  description: string;
  keywords: string[];
  aiSummary: string;
  ogImage: string;
  canonical: string;
  faq: { q: string; a: string }[];
};

const BRAND_TERMS = [
  "pins and needles comedy",
  "nyc comedy show",
  "tattoo comedy",
  "underground stand-up",
];

function base(content: Content) {
  return (content.site.url || "https://pinsandneedlescomedy.com").replace(/\/+$/, "");
}

/** Build an SEO suggestion for one page or post. All of it is editable afterwards. */
export function suggestFor(
  content: Content,
  key: "site" | "home" | "news" | "shop" | "about" | "contact" | "post",
  post?: Post
): Suggestion {
  const site = content.site;
  const brand = site.name || "Pins & Needles Comedy";
  const root = base(content);
  const fallbackImage = site.seo.ogImage || site.logoUrl || "/brand/icon.png";

  const make = (
    title: string,
    description: string,
    aiSummary: string,
    source: string,
    path: string,
    extraTerms: string[] = [],
    image = fallbackImage,
    faq: { q: string; a: string }[] = []
  ): Suggestion => ({
    title: clamp(title, 60),
    description: clamp(description, 158),
    keywords: suggestKeywords(source, [...extraTerms, ...BRAND_TERMS], 10),
    aiSummary: clamp(aiSummary, 480),
    ogImage: image,
    canonical: `${root}${path}`,
    faq,
  });

  switch (key) {
    case "post": {
      if (!post) break;
      const text = stripMarkdown(post.body);
      return make(
        `${post.title} | ${site.shortName || brand}`,
        post.excerpt || text,
        `${post.title}. ${post.excerpt || clamp(text, 320)} Published ${post.date} by ${brand}, an NYC stand-up comedy show where tattooed comedians perform in minimal stagewear.`,
        `${post.title} ${post.excerpt} ${text}`,
        `/news/${post.slug}`,
        post.tags,
        post.coverUrl || fallbackImage,
        [
          {
            q: `What is "${clamp(post.title, 70)}" about?`,
            a: post.excerpt || clamp(text, 220),
          },
        ]
      );
    }
    case "home":
      return make(
        `${brand} | NYC Tattoo Comedy Show & Underground Stand-Up`,
        `${site.tagline}. Watch reels from recent shows, read the latest news, and grab merch from ${brand}.`,
        `Home page of ${brand}, a New York City stand-up comedy show where tattooed comedians perform full sets in minimal stagewear. Shows Instagram reels from recent nights and the latest news posts.`,
        `${brand} ${site.tagline} ${content.about.story}`,
        "/",
        ["nyc comedy tonight", "brooklyn comedy show", "alternative comedy nyc"]
      );
    case "news":
      return make(
        `News | ${brand}`,
        `Show recaps, lineup announcements and guest tattoo artists from ${brand}, the NYC tattoo comedy show.`,
        `The news archive for ${brand}: recaps of past shows, upcoming lineups, guest tattoo artist announcements and festival appearances.`,
        content.posts.map((entry) => `${entry.title} ${entry.excerpt}`).join(" "),
        "/news",
        ["comedy show recap", "comedy lineup nyc"]
      );
    case "shop":
      return make(
        `Shop | ${brand} Merch`,
        `Official ${brand} merch — t-shirts, tote bags and caps from the NYC tattoo comedy show.`,
        `Official merchandise store for ${brand}, selling t-shirts, tote bags and caps.`,
        `${content.shop.heading} ${content.shop.intro} merch t-shirt tote cap`,
        "/shop",
        ["comedy merch", "tattoo comedy t-shirt"]
      );
    case "about":
      return make(
        `About Us | ${brand}`,
        `${brand} is an NYC stand-up showcase where tattooed comedians strip down for stand-up. Hosted by ${content.about.producers
          .map((producer) => producer.name)
          .join(" and ")}.`,
        `About page for ${brand}. ${clamp(stripMarkdown(content.about.story), 380)}`,
        `${content.about.story} ${content.about.producers.map((p) => `${p.name} ${p.bio}`).join(" ")}`,
        "/about",
        content.about.producers.map((producer) => producer.name.toLowerCase()),
        fallbackImage,
        [
          {
            q: `Who hosts ${brand}?`,
            a: `${content.about.producers.map((producer) => producer.name).join(" and ")} host and produce the show.`,
          },
          {
            q: `Is ${brand} a burlesque or strip show?`,
            a: "No. It is professionally produced stand-up comedy — the limited clothing is a structural choice that makes the performer's tattoos and physical presence part of the act.",
          },
        ]
      );
    case "contact":
      return make(
        `Contact | ${brand}`,
        `Book ${brand} for your venue, submit as a comic, or reach the NYC tattoo comedy show for press.`,
        `Contact page for ${brand} with booking, comic submission and press details.`,
        `${content.contact.heading} ${content.contact.intro} booking submissions press venue`,
        "/contact",
        ["book comedy show nyc", "comic submissions"]
      );
    case "site":
    default:
      return make(
        `${brand} | NYC Tattoo Comedy Show & Underground Stand-Up`,
        `${brand} is an NYC stand-up show where tattoo culture meets underground comedy — hosted by ${content.about.producers
          .map((producer) => producer.name)
          .join(" & ")}.`,
        `${brand} is a live, professionally produced stand-up comedy show in New York City in which tattooed comedians perform full sets in minimal stagewear under the tagline "Strip Down for Stand-Up."`,
        `${brand} ${site.tagline} ${content.about.story}`,
        "/",
        ["strip down for stand-up", "tattooed comedians"]
      );
  }

  return make(brand, site.tagline, site.tagline, brand, "/");
}

/** Copy any suggested value into an SEO block wherever the field is still empty. */
export function fillEmpty(seo: Seo, suggestion: Suggestion): Seo {
  return {
    ...seo,
    title: seo.title || suggestion.title,
    description: seo.description || suggestion.description,
    keywords: seo.keywords.length ? seo.keywords : suggestion.keywords,
    aiSummary: seo.aiSummary || suggestion.aiSummary,
    ogImage: seo.ogImage || suggestion.ogImage,
    canonical: seo.canonical || suggestion.canonical,
    faq: seo.faq.length ? seo.faq : suggestion.faq,
  };
}
