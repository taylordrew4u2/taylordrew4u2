# Pins & Needles Comedy

The site for [pinsandneedlescomedy.com](https://pinsandneedlescomedy.com) — an NYC
stand-up show where tattoo culture meets underground comedy — plus a full admin
that saves itself as you type.

Everything runs on free tiers: Next.js on Vercel's Hobby plan, Vercel Blob for
storage, Google Fonts for type. Nothing here needs a paid service.

- Site: `/`
- Admin: `/admin` — password `weed`

**Setting this up for the first time? Work through [`TODO.md`](TODO.md)** —
it is the same information as a checklist, in the order it has to happen.

---

# Setting it up on Vercel

Do these in order. **Step 3 is the one that matters** — skip it and the admin
loads fine but silently refuses to save anything.

### 1. Import the repo

Go to [vercel.com/new](https://vercel.com/new) and import
`taylordrew4u2/taylordrew4u2`.

- Framework preset: **Next.js** (auto-detected)
- Root directory: **`./`** — leave it alone
- Build command / output directory: leave both on the defaults

Let the first deploy finish. The site will render, and the admin will let you
log in — but it cannot save yet. That's step 3.

### 2. Add the environment variables

Project → **Settings → Environment Variables**. Add all three to **Production,
Preview and Development**:

| Name | Value | Why |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://pinsandneedlescomedy.com` | Canonical URLs, sitemap, RSS and `llms.txt` all build off this. No trailing slash. |
| `ADMIN_SECRET` | output of `openssl rand -hex 32` | Signs the admin session cookie. Without it you get logged out on every deploy. |
| `ADMIN_PASSWORD` | whatever you want | Optional. Defaults to `weed` if you leave it out. |

### 3. Add a Blob store — required

Project → **Storage → Create → Blob** → connect it to this project.

Vercel's filesystem is read-only, so the app's default file storage cannot write
there. Connecting a Blob store sets `BLOB_READ_WRITE_TOKEN`, and the app switches
over to it automatically — no code change, no config. This is where your content
and every image you upload will live.

The free Blob allowance is far more than this site will use.

If you skip this, `/admin` shows an orange banner saying saving is not set up.

### 4. Redeploy

Environment variables and storage bindings do not apply to a build that already
happened. Go to **Deployments**, open the most recent one, and hit
**Redeploy**.

Now open `/admin` on the deployed URL, change something, and confirm the header
says *Saved*.

### 5. Point the domain at Vercel — whenever you're ready

Project → **Settings → Domains** → add `pinsandneedlescomedy.com` and follow the
DNS records it gives you.

> **Before you move the DNS:** `pinsandneedlescomedy.com` currently resolves to
> your Shopify storefront. The moment the apex record moves, that address stops
> serving Shopify. Two things to do first:
>
> 1. Copy your Shopify Buy Button embed code into **Admin → Shop** so the store
>    still works on the new site (see [Shop](#shop) below).
> 2. Keep your `*.myshopify.com` URL handy — checkout still runs through Shopify,
>    and you'll need that address to generate embed code later.

### Redeploys and your content

Your content lives in Blob storage, not in the repo, so pushing code or
redeploying never touches anything you wrote in the admin.

---

# Running it locally

```bash
npm install
npm run dev
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin — password `weed`

No environment variables needed. Locally the app writes to `data/content.json`
and `public/uploads/`, both gitignored, so your local edits never end up in a
commit. The same is true on any machine with a writable disk — a Codespace, a
VPS, Docker.

---

# Checks

```bash
npm run typecheck   # tsc
npm test            # node's test runner, no extra dependencies
npm run build       # the same build Vercel runs
```

The tests cover the pure logic that would otherwise break silently: the deep
merge that decides how saved content layers over the defaults, slug and meta
text generation, and the markdown-lite renderer — including that HTML in a post
body is escaped rather than executed.

GitHub Actions runs all three on every push to `main` and every pull request
(`.github/workflows/ci.yml`).

---

# The admin

`/admin`, password `weed` (or whatever you set `ADMIN_PASSWORD` to).

**There is no save button.** Every field writes itself about a second after you
stop typing. The header shows `Saving…` then `Saved`. If a save fails it retries
on its own, and the browser warns you before closing a tab with an edit still in
flight.

| Tab | What you can change |
| --- | --- |
| **Home** | Hero logo and its size, panel height, the site name with its font, size and letter spacing, the nav word row, both reel grids, an optional background video |
| **Reels** | One click to sync every reel from the Instagram account (needs an access token, generated once), or add one manually: link, video file, poster frame, caption, alt text, order, published |
| **News** | Every post — and the display settings that apply to *all* posts at once |
| **Shop** | Your Shopify embed code and a storefront link |
| **About Us** | The story, the logo gallery with per-tile sizing, and one card per producer |
| **Contact** | Emails, submissions link, any extra rows |
| **Site & SEO** | Name, colors, fonts, nav links, socials, footer, site-wide SEO defaults |

### Images and cropping

Uploading a cover, headshot, logo or reel poster opens a cropper locked to the
right shape — 9:16 for reel posters, square for headshots and logos, and whatever
you picked under **News → Cover orientation** for post covers. Drag to
reposition, slide to zoom.

Videos, SVGs and GIFs upload untouched — cropping them on a canvas would flatten
the animation or rasterise the vector.

Changing the blog cover orientation re-crops **new** uploads. Re-upload an
existing cover to bring it to the new shape.

### Blog display settings

Under **News → Display**, and they apply to every post at once: cover
orientation, card width, gap, corner radius, image fit, and the title's font,
size, weight, padding, alignment, case and color, plus how dark the overlay
behind it sits.

---

# SEO and AI SEO

Every page and every post carries its own block: meta title, meta description,
keywords, share image, canonical URL, an **AI summary** written for answer
engines, and a list of FAQ entries.

Each field arrives **prefilled with a suggestion built from your own content**,
with a character meter telling you whether the length works and a live Google
preview underneath. Edit anything — the suggestion is a starting point, and
"Use suggestion" puts it back if you change your mind.

Generated automatically from all of that:

| URL | What it is |
| --- | --- |
| `/sitemap.xml` | Every page and published post |
| `/robots.txt` | Welcomes GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended and Applebot-Extended by name |
| `/rss.xml` | The news feed |
| `/llms.txt` | A plain-text brief for AI crawlers, assembled from the AI summary and FAQ fields |

Plus JSON-LD on every page: Organization, WebSite, Blog, BlogPosting,
BreadcrumbList and FAQPage.

---

# Reels: how the grid actually works

Instagram's own embed will not autoplay silently, and it drags in its own header
and caption chrome — neither of which fits an edge-to-edge grid. So each tile
plays a **video file hosted on this site**, muted and looping, and clicking it
opens the real Instagram post.

### Automatic — pull everything from the Instagram account

**Admin → Reels → Instagram sync**. Needs a long-lived access token from
Instagram first, which only the account owner can generate (switch to a
Professional account, create a free app at developers.facebook.com, add the
Instagram product, generate the token). Paste it in and click **Sync all reels
from Instagram** — it downloads every reel's video and poster frame, keeps
paging through the account's full history the first time, and on every later
click only pulls whatever is new since the last sync. The token is refreshed
automatically, so this is a one-time setup as long as a sync runs at least
once every couple of months.

Re-syncing never touches a reel already on the site — a manual reorder, an
edited caption, or one you've hidden survives every future sync.

### Manual — for a one-off video that isn't on the Instagram account

1. Paste the Instagram permalink — that's where a click sends people.
2. Upload the video. Your original export works; so does the reel downloaded
   from Instagram.
3. Optionally upload a poster frame. Without one, the first video frame shows
   while the video loads.

Tiles far off screen pause themselves, so the infinite grid at the bottom of the
home page stays smooth however long it gets.

Until reels exist, both grids collapse to a single "Watch on Instagram" band.

---

# Shop

`/shop` renders whatever embed code you paste into **Admin → Shop**. Scripts in
that snippet are executed, so Shopify's Buy Button code works exactly as copied.

To get it: Shopify admin → **Sales channels → Buy Button** → build a product or
collection button → choose a layout → **Copy code** → paste it in. It saves
itself.

An `<iframe>` from any other storefront works here too.

---

# Layout of the code

```
src/app/            routes: /, /news, /news/[slug], /shop, /about, /contact, /admin
src/app/api/admin/  login, logout, content (auto-save), upload
src/app/admin/      the admin UI — tabs, cropper, SEO editor
src/components/     hero, reel grid, news marquee, shop embed, footer
src/lib/            content types, defaults, storage driver, SEO helpers, JSON-LD
```

`src/lib/store.ts` is the only file that touches storage. It picks its driver at
startup — Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set, the filesystem
otherwise — so nothing else in the codebase knows or cares where content lives.

Content read from storage is merged over `src/lib/defaults.ts`, which means
adding a field to the content model never needs a migration: existing saved
content just picks up the new default.

---
---

# Taylor Drew

**iOS & Full-Stack Developer** — SwiftUI · Next.js · TypeScript · New York City

I ship production software for messy, real-world workflows. Two products are live and in active use: a native iOS app on the App Store and web tools running real comedy and film productions. I build with clean architecture and write code that holds up under pressure and stays maintainable long after launch.

---

## Tech

**Mobile**
SwiftUI · SwiftData · CloudKit · on-device AI / transcription

**Web & Full-Stack**
Next.js · React · TypeScript · Tailwind · PWA · Prisma · PostgreSQL / Turso · REST APIs · real-time & offline sync

**Architecture & Practices**
System design · authentication & security · client-side encryption · testing · CI/CD · documentation

**Integrations**
Stripe · Clerk · AI Vision / OCR · Git

---

## Live Projects

### The Bit Binder — iOS · App Store

Native app for stand-up comedians to capture, organize, record, transcribe, and refine material with on-device AI.

SwiftUI · SwiftData · CloudKit — [App Store](https://apps.apple.com/us/app/the-bitbinder/id6756085897) · [Code](https://github.com/taylordrew4u2/The-Bit-Binder)

### Showrunner — Web · In production

Live show-production tool used in real comedy performances. Build lineups, import schedules from a photo via AI, and run a full-screen live mode with cue timers and walk-on music.

React 19 · TypeScript · Turso (client-side encryption) — [Live](https://icanrunashow.com) · [Code](https://github.com/taylordrew4u2/showrunner)

### Role-Call — Web · Live

End-to-end film production planner: crew roles, cast, scripts, and schedules in one place.

Next.js · TypeScript · Clerk · Drizzle — [Live](https://rolecall.space) · [Code](https://github.com/taylordrew4u2/Role-Call)

### The Trip Handler — Web

Group-trip organizer with private invites, application approvals, shared itinerary and expenses, and Stripe payments.

Next.js · TypeScript · Prisma · Stripe — [Code](https://github.com/taylordrew4u2/the-trip-handler)

### Bill Spilt — Web

Roommate bill-splitting, stripped to the essentials.

Next.js · TypeScript — [Code](https://github.com/taylordrew4u2/BillBuddies)

### VlogNudge — iOS

ADHD-aware app that nudges users to film a short daily vlog clip.

SwiftUI — [Code](https://github.com/taylordrew4u2/vlognudge)

---

## About

I came to software from producing and performing live comedy in New York City, environments where things break in real time and there is no second take. That is the standard I build to: tools that work under pressure, for real people, on the night it matters. I ship fast and build to last.

---

## Open to work

Open to any role where I can ship and learn — engineering, product, support, ops, early-stage everything. Full-time or contract, remote or New York City. I move fast, figure things out, and do the work. If you are building something real, reach out.

**Email:** [taylordrew4u@gmail.com](mailto:taylordrew4u@gmail.com)
