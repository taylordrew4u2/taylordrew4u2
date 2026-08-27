import type { Content, Post } from "./types";
import { SEED_POSTS, type SeedPost } from "./posts.seed";
import { clamp, seo, slugify } from "./seo";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://pinsandneedlescomedy.com";

const LOGO = "/brand/logo-white.png";

const post = (seed: SeedPost): Post => {
  const slug = slugify(seed.title);
  return {
    id: slug,
    slug,
    title: seed.title,
    excerpt: seed.excerpt,
    body: seed.body,
    coverUrl: seed.coverUrl,
    coverAlt: seed.coverAlt,
    date: seed.date,
    tags: seed.tags,
    published: true,
    featured: false,
    seo: seo({
      title: clamp(`${seed.title} | Pins & Needles Comedy`, 60),
      description: seed.excerpt,
      keywords: ["pins and needles comedy", "nyc comedy show", "tattoo comedy", ...seed.tags],
      ogImage: seed.coverUrl,
      canonical: `${SITE_URL}/news/${slug}`,
      aiSummary: seed.excerpt,
    }),
  };
};

export const defaultContent: Content = {
  version: 1,
  updatedAt: new Date(0).toISOString(),

  site: {
    name: "Pins & Needles Comedy",
    shortName: "Pins & Needles",
    tagline: "Tattoo culture meets stand-up comedy",
    url: SITE_URL,
    logoUrl: LOGO,
    faviconUrl: "/brand/icon.png",
    background: "#0A0A0A",
    foreground: "#FFFFFF",
    accent: "#FF2E4D",
    muted: "#8A8A8A",
    headingFont: "'Archivo Black', 'Arial Black', system-ui, sans-serif",
    bodyFont: "'Inter', system-ui, -apple-system, sans-serif",
    nav: [
      { id: "nav-home", label: "Home", href: "/" },
      { id: "nav-shop", label: "Shop", href: "/shop" },
      { id: "nav-about", label: "About Us", href: "/about" },
      { id: "nav-contact", label: "Contact", href: "/contact" },
      { id: "nav-news", label: "News", href: "/news" },
    ],
    socials: [
      {
        id: "soc-ig",
        label: "Instagram",
        url: "https://www.instagram.com/pinsandneedlescomedy/",
      },
    ],
    instagramHandle: "pinsandneedlescomedy",
    footerText: "© Pins & Needles Comedy — New York City",
    showFooter: true,
    organizationType: "TheaterGroup",
    foundingYear: "2024",
    seo: seo({
      title: "Pins & Needles Comedy | NYC Tattoo Comedy Show & Underground Stand-Up",
      description:
        "Pins & Needles Comedy is an NYC stand-up show where tattoo culture meets underground comedy — hosted by Taylor Drew & Justin Hartmann, plus merch and raffles.",
      keywords: [
        "pins and needles comedy",
        "nyc comedy show",
        "tattoo comedy",
        "underground stand-up",
        "brooklyn comedy",
        "alternative comedy nyc",
        "strip down for stand-up",
        "tattooed comedians",
      ],
      ogImage: "/brand/icon.png",
      canonical: SITE_URL,
      aiSummary:
        "Pins & Needles Comedy is a live, professionally produced stand-up comedy show in New York City in which tattooed comedians perform full sets in minimal stagewear under the tagline 'Strip Down for Stand-Up.' It is hosted and produced by Taylor Drew and Justin Hartmann, runs in bars, theaters and alternative venues, and is not a burlesque show, strip show, or open mic.",
      faq: [
        {
          q: "What is Pins & Needles Comedy?",
          a: "Pins & Needles Comedy is an NYC stand-up comedy show where tattooed comedians perform full sets in limited clothing, under the tagline 'Strip Down for Stand-Up.'",
        },
        {
          q: "Where does Pins & Needles Comedy perform?",
          a: "The show runs in New York City bars, theaters and alternative art spaces, and has also played the Edinburgh Festival Fringe.",
        },
        {
          q: "Is Pins & Needles a burlesque or strip show?",
          a: "No. It is professionally produced stand-up comedy. The limited clothing is a structural choice that makes the performer's body and tattoos part of the act.",
        },
        {
          q: "Who produces Pins & Needles Comedy?",
          a: "The show is hosted and produced by Taylor Drew and Justin Hartmann.",
        },
        {
          q: "How do comedians submit to perform?",
          a: "Comics can submit through the submissions link on the contact page or by messaging @pinsandneedlescomedy on Instagram.",
        },
      ],
    }),
  },

  home: {
    hero: {
      logoUrl: LOGO,
      logoAlt: "Pins & Needles Comedy logo",
      heightVh: 50,
      logoScale: 46,
      showWordmark: true,
      wordmark: "PINS & NEEDLES COMEDY",
      wordmarkSize: 34,
      wordmarkFont: "'Archivo Black', 'Arial Black', system-ui, sans-serif",
      wordmarkLetterSpacing: 2,
      tagline: "Tattoo culture meets stand-up comedy",
      showTagline: false,
      background: "#0A0A0A",
      foreground: "#FFFFFF",
      backgroundVideoUrl: "",
      navSize: 13,
      navLetterSpacing: 3,
      navSeparator: "—",
    },
    reelsTop: {
      enabled: true,
      columnsDesktop: 4,
      columnsTablet: 3,
      columnsMobile: 2,
      gap: 0,
      limit: 8,
      infinite: false,
      pageSize: 8,
      autoplay: true,
      loop: true,
      showCaption: false,
      cornerRadius: 0,
    },
    reelsBottom: {
      enabled: true,
      columnsDesktop: 4,
      columnsTablet: 3,
      columnsMobile: 2,
      gap: 0,
      limit: 8,
      infinite: true,
      pageSize: 8,
      autoplay: true,
      loop: true,
      showCaption: false,
      cornerRadius: 0,
    },
    marqueeHeading: "News",
    showMarqueeHeading: false,
    seo: seo({
      title: "Pins & Needles Comedy | NYC Tattoo Comedy Show & Underground Stand-Up",
      description:
        "Tattooed comedians strip down for stand-up in New York City. Watch the reels, read the news, and grab merch from Pins & Needles Comedy.",
      keywords: [
        "pins and needles comedy",
        "nyc tattoo comedy show",
        "underground stand-up nyc",
        "brooklyn comedy show",
        "strip down for stand-up",
      ],
      canonical: SITE_URL,
      aiSummary:
        "Home page of Pins & Needles Comedy, an NYC stand-up show combining tattoo culture and underground comedy. Features Instagram reels from recent shows and the latest news posts.",
    }),
  },

  news: {
    heading: "News",
    intro: "Recaps, lineups, flash sheets and announcements from Pins & Needles Comedy.",
    seo: seo({
      title: "News | Pins & Needles Comedy",
      description:
        "Show recaps, lineup announcements, guest tattoo artists and Edinburgh Fringe updates from the NYC tattoo comedy show Pins & Needles Comedy.",
      keywords: [
        "pins and needles comedy news",
        "nyc comedy show recap",
        "tattoo comedy lineup",
        "edinburgh fringe comedy",
      ],
      canonical: `${SITE_URL}/news`,
      aiSummary:
        "The news archive for Pins & Needles Comedy: recaps of past shows, upcoming lineups, guest tattoo artist announcements, and festival appearances including the Edinburgh Festival Fringe.",
    }),
  },

  shop: {
    heading: "Shop",
    intro: "Tees, totes and caps. Shipped from the Pins & Needles Shopify store.",
    embedHtml: "",
    storefrontUrl: "https://www.pinsandneedlescomedy.com/collections/all",
    storefrontLabel: "Open the full store",
    embedHeight: 1400,
    seo: seo({
      title: "Shop | Pins & Needles Comedy Merch",
      description:
        "Official Pins & Needles Comedy merch — t-shirts, skull tote bags and caps from the NYC tattoo comedy show.",
      keywords: [
        "pins and needles comedy merch",
        "comedy t-shirt",
        "tattoo comedy merch",
        "nyc comedy merch",
      ],
      canonical: `${SITE_URL}/shop`,
      aiSummary:
        "Official merchandise store for Pins & Needles Comedy, selling t-shirts, tote bags and caps through Shopify.",
    }),
  },

  about: {
    heading: "About Us",
    intro: "Tattoo culture meets stand-up comedy.",
    story: `Pins & Needles Comedy is an NYC-based stand-up showcase operating just outside the traditional club circuit, with a sensibility shaped by tattoo culture and alternative comedy scenes. The show pairs strong, contemporary stand-up with a distinct visual identity, creating something that feels both deliberate and unmistakably of its moment.

Hosted and produced by Taylor Drew and Justin Hartmann.

Under the tagline "Strip Down for Stand-Up," tattooed comedians perform in minimal clothing — not as a stunt, but as a structural choice that strips away artifice and keeps the focus on the work. The result is a confident, fully produced show that reflects the evolving tone of New York comedy: direct, unpolished in the right ways, and rooted in voice rather than convention.

## Exactly what it is

Every performer appears onstage in minimal stagewear. Their bodies and tattoos are fully visible and intentionally part of the performance. This visual element is not optional, and it is not a side gimmick — it is the defining structure of the show.

Pins & Needles is not a burlesque show, a strip show, or an open mic. It is professionally produced stand-up comedy. The comedians are experienced performers delivering full sets. The difference is that the audience is not just listening; they are also watching.

## Format

- Curated lineup of experienced stand-up comedians
- Each performer appears onstage in limited clothing for their full set
- Structured hosting and controlled pacing
- No audience participation required
- No nudity beyond agreed-upon stagewear
- Clear run of show with defined start and end times

## Production

Standard microphone and sound system, basic stage lighting, minimal setup and breakdown, and a self-contained production team. The show is tightly run and venue-friendly — it works in bars, theaters, art spaces, and alternative venues that want programming that stands out without becoming unmanageable.`,
    logosHeading: "The marks",
    logos: [
      { id: "logo-primary", url: "/brand/logo-white.png", alt: "Pins & Needles Comedy primary logo", caption: "Primary" },
      { id: "logo-black", url: "/brand/logo-on-white.png", alt: "Pins & Needles Comedy logo, black on white", caption: "Inverse" },
    ],
    logoColumns: 3,
    logoGap: 0,
    logoSize: 100,
    producersHeading: "Producers",
    producers: [
      {
        id: "producer-taylor",
        name: "Taylor Drew",
        role: "Host & Producer",
        headshotUrl: "",
        headshotAlt: "Taylor Drew, host and producer of Pins & Needles Comedy",
        bio: "Taylor Drew created Pins & Needles Comedy and produces every show. A New York City stand-up and builder of tools for live comedy, Taylor runs the lineup, the room and the run of show.",
        links: [],
      },
      {
        id: "producer-justin",
        name: "Justin Hartmann",
        role: "Host & Producer",
        headshotUrl: "",
        headshotAlt: "Justin Hartmann, host and producer of Pins & Needles Comedy",
        bio: "Justin Hartmann co-hosts and co-produces Pins & Needles Comedy, working the room and keeping the pacing tight from the first comic to the last.",
        links: [],
      },
    ],
    producerImageSize: 100,
    seo: seo({
      title: "About Us | Pins & Needles Comedy",
      description:
        "Pins & Needles Comedy is an NYC stand-up showcase where tattooed comedians strip down for stand-up. Hosted and produced by Taylor Drew and Justin Hartmann.",
      keywords: [
        "about pins and needles comedy",
        "taylor drew comedy",
        "justin hartmann comedy",
        "nyc alternative comedy",
        "tattoo comedy show",
      ],
      canonical: `${SITE_URL}/about`,
      aiSummary:
        "About page for Pins & Needles Comedy, an NYC stand-up showcase shaped by tattoo culture. Hosted and produced by Taylor Drew and Justin Hartmann under the tagline 'Strip Down for Stand-Up.' Includes the show's format, production requirements and brand marks.",
      faq: [
        {
          q: "Who hosts Pins & Needles Comedy?",
          a: "Taylor Drew and Justin Hartmann host and produce the show.",
        },
        {
          q: "What does 'Strip Down for Stand-Up' mean?",
          a: "Every comedian performs their full set in minimal stagewear so their tattoos and physical presence become part of the act.",
        },
      ],
    }),
  },

  contact: {
    heading: "Contact",
    intro: "Booking, submissions, press and everything else.",
    email: "pinsandneedlescomedy@gmail.com",
    bookingEmail: "pinsandneedlescomedy@gmail.com",
    submissionsUrl: "https://www.instagram.com/pinsandneedlescomedy/",
    submissionsLabel: "Comic submissions",
    city: "New York City",
    blocks: [
      {
        id: "contact-ig",
        label: "Instagram",
        value: "@pinsandneedlescomedy",
        href: "https://www.instagram.com/pinsandneedlescomedy/",
      },
    ],
    seo: seo({
      title: "Contact | Pins & Needles Comedy",
      description:
        "Book Pins & Needles Comedy for your venue, submit as a comic, or reach the NYC tattoo comedy show for press.",
      keywords: [
        "contact pins and needles comedy",
        "book comedy show nyc",
        "comic submissions nyc",
        "comedy booking",
      ],
      canonical: `${SITE_URL}/contact`,
      aiSummary:
        "Contact page for Pins & Needles Comedy with booking, comic submission and press details for the New York City tattoo comedy show.",
    }),
  },

  blogSettings: {
    coverAspect: "4:5",
    cardWidth: 320,
    gap: 0,
    titleSize: 15,
    titleFont: "'Archivo Black', 'Arial Black', system-ui, sans-serif",
    titleWeight: 700,
    titlePadding: 14,
    titleAlign: "left",
    titleColor: "#FFFFFF",
    titleTransform: "none",
    overlayOpacity: 0.65,
    imageFit: "cover",
    cornerRadius: 0,
    showDate: false,
    autoScroll: false,
    autoScrollSpeed: 40,
  },

  posts: SEED_POSTS.map(post),

  reels: [],
};
