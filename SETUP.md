# Pins & Needles Comedy — site

The public site plus a full self-saving admin, built to replace the hosted
version of pinsandneedlescomedy.com with something you own outright.

Everything here runs on free tiers: Next.js on Vercel's Hobby plan, Vercel Blob
for storage, Google Fonts for type. No paid service is required.

---

## Run it locally

```bash
npm install
npm run dev
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin — password `weed`

Content is written to `data/content.json`, uploads to `public/uploads/`. Both
are gitignored, so your edits stay out of commits.

---

## Deploy to Vercel (free)

1. Push this branch and import the repo at [vercel.com/new](https://vercel.com/new).
2. In the project, open **Storage → Create → Blob** and connect it. That sets
   `BLOB_READ_WRITE_TOKEN`, which switches the app from local files to Blob
   storage automatically — required, because Vercel's filesystem is read-only.
3. Add environment variables:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | `https://pinsandneedlescomedy.com` |
   | `ADMIN_PASSWORD` | your password (defaults to `weed`) |
   | `ADMIN_SECRET` | output of `openssl rand -hex 32` |

4. Point the domain at Vercel under **Settings → Domains**.

Anywhere with a writable disk — a VPS, Docker, a Codespace — works too with no
env vars at all; the filesystem driver handles it.

---

## The admin

`/admin`, password `weed` (override with `ADMIN_PASSWORD`).

**There is no save button.** Every field writes itself about a second after you
stop typing. The header shows `Saving…` then `Saved`; a failed save retries on
its own.

| Tab | What's in it |
| --- | --- |
| **Home** | Hero logo, its size, the panel height, the site name and its font/size/spacing, the nav word row, both reel grids, optional background video |
| **Reels** | Instagram link, video file, poster frame, caption, alt text, order, published state. Bulk-paste links to add many at once |
| **News** | Every post, plus the display settings that apply to *all* posts: cover orientation, card width, gap, title font/size/weight/padding/alignment/case/color, overlay strength, corner radius |
| **Shop** | Your Shopify embed code and a storefront link |
| **About Us** | Story, logo gallery with per-tile sizing, and one card per producer (headshot beside bio) |
| **Contact** | Emails, submissions link, and any extra rows |
| **Site & SEO** | Name, colors, fonts, nav links, socials, footer, site-wide SEO defaults |

### Images

Uploading a cover, headshot, logo or poster opens a cropper locked to the right
shape — 9:16 for reel posters, square for headshots and logos, and whatever you
picked under **News → Cover orientation** for post covers. Drag to reposition,
slide to zoom. Videos, SVGs and GIFs upload untouched.

Changing the blog cover orientation re-crops *new* uploads. Re-upload an
existing cover to bring it to the new shape.

---

## SEO and AI SEO

Every page and every post has its own block: meta title, meta description,
keywords, share image, canonical URL, an **AI summary** written for answer
engines, and an FAQ list. Each field arrives prefilled with a suggestion built
from your own content, with a character meter and a live Google preview. Edit
anything; the suggestion is a starting point, not a lock.

Generated automatically from that content:

- `/sitemap.xml` — every page and published post
- `/robots.txt` — explicitly welcomes GPTBot, ClaudeBot, PerplexityBot,
  OAI-SearchBot, Google-Extended and Applebot-Extended
- `/rss.xml` — the news feed
- `/llms.txt` — a plain-text brief for AI crawlers, assembled from the AI
  summary and FAQ fields
- JSON-LD on every page: Organization, WebSite, Blog, BlogPosting,
  BreadcrumbList and FAQPage

---

## Reels: how the grid actually works

Instagram's own embed will not autoplay silently, and it drags in its own
header and caption chrome — neither of which fits an edge-to-edge grid. So each
tile plays a video file you upload, muted and looping, and a click opens the
real Instagram post.

For each reel: paste the permalink, upload the video (your original export, or
the reel downloaded from Instagram), and optionally a poster frame. Tiles far
off screen pause themselves so a long infinite grid stays smooth.

---

## Shop

`/shop` renders whatever embed code you paste into **Admin → Shop**. Scripts in
that snippet are executed, so Shopify's Buy Button code works as-is:

Shopify admin → **Sales channels → Buy Button** → build a product or collection
button → **Copy code** → paste it in.

---

## Layout of the code

```
src/app/            routes: /, /news, /news/[slug], /shop, /about, /contact, /admin
src/app/api/admin/  login, logout, content (auto-save), upload
src/app/admin/      the admin UI — tabs, cropper, SEO editor
src/components/     hero, reel grid, news marquee, shop embed, footer
src/lib/            content types, defaults, storage driver, SEO helpers, JSON-LD
```

`src/lib/store.ts` is the only place that touches storage. Content from disk is
merged over `src/lib/defaults.ts`, so adding a field to the model never needs a
migration — existing saved content just picks up the new default.
