import type { Content, Post } from "./types";
import { clamp, seo, slugify } from "./seo";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://pinsandneedlescomedy.com";

const LOGO = "/brand/logo-white.png";

const post = (
  date: string,
  title: string,
  excerpt: string,
  body: string,
  tags: string[]
): Post => ({
  id: slugify(title),
  slug: slugify(title),
  title,
  excerpt,
  body,
  coverUrl: "",
  coverAlt: `${title} — Pins & Needles Comedy`,
  date,
  tags,
  published: true,
  featured: false,
  seo: seo({
    title: clamp(`${title} | Pins & Needles Comedy`, 60),
    description: excerpt,
    keywords: ["pins and needles comedy", "nyc comedy show", "tattoo comedy", ...tags],
    canonical: `${SITE_URL}/news/${slugify(title)}`,
    aiSummary: excerpt,
  }),
});

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

  posts: [
    post(
      "2026-08-24",
      "Pins & Needles Is Back From Edinburgh Fringe, and the Room Has Not Stopped Talking",
      "The show returned from the Edinburgh Festival Fringe with a tighter hour, new comics on the radar and a New York room that has not stopped talking about it.",
      `Pins & Needles Comedy is back in New York after a run at the Edinburgh Festival Fringe, and the show came home sharper than it left.

Playing to a festival crowd changes what a set has to do. The Fringe rewards clarity, and a month of it stripped the show down to its strongest structure: tight hosting, curated lineups, and comics who commit fully to the format.

## What's next

New York dates are being locked now. Watch the Instagram for the announcement, and check back here for the lineup.`,
      ["edinburgh fringe", "festival", "recap"]
    ),
    post(
      "2026-08-06",
      "Pins & Needles Comedy Brings Tattooed Stand-Up to the Edinburgh Festival Fringe 2026",
      "The NYC tattoo comedy show crossed the Atlantic for the Edinburgh Festival Fringe 2026, bringing 'Strip Down for Stand-Up' to a new audience.",
      `Pins & Needles Comedy is taking the show to the Edinburgh Festival Fringe.

The format travels intact: a curated lineup of experienced stand-ups, each performing a full set in minimal stagewear, with tattoos as part of the visual storytelling.

## Why Edinburgh

The Fringe is the largest arts festival in the world, and it is built for exactly the kind of show that does not fit the traditional club circuit. Pins & Needles is art-forward, visually distinct and tightly produced — a natural fit.`,
      ["edinburgh fringe", "festival", "announcement"]
    ),
    post(
      "2026-08-01",
      "July 30th Recap: Ink, Laughs, and Brooklyn's Wildest Night at Pins & Needles Comedy",
      "A full house at Secret Pour in Brooklyn for flash tattoos, an artist pop-up and a stacked lineup of tattooed comics.",
      `Secret Pour was packed on July 30th for one of the biggest Pins & Needles nights yet.

Mr. Stitch dropped a brand-new flash sheet and tattooed through the show. The lineup ran tight, the room stayed loud, and the pop-up sold through most of the rack.

## Thanks

To every comic, every artist, and everyone who came out — this is why the show works.`,
      ["brooklyn", "secret pour", "recap", "flash tattoos"]
    ),
    post(
      "2026-07-30",
      "Tonight in Brooklyn: Pins & Needles Takes Over Secret Pour — and Mr. Stitch Is Dropping Brand-New Flash",
      "Doors tonight at Secret Pour in Brooklyn with a stacked lineup and a fresh flash sheet from Mr. Stitch, tattooing live during the show.",
      `Tonight is the night. Pins & Needles Comedy takes over Secret Pour in Brooklyn.

Mr. Stitch is dropping a brand-new flash sheet and tattooing live through the show. Get there early if you want a slot.

## Details

- Venue: Secret Pour, Brooklyn
- Live tattooing during the show
- Curated lineup of tattooed stand-ups`,
      ["brooklyn", "secret pour", "mr stitch", "flash tattoos"]
    ),
    post(
      "2026-06-28",
      "Mr. Stitch Makes His Pins & Needles Debut July 30 at Secret Pour",
      "Tattoo artist Mr. Stitch joins Pins & Needles Comedy for the July 30 show at Secret Pour in Brooklyn.",
      `Mr. Stitch is making his Pins & Needles debut on July 30 at Secret Pour.

He will be tattooing live during the show off a flash sheet built for the night. Walk-ups only, first come first served.`,
      ["mr stitch", "tattoo artist", "brooklyn"]
    ),
    post(
      "2026-06-27",
      "Submissions Are Now Open for Pins & Needles at Edinburgh Fringe",
      "Comics can now submit to perform with Pins & Needles Comedy at the Edinburgh Festival Fringe.",
      `Submissions are open for the Edinburgh Fringe run.

We are looking for experienced stand-ups with tight, road-ready sets who are comfortable with the show's format. Everything is communicated clearly in advance — there are no surprises on stage.

## How to submit

Message @pinsandneedlescomedy on Instagram with a tape and a short note about your set.`,
      ["submissions", "edinburgh fringe", "comics"]
    ),
    post(
      "2026-06-26",
      "Pins & Needles Comedy Returns July 30 with Flash Tattoos, Artist Pop-Up, and Two POSER Comics",
      "The July 30 show brings flash tattoos, an artist pop-up shop and two comics from POSER to the Pins & Needles stage.",
      `The next Pins & Needles is July 30, and it is stacked.

Flash tattoos on site, an artist pop-up running all night, and two comics from POSER joining the lineup.`,
      ["lineup", "flash tattoos", "pop-up", "poser"]
    ),
    post(
      "2026-06-20",
      "Pins & Needles Comedy Audition Open Mic — June 25th at 9 PM",
      "An audition open mic for comics who want a spot on a future Pins & Needles lineup. June 25th at 9 PM.",
      `We are running an audition open mic on June 25th at 9 PM.

This is the fastest way onto a Pins & Needles lineup. Bring a tight five. The format is explained up front and nobody goes on stage without agreeing to it first.`,
      ["open mic", "auditions", "comics"]
    ),
    post(
      "2026-06-06",
      "May 28th Pins & Needles Comedy at Secret Pour | New York City Tattoo Comedy Show Recap",
      "A recap of the May 28th show at Secret Pour, including the secret short film screening that followed the stand-up.",
      `May 28th at Secret Pour was one of the sharpest lineups the show has run.

The stand-up ran tight, and the night closed with a secret screening of two short films for anyone who stuck around.`,
      ["recap", "secret pour", "short films"]
    ),
    post(
      "2026-05-28",
      "Pins & Needles Comedy Adds a Secret Screening of Two Short Films After the Stand-Up Show",
      "Two short films screened after the May 28th stand-up show at Secret Pour — announced only to the room.",
      `After the stand-up on May 28th, we screened two short films for the room.

No announcement, no pre-sale. If you were there, you saw them.`,
      ["short films", "screening", "secret pour"]
    ),
    post(
      "2026-05-28",
      "Rob White Dropped the Flash Sheet for Pins & Needles Comedy — Tattoos Available Tomorrow Night",
      "Tattoo artist Rob White released his flash sheet ahead of the Pins & Needles show, with tattoos available the following night.",
      `Rob White's flash sheet for Pins & Needles is out.

Tattoos are available tomorrow night at the show, walk-ups only.`,
      ["rob white", "flash sheet", "tattoo artist"]
    ),
    post(
      "2026-05-21",
      "Rob White Brings Comedy, Custom Portraits, and Fresh Ink",
      "Tattoo artist Rob White joins Pins & Needles Comedy with custom portraits and live tattooing.",
      `Rob White is joining Pins & Needles with custom portraits and fresh ink.

He will be drawing and tattooing through the show alongside the lineup.`,
      ["rob white", "tattoo artist", "lineup"]
    ),
  ],

  reels: [],
};
